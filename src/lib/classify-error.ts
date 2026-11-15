export type ErrorKind = "not-found" | "permission" | "network" | "unknown";

export function classifyError(err: unknown): ErrorKind {
  if (err && typeof err === "object") {
    const status = (err as { status?: number }).status;
    const code = (err as { code?: string }).code;
    if (status === 404 || code === "NOT_FOUND") return "not-found";
    if (status === 401 || status === 403 || code === "FORBIDDEN") return "permission";
    if (
      (typeof navigator !== "undefined" && !navigator.onLine) ||
      (err instanceof TypeError && /fetch|network/i.test(err.message))
    )
      return "network";
  }
  return "unknown";
}
