// src/integrations/tanstack-query/root-provider.tsx

import type { ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "./query-client";

export function getContext() {
  return { queryClient: getQueryClient() };
}

// Either delete this stub, or wire it into router.tsx's Wrap in place
// of the inline QueryClientProvider. Don't keep both.
export function TanstackQueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
