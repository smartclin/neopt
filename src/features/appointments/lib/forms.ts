/** TanStack Form hands back `unknown[]`; pull a readable string out. */
export function fieldErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
}

/** Unwrap TanStack Form's error-map shape (`{ form: "message" }`). */
export function formErrorMessage(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "form" in err) {
    const f = (err as { form: unknown }).form;
    if (typeof f === "string") return f;
  }
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return null;
}
