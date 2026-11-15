import path from "node:path";
import { loadEnv } from "vite-plus";
import { configDefaults, defineConfig } from "vite-plus";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode ?? "test", process.cwd(), "TEST_");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined && typeof value === "string") process.env[key] = value;
  }

  return {
    resolve: {
      tsconfigPaths: true,
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
        "@data": path.resolve(import.meta.dirname, "./data"),
        "bun:sqlite": path.resolve(import.meta.dirname, "./src/test/mocks/bun-sqlite.ts"),
        "@tanstack/react-start/server-only": path.resolve(
          import.meta.dirname,
          "./src/test/mocks/empty.ts",
        ),
      },
    },
    test: {
      onConsoleLog(log, type) {
        if (type === "stderr" && log.includes("Error: Offline")) return false;
        if (type === "stderr" && log.includes("Window's scrollTo")) return false;
        if (type === "stderr" && log.includes("Error in route match")) return false;
      },
      exclude: configDefaults.exclude,
      testTimeout: 30_000,
      fileParallelism: true,
      maxConcurrency: 4,
      env: { NODE_ENV: "test" },
      server: {
        deps: {
          inline: [/@tanstack\//, /@testing-library\//, /drizzle-orm/],
        },
      },
      projects: [
        {
          extends: true,
          test: {
            name: "unit",
            // ↓ was: environment: "bun"  ← not a real Vitest environment
            environment: "node",
            setupFiles: ["src/test/setup.ts"],
            include: ["src/**/*.{test,spec}.{ts,tsx}"],
            exclude: [...configDefaults.exclude, "src/**/*.dom.test.{ts,tsx}"],
          },
        },
        {
          extends: true,
          test: {
            name: "dom",
            environment: "jsdom",
            include: ["src/**/*.dom.test.{ts,tsx}"],
            exclude: configDefaults.exclude,
            setupFiles: ["src/test/dom-setup.ts"],
          },
        },
      ],
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "lcov"],
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/**/*.test.*",
          "src/**/*.d.ts",
          "src/routeTree.gen.ts",
          "src/components/ui/**",
        ],
        thresholds: {
          lines: 60,
          functions: 60,
          branches: 50,
          statements: 60,
        },
      },
    },
  };
});
