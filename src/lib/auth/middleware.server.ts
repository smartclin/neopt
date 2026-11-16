// lib/auth/middleware.server.ts
import { createMiddleware } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";

import { _getUserImpl } from "./functions.server.ts";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const user = await _getUserImpl();
  if (!user) {
    setResponseStatus(401);
    throw new Error("Unauthorized");
  }
  return next({ context: { user } });
});

export const freshAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const user = await _getUserImpl({ disableCookieCache: true });
  if (!user) {
    setResponseStatus(401);
    throw new Error("Unauthorized");
  }
  return next({ context: { user } });
});
