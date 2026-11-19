/**
 * TanStack Form exposes field errors as `unknown[]` (it accepts strings,
 * Zod issues, standard-schema issues, and thrown errors). Normalise to a
 * displayable string or `undefined`.
 */
export function fieldErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
}

/** Read the first field error and normalise it. */
export function firstFieldError(errors: readonly unknown[]): string | undefined {
  return fieldErrorMessage(errors[0]);
}
