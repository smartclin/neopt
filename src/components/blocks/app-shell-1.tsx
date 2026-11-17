// src/components/blocks/app-shell.tsx
import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarPlusIcon, ExternalLinkIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react";
import * as React from "react";

// ✅ Verify this path matches your real auth hook location.
import { useAuthSuspense } from "#/lib/auth/hooks.ts";
import { LazyMount } from "@/components/blocks/lazy-mount";
import { Icons, LogoMark } from "@/components/icons";
import { Kbd, KbdGroup } from "@/components/ui/kdb";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLazyDialog } from "@/hooks/use-lazy-dialog";
import { useTheme } from "@/hooks/use-theme";
import { NAV_ITEMS, RESOURCES } from "@/lib/shadcn/navigation";

import { useSignOut } from "../sign-out-button";

const loadCommandMenu = () => import("@/components/blocks/command-menu");
const CommandMenu = React.lazy(() => loadCommandMenu().then((m) => ({ default: m.CommandMenu })));
const preloadCommandMenu = () => void loadCommandMenu().catch(() => {});

const loadVisitForm = () => import("@/features/index");
const VisitForm = React.lazy(() => loadVisitForm().then((m) => ({ default: m.VisitForm })));

const ISSUE_URL = "https://github.com/7ovr/starter/issues/new";
function openIssuePage() {
  window.open(ISSUE_URL, "_blank", "noreferrer");
}

/** Safe mod-key label that works in SSR + jsdom. */
function useModKey() {
  return React.useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl";
    return /Mac|iPhone|iPad/i.test(navigator.userAgent) ? "⌘" : "Ctrl";
  }, []);
}

function Brand() {
  return (
    <Link aria-label="Pediatric Clinic" className="flex items-center gap-2 " to="/">
      <LogoMark className="size-5 shrink-0" />
      <span className="flex items-center gap-1.5">
        <span className="font-branding text-lg leading-none font-bold tracking-tight">
          Pediatric
        </span>
        <span aria-hidden="true" className="text-xs leading-none">
          /
        </span>
        <span className=" text-xs leading-none font-light">Clinic</span>
      </span>
    </Link>
  );
}

function InsetTopBar() {
  const { isMobile, state } = useSidebar();
  if (isMobile) {
    return (
      <div className="flex h-12 items-center border-b px-4">
        <SidebarTrigger />
      </div>
    );
  }
  if (state === "expanded") return null;
  return (
    <div className="absolute top-3 left-3 z-10">
      <SidebarTrigger />
    </div>
  );
}

function CloseSheetOnNavigate() {
  const { setOpenMobile } = useSidebar();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  React.useEffect(() => {
    if (pathname) {
      setOpenMobile(false);
    }
  }, [pathname, setOpenMobile]);
  return null;
}

function CollapsedSearch({ onOpen }: { onOpen: () => void }) {
  const { isMobile, state } = useSidebar();
  if (isMobile || state === "expanded") return null;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onOpen}
        onFocus={preloadCommandMenu}
        onPointerEnter={preloadCommandMenu}
        size="sm"
        tooltip="Search"
      >
        <SearchIcon aria-hidden="true" />
        <span>Search</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/**
 * Extracts the current patient id from the real route tree:
 *   /app/patients/<id>       -> "<id>"
 *   /app/patients/<id>/edit  -> "<id>"
 *   /app/patients/<id>/growth-> "<id>"
 */
function useCurrentPatientId() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return React.useMemo(() => {
    const m = pathname.match(/^\/app\/patients\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);
}

export function AppShell({ children }: { children?: React.ReactNode }) {
  const { clinicId } = useAuthSuspense();
  const command = useLazyDialog();
  const quickVisit = useLazyDialog();
  const { signOut, pending: signingOut } = useSignOut(); // ✅ new
  const setCommandOpen = command.setOpen;
  const openCommand = () => command.setOpen(true);
  const openQuickVisit = () => quickVisit.setOpen(true);

  const patientId = useCurrentPatientId();
  const { resolvedTheme, toggleTheme } = useTheme();
  const modKey = useModKey();

  // ✅ Single owner of ⌘K. Do not add a second listener in
  //    command-menu.tsx or via useSearchShortcut.
  //    Escape is additive (won't fire the ⌘K branch).
  const commandOpen = command.open;
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return;

      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        setCommandOpen((open) => !open);
        return;
      }

      if (event.key === "Escape" && commandOpen) {
        setCommandOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setCommandOpen, commandOpen]);

  return (
    <SidebarProvider defaultOpen>
      <CloseSheetOnNavigate />

      <Sidebar collapsible="icon">
        <nav aria-label="Sidebar" className="flex min-h-0 flex-1 flex-col">
          <SidebarHeader>
            <div className="flex h-9 items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
              <span className="group-data-[collapsible=icon]:hidden">
                <Brand />
              </span>
              <span className="group-data-[collapsible=icon]:hidden">
                <SidebarTrigger />
              </span>
              <Link
                aria-label="Pediatric Clinic"
                className="hidden size-8 place-items-center group-data-[collapsible=icon]:grid"
                to="/"
              >
                <LogoMark className="size-5" />
              </Link>
            </div>

            <button
              aria-keyshortcuts={modKey === "⌘" ? "Meta+K" : "Control+K"}
              className="bg-background  hover:text-foreground focus-visible:ring-ring flex h-7 w-full items-center gap-2 rounded-md border px-2 text-xs transition-colors group-data-[collapsible=icon]:hidden focus-visible:ring-2 focus-visible:outline-none"
              onClick={openCommand}
              onFocus={preloadCommandMenu}
              onPointerEnter={preloadCommandMenu}
              type="button"
            >
              <SearchIcon aria-hidden="true" className="size-4 shrink-0" />
              <span className="flex-1 text-left">Search patients, visits…</span>
              <KbdGroup>
                <Kbd>{modKey}</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </button>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Clinic</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <CollapsedSearch onOpen={openCommand} />
                  {NAV_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        render={
                          <Link
                            activeOptions={{ exact: item.to === "/app" }}
                            activeProps={{ "aria-current": "page" }}
                            to={item.to}
                          />
                        }
                        size="sm"
                        tooltip={item.label}
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>References</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {RESOURCES.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={
                          <a
                            aria-label={item.label}
                            href={item.href}
                            rel="noreferrer"
                            target="_blank"
                          />
                        }
                        size="sm"
                        tooltip={item.label}
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                        <ExternalLinkIcon
                          aria-hidden="true"
                          className=" ml-auto group-data-[collapsible=icon]:hidden"
                        />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  disabled={!patientId}
                  onClick={patientId ? openQuickVisit : undefined}
                  size="sm"
                  tooltip={patientId ? "New visit" : "Open a patient to record a visit"}
                >
                  <CalendarPlusIcon aria-hidden="true" />
                  <span>New Visit</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={toggleTheme} size="sm" tooltip="Toggle Theme">
                  {resolvedTheme === "dark" ? (
                    <SunIcon aria-hidden="true" />
                  ) : (
                    <MoonIcon aria-hidden="true" />
                  )}
                  <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  <span className="ml-auto group-data-[collapsible=icon]:hidden">
                    <Kbd>D</Kbd>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* ✅ fixed: nested, disabled while pending, tooltip in collapsed mode */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  disabled={signingOut}
                  onClick={() => void signOut()}
                  size="sm"
                  tooltip={signingOut ? "Signing out…" : "Sign out"}
                >
                  <Icons.logOut aria-hidden="true" />
                  <span>{signingOut ? "Signing out…" : "Sign out"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </nav>
      </Sidebar>

      <SidebarInset>
        <InsetTopBar />
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-10 md:py-14">
          {children}
        </div>
      </SidebarInset>

      <LazyMount onError={command.reset} used={command.used}>
        {clinicId && (
          <CommandMenu
            clinicId={clinicId}
            onOpenChange={command.setOpen}
            onReportIssue={openIssuePage}
            open={command.open}
          />
        )}
      </LazyMount>

      {patientId && (
        <LazyMount onError={quickVisit.reset} used={quickVisit.used}>
          <VisitForm inline patientId={patientId} />
        </LazyMount>
      )}
    </SidebarProvider>
  );
}
