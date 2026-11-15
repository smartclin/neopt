export class Database {
  filename: string;
  constructor(filename = ":memory:") {
    this.filename = filename;
  }
  query() {
    return {
      get: () => null,
      all: () => [],
      run: () => ({ changes: 0, lastInsertRowid: 0 }),
      values: () => [],
    };
  }
  prepare() {
    return this.query();
  }
  run() {
    return { changes: 0, lastInsertRowid: 0 };
  }
  exec() {}
  transaction<T>(fn: (tx: unknown) => T): T {
    return fn(this);
  }
  close() {}
}

export default { Database };
