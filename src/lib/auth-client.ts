import {
  adminClient,
  customSessionClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env } from "#/env.ts";

import type { auth } from "./auth";

import { ac, roles } from "./auth/permissions";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return env.VITE_BASE_URL;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    customSessionClient<typeof auth>(),
    adminClient({ ac, roles }),
    inferAdditionalFields<typeof auth>(),
  ],
});
export const { useSession, signIn, signUp, signOut } = authClient;
