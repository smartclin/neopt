import "@tanstack/react-start/server-only";
import { appendResponseHeader, getRequest } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth.ts";
import type { GetUserServerQuery } from "./functions.ts";

export const _getUserImpl = async (query?: GetUserServerQuery) => {
  const session = await auth.api.getSession({
    headers: getRequest().headers,
    query,
    returnHeaders: true,
  });

  const cookies = session.headers?.getSetCookie();
  if (cookies?.length) {
    appendResponseHeader("Set-Cookie", cookies);
  }

  return session.response?.user || null;
};
