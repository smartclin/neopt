/** Shape of the callback the compiler passes to `generateFunctionId`. */
export interface ServerFnIdInput {
  /**
   * Relative path of the source file (e.g. `src/features/patients/api.ts`).
   * Supplied by the compiler; only used for diagnostics and collision
   * detection — not part of the id.
   */
  filename: string;
  /**
   * The exported binding name as it appears in source. The compiler appends
   * `_createServerFn_handler` to the compiled handler, so this is what the
   * hook receives.
   */
  functionName: string;
}

/** Callback signature expected by `tanstackStart({ serverFns })`. */
export type GenerateFunctionId = (input: ServerFnIdInput) => string;

/**
 * Thrown when two different files (or two different bindings in the same
 * file) produce the same id.
 *
 * Exported so tests and build tooling can branch on it explicitly rather
 * than string-matching the message.
 */
export class DuplicateServerFunctionIdError extends Error {
  readonly id: string;
  readonly firstOwner: string;
  readonly secondOwner: string;

  constructor(id: string, firstOwner: string, secondOwner: string) {
    super(
      `Duplicate server function id "${id}" produced by ` +
        `"${firstOwner}" and "${secondOwner}". ` +
        "Server function ids are the variable name alone, so the name " +
        "must be unique across the codebase. Rename one of the two " +
        "exports, or pass a `salt` to `createServerFnIdGenerator` to " +
        "namespace the ids.",
    );
    this.name = "DuplicateServerFunctionIdError";
    this.id = id;
    this.firstOwner = firstOwner;
    this.secondOwner = secondOwner;
  }
}

/** Matches the compiler-generated handler suffix the hook receives. */
const HANDLER_SUFFIX = "_createServerFn_handler";

/**
 * Strip the compiler's `_createServerFn_handler` suffix, but only when the
 * remaining part would still be a valid identifier. A user-authored export
 * named `foo_createServerFn_handler` would survive this and be treated as a
 * distinct id — that's intentional: the compiler never generates that shape
 * from a user-authored name, so treating it as an error would be hostile to
 * a user who happens to name a server fn that way.
 */
function stripHandlerSuffix(functionName: string): string {
  if (!functionName.endsWith(HANDLER_SUFFIX)) return functionName;
  return functionName.slice(0, -HANDLER_SUFFIX.length);
}

/** Options accepted by `createServerFnIdGenerator`. */
export interface CreateServerFnIdGeneratorOptions {
  /**
   * Optional namespace prepended to every id, e.g. `"web"` →
   * `web_fetchPatientsByClinic`. Only useful if you build multiple bundles
   * from the same source tree and want their ids to be disjoint. Leave
   * unset for the common case (single app build).
   */
  salt?: string;
}

/**
 * Factory — call once per build. Each call owns an independent "already
 * claimed" registry, so a Vite reload gets a fresh map (correct — the
 * previous build's claims are irrelevant).
 */
export function createServerFnIdGenerator(
  options: CreateServerFnIdGeneratorOptions = {},
): GenerateFunctionId {
  const { salt } = options;
  const prefix = salt === undefined || salt === "" ? "" : `${salt}_`;

  // id -> the filename that first produced it. Two different files with the
  // same function name would otherwise be silently deduplicated by the
  // compiler (it appends `_1`, whose ordering isn't stable across builds).
  // We make the collision a **build failure** instead, so it can never
  // silently reorder ids between builds.
  const owners = new Map<string, string>();

  return ({ filename, functionName }) => {
    const base = stripHandlerSuffix(functionName);
    if (base.length === 0) {
      throw new DuplicateServerFunctionIdError(`<empty: ${functionName}>`, filename, filename);
    }

    const id = `${prefix}${base}`;
    const owner = owners.get(id);

    if (owner === undefined) {
      owners.set(id, filename);
      return id;
    }

    if (owner === filename) {
      // Same file, same name — the compiler is asking twice. Idempotent.
      return id;
    }

    // Same id, different file — genuine collision.
    throw new DuplicateServerFunctionIdError(id, owner, filename);
  };
}

/**
 * Convenience: a pre-built generator with no salt. Use only if you're sure
 * `vite.config.ts` will never need the factory form (it usually will, to
 * configure the salt from an env var).
 */
export const generateServerFnId: GenerateFunctionId = createServerFnIdGenerator();
