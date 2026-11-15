import { createServerFn } from "@tanstack/react-start";

export interface GetUserServerQuery {
  disableCookieCache?: boolean | undefined;
  disableRefresh?: boolean | undefined;
}

export interface GetUserServerQuery {
  disableCookieCache?: boolean | undefined;
  disableRefresh?: boolean | undefined;
}

/**
 * Client-callable RPC. The dynamic import of `.server.ts` is safe here
 * because the entire `.handler()` body is stripped from the client
 * bundle by TanStack Start's compiler — the import never reaches the
 * browser.
 */
export const $getUser = createServerFn({ method: "GET" }).handler(async () => {
  const { _getUserImpl } = await import("./functions.server.ts");
  const user = await _getUserImpl();
  if (!user) return null;
  return user;
});
