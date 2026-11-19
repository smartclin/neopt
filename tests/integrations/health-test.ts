// tests/integration/health.test.ts
export {};

const proc = Bun.spawn(["bun", "run", "src/test-worker.ts"], {
  stdout: "pipe",
  env: { ...process.env, DB_FILE_NAME: ":memory:" },
});
const port = await new Promise<number>((resolve) => {
  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder();
  (async () => {
    for (;;) {
      const { value } = await reader.read();
      if (!value) return;
      const m = decoder.decode(value).match(/localhost:(\d+)/);
      if (m) return resolve(Number(m[1]));
    }
  })();
});

const res = await fetch(`http://localhost:${port}/health`);
expect(res.status).toBe(200);
const body = await res.json();
expect(body.layers).toEqual({ env: "ok", db: "ok", auth: "ok", cache: "ok" });
