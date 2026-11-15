import { describe, expect, it } from "vite-plus/test";

import { createServerFnIdGenerator, DuplicateServerFunctionIdError } from "#/utils/server-fn-id";

describe("createServerFnIdGenerator", () => {
  it("uses the function name as a stable id across file moves", () => {
    const previousBuildId = createServerFnIdGenerator()({
      filename: "src/old-file.ts",
      functionName: "listExpenses",
    });
    const currentBuildId = createServerFnIdGenerator()({
      filename: "src/new-file.ts",
      functionName: "listExpenses",
    });
    expect(currentBuildId).toBe(previousBuildId);
  });

  it("strips the compiler's handler suffix", () => {
    const generateId = createServerFnIdGenerator();
    expect(
      generateId({
        filename: "src/expenses.ts",
        functionName: "listExpenses_createServerFn_handler",
      }),
    ).toBe("listExpenses");
  });

  it("does not strip a user-authored name that happens to end with the suffix", () => {
    // The compiler asks about the *user's* export, which already ends with
    // `_createServerFn_handler`; the compiler adds its own suffix on top,
    // so the hook sees `foo_createServerFn_handler_createServerFn_handler`.
    // It strips exactly one layer, leaving the user's name intact.
    const generateId = createServerFnIdGenerator();
    expect(
      generateId({
        filename: "src/weird.ts",
        functionName: "foo_createServerFn_handler_createServerFn_handler",
      }),
    ).toBe("foo_createServerFn_handler");
  });

  it("returns the same id for the same file + name, any number of times", () => {
    const generateId = createServerFnIdGenerator();
    for (let i = 0; i < 5; i++) {
      expect(
        generateId({
          filename: "src/expenses.ts",
          functionName: "listExpenses",
        }),
      ).toBe("listExpenses");
    }
  });

  it("rejects duplicate ids from different files", () => {
    const generateId = createServerFnIdGenerator();
    generateId({ filename: "src/expenses.ts", functionName: "listExpenses" });

    expect(() =>
      generateId({
        filename: "src/reports.ts",
        functionName: "listExpenses_createServerFn_handler",
      }),
    ).toThrow(DuplicateServerFunctionIdError);
  });

  it("exposes the colliding owners on the error", () => {
    const generateId = createServerFnIdGenerator();
    generateId({ filename: "src/expenses.ts", functionName: "listExpenses" });

    try {
      generateId({ filename: "src/reports.ts", functionName: "listExpenses" });
      expect.unreachable("expected DuplicateServerFunctionIdError");
    } catch (err) {
      expect(err).toBeInstanceOf(DuplicateServerFunctionIdError);
      const e = err as DuplicateServerFunctionIdError;
      expect(e.id).toBe("listExpenses");
      expect(e.firstOwner).toBe("src/expenses.ts");
      expect(e.secondOwner).toBe("src/reports.ts");
    }
  });

  it("prefixes every id when a salt is provided", () => {
    const generateId = createServerFnIdGenerator({ salt: "web" });
    expect(generateId({ filename: "src/a.ts", functionName: "listExpenses" })).toBe(
      "web_listExpenses",
    );
  });

  it("treats an empty salt as no salt", () => {
    const generateId = createServerFnIdGenerator({ salt: "" });
    expect(generateId({ filename: "src/a.ts", functionName: "listExpenses" })).toBe("listExpenses");
  });

  it("allows the same name across builds with different salts", () => {
    const web = createServerFnIdGenerator({ salt: "web" });
    const mobile = createServerFnIdGenerator({ salt: "mobile" });
    expect(web({ filename: "src/a.ts", functionName: "listExpenses" })).toBe("web_listExpenses");
    expect(mobile({ filename: "src/a.ts", functionName: "listExpenses" })).toBe(
      "mobile_listExpenses",
    );
  });

  it("throws on an empty function name", () => {
    const generateId = createServerFnIdGenerator();
    expect(() =>
      generateId({
        filename: "src/a.ts",
        functionName: "_createServerFn_handler",
      }),
    ).toThrow(DuplicateServerFunctionIdError);
  });
});
