// src/db/test-worker.ts
//
// Bun entry point for integration tests (`bun test:worker`).
//
// Not a Cloudflare Worker: this project runs on Bun + TanStack Start, so
// "worker" here means a minimal HTTP server that boots the server-side
// stack (env → Drizzle → Better Auth → query cache) and exposes a health
// endpoint. If any layer fails to import or initialize, `/health` returns
// 500 with the failing layer, so integration tests fail with a useful
// message instead of a mysterious 404 from the app.
//
// Why this file exists:
//   - Fallow treats it as an entry point, which is how `src/db/index.ts`,
//     `src/db/schema.ts`, and `src/lib/auth.ts` become reachable without
//     marking every route as an entry.
//   - `bun test:worker` runs against a real Bun server, so Drizzle's
//     `PRAGMA foreign_keys = ON` and Better Auth's handler are exercised
//     exactly as they are in production.

import {checkIsDbReady, closeDb} from "#/db/index.ts";
import {queryCache} from "#/db/cache.ts";
import {env} from "#/env.ts";
import {auth} from "#/lib/auth.ts";

const PORT = Number(env.PORT ?? 0); // 0 = OS-assigned, printed below

type Layer = "env" | "db" | "auth" | "cache";

const layerStatus: Record<Layer, "ok" | "fail" | "unchecked"> = {
  env: "ok", // reaching this line means env parsed
  db: "unchecked",
  auth: "unchecked",
  cache: "unchecked",
};

// Declare the server without an initializer so `fetch` can reference it
// (via `server.port`) without creating a circular inference. Assign with a
// `let` + explicit type.
let server: ReturnType<typeof Bun.serve>;
let boundPort = 0;

server = Bun.serve({
  port: PORT,
  fetch: async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      // Probe each layer independently so one failure doesn't mask another.
      layerStatus.db = (await checkIsDbReady()) ? "ok" : "fail";

      layerStatus.auth =
        typeof auth?.api?.getSession === "function" ? "ok" : "fail";

      layerStatus.cache =
        typeof queryCache?.get === "function" &&
        typeof queryCache?.set === "function"
          ? "ok"
          : "fail";

      const failed = (Object.entries(layerStatus) as [Layer, string][]).filter(
        ([, v]) => v === "fail",
      );

      const body: {
        ok: boolean;
        layers: Record<Layer, "ok" | "fail" | "unchecked">;
        failed: Layer[];
        pid: number;
        port: number;
      } = {
        ok: failed.length === 0,
        layers: layerStatus,
        failed: failed.map(([k]) => k as Layer),
        pid: process.pid,
        port: boundPort,
      };

      return Response.json(body, { status: body.ok ? 200 : 500 });
    }

    // Better Auth mounts its handler under /api/auth/*. Forwarding here
    // proves the handler is wired the same way the app wires it, without
    // pulling in TanStack Start's router.
    if (url.pathname.startsWith("/api/auth/")) {
      return auth.handler(request);
    }

    return new Response(null, { status: 404 });
  },
});

boundPort = server.port??0;
console.log(`[test-worker] listening on http://localhost:${boundPort}`);

// Graceful shutdown so `bun test:worker` cleans up the SQLite handle.
const shutdown = async (): Promise<void> => {
  await closeDb();
  server.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
