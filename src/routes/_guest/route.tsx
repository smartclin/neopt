// src/routes/_guest/route.tsx
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";
import { useEffect } from "react";

import { authQueryOptions } from "#/lib/auth/queries.ts";

const CURRENT_YEAR = new Date().getFullYear();

export const Route = createFileRoute("/_guest")({
  component: GuestLayout,
  beforeLoad: () => {
    return { redirectUrl: "/app" };
  },
});

function GuestLayout() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    ...authQueryOptions(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (user) {
      void navigate({ to: "/app", replace: true });
    }
  }, [navigate, user]);

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-zinc-950">
      {/* Decorative Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] [background-size:24px_24px] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]" />

      <div className="flex w-full max-w-[420px] flex-col gap-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
            <img
              alt="Dr. Hazem Ali Clinic"
              className="size-full object-contain p-2"
              src="/brand/logo-192.png"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Dr. Hazem Ali
            </h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Pediatrician &bull; Neonatologist &bull; IBCLC
            </p>
          </div>
        </div>

        {/* Auth Form Card */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/80">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <HeartPulse className="size-3.5" />
          <span>Secure Medical Portal &copy; {CURRENT_YEAR}</span>
        </div>
      </div>
    </div>
  );
}
