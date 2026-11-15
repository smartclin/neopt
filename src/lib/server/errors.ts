// src/lib/server/errors.ts
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (msg = "Not found") => new HttpError(404, msg);
export const forbidden = () => new HttpError(403, "Forbidden");
export const badRequest = (msg: string) => new HttpError(422, msg);

/**
 * A 409 with the server's canonical snapshot in the body. The client
 * flusher's `classifyServerError` pulls this out to populate the
 * conflict dialog.
 */
export const conflict = (serverSnapshot: unknown) =>
  new HttpError(409, "Version conflict", { serverSnapshot });
