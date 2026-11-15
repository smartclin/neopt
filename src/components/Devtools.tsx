// src/components/Devtools.tsx
import { a11yDevtoolsPlugin } from "@tanstack/devtools-a11y/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useSyncExternalStore } from "react";

import { getQueryClient } from "#/integrations/tanstack-query/query-client";

function RootDevtools() {
  // Client-only mount — devtools touch window/document at import time.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) return null;

  return (
    <TanStackDevtools
      plugins={[
        {
          name: "TanStack Query",
          // `getQueryClient()` returns the browser singleton — the
          // same instance the app is using. Called inside `render`
          // so it only runs on the client, and only when the panel
          // mounts.
          render: <ReactQueryDevtoolsPanel client={getQueryClient()} />,
        },
        {
          name: "TanStack Router",
          render: <TanStackRouterDevtoolsPanel />,
        },
        formDevtoolsPlugin(),
        a11yDevtoolsPlugin(),
      ]}
    />
  );
}

RootDevtools.displayName = "Devtools";

export default RootDevtools;
