// src/components/blocks/command-menu.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  BugIcon,
  CalendarIcon,
  CircleUserIcon,
  ExternalLinkIcon,
  MoonIcon,
  PillIcon,
  SearchIcon,
  StethoscopeIcon,
  SunIcon,
} from "lucide-react";
import * as React from "react";

import type { SearchCategory, SearchResult } from "@/features/search/schema";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { globalSearchQuery } from "@/features/search/queries";
import { useTheme } from "@/hooks/use-theme";
import { NAV_ITEMS, RESOURCES } from "@/lib/shadcn/navigation";

// ── Constants ──────────────────────────────────────────────────────────

const CAT_ICON: Record<SearchCategory, React.ComponentType<{ className?: string }>> = {
  patient: CircleUserIcon,
  appointment: CalendarIcon,
  prescription: PillIcon,
  diagnosis: StethoscopeIcon,
  measurement: StethoscopeIcon,
};

const CAT_LABEL: Record<SearchCategory, string> = {
  patient: "Patients",
  prescription: "Prescriptions",
  diagnosis: "Diagnoses",
  appointment: "Appointments",
  measurement: "Measurements",
};

// Order categories deterministically in render, regardless of score order.
const CAT_ORDER: SearchCategory[] = [
  "patient",
  "prescription",
  "diagnosis",
  "appointment",
  "measurement",
];

// ── Props ──────────────────────────────────────────────────────────────

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportIssue: () => void;
  clinicId: string;
}

// ── Component ──────────────────────────────────────────────────────────

export function CommandMenu({ open, onOpenChange, onReportIssue, clinicId }: CommandMenuProps) {
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();
  const ThemeIcon = resolvedTheme === "dark" ? SunIcon : MoonIcon;

  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  // Debounce — 180ms feels instant but coalesces fast typers.
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(t);
  }, [query]);

  // Reset on close so reopening starts fresh (adjust state during render to avoid cascading effect renders).
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setQuery("");
      setDebounced("");
    }
  }

  const searching = debounced.length >= 2;
  const searchQ = useQuery({
    ...globalSearchQuery(clinicId, debounced),
    // Don't run the query at all below the min length.
    enabled: searching,
  });

  // Group results by category, preserving `CAT_ORDER`.
  const grouped = React.useMemo(() => {
    const g = new Map<SearchCategory, SearchResult[]>();
    for (const r of searchQ.data?.results ?? []) {
      const list = g.get(r.category);
      if (list) list.push(r);
      else g.set(r.category, [r]);
    }
    return CAT_ORDER.filter((c) => g.has(c)).map((c) => ({
      category: c,
      items: g.get(c),
    }));
  }, [searchQ.data]);

  const hasResults = grouped.length > 0;

  const run = React.useCallback(
    (action: () => void) => {
      onOpenChange(false);
      action();
    },
    [onOpenChange],
  );

  const goHref = React.useCallback(
    (href: string) => run(() => void navigate({ to: href })),
    [navigate, run],
  );

  // Filtering rule (single decision point):
  //   < 2 chars → show all pages / resources / actions unfiltered; entity query is disabled.
  //   ≥ 2 chars → filter pages / resources / actions by the same substring that drives the
  //               entity search, so both lists are always consistent.
  // A 1-char entry therefore shows the full static lists with no entity results.
  // This is intentional: a single character is below the minimum useful search term.
  const debouncedLower = debounced.toLowerCase();

  const filteredPages = React.useMemo(() => {
    if (!searching) return NAV_ITEMS;
    return NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(debouncedLower));
  }, [searching, debouncedLower]);

  const filteredResources = React.useMemo(() => {
    if (!searching) return RESOURCES;
    return RESOURCES.filter((item) => item.label.toLowerCase().includes(debouncedLower));
  }, [searching, debouncedLower]);

  const actions = React.useMemo(
    () => [
      {
        id: "action:goto-patients",
        label: "Go to Patients",
        icon: SearchIcon,
        run: () => goHref("/app/patients"),
      },
      {
        id: "action:report",
        label: "Report An Issue",
        icon: BugIcon,
        run: () => run(onReportIssue),
      },
      {
        id: "action:toggle-theme",
        label: "Toggle Theme",
        icon: ThemeIcon,
        run: () => run(toggleTheme),
      },
    ],
    [ThemeIcon, goHref, onReportIssue, run, toggleTheme],
  );

  const filteredActions = React.useMemo(() => {
    if (!searching) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(debouncedLower));
  }, [searching, debouncedLower, actions]);

  const hasAnyItems =
    hasResults ||
    filteredPages.length > 0 ||
    filteredResources.length > 0 ||
    filteredActions.length > 0;

  return (
    <CommandDialog onOpenChange={onOpenChange} open={open}>
      <Command shouldFilter={false}>
        <CommandInput
          aria-label="Search patients, prescriptions, diagnoses, and commands"
          onValueChange={setQuery}
          placeholder="Search patients, meds, diagnoses, or type a page…"
          value={query}
        />

        <CommandList>
          {/* ── Error ─────────────────────────────────────────────── */}
          {searchQ.isError && (
            <p className="text-destructive px-3 py-2 text-sm">Search failed. Try again.</p>
          )}

          {/* ── Empty states ──────────────────────────────────────── */}
          {!searchQ.isError && !hasAnyItems && <CommandEmpty>No results found.</CommandEmpty>}

          {/* ── Live entity results ───────────────────────────────── */}
          {hasResults &&
            grouped.map(({ category, items }) => {
              const Icon = CAT_ICON[category];
              return (
                <CommandGroup heading={CAT_LABEL[category]} key={category}>
                  {items?.map((r) => (
                    <CommandItem
                      key={`${r.category}:${r.id}`}
                      onSelect={() => goHref(r.href)}
                      value={`${r.category}:${r.id}:${r.title}`}
                    >
                      <Icon className="" />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{r.title}</span>
                        {r.subtitle && <span className=" truncate text-xs">{r.subtitle}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}

          {/* ── Pages (hidden while searching with results) ──────── */}
          {filteredPages.length > 0 && (
            <CommandGroup heading="Pages">
              {filteredPages.map((item) => (
                <CommandItem
                  key={item.to}
                  onSelect={() => goHref(item.to)}
                  value={`page:${item.to}:${item.label}`}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredResources.length > 0 && (
            <CommandGroup heading="Resources">
              {filteredResources.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => run(() => window.open(item.href, "_blank", "noreferrer"))}
                  value={`resource:${item.href}:${item.label}`}
                >
                  <item.icon />
                  <span>{item.label}</span>
                  <CommandShortcut>
                    <ExternalLinkIcon aria-hidden="true" />
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* ── Actions ─────────────────────────────────────────── */}
          {filteredActions.length > 0 && (
            <>
              {(hasResults || filteredPages.length > 0 || filteredResources.length > 0) && (
                <CommandSeparator />
              )}
              <CommandGroup heading="Actions">
                {filteredActions.map((action) => (
                  <CommandItem key={action.id} onSelect={action.run} value={action.id}>
                    <action.icon className="" />
                    <span>{action.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* ── Footer: latency + tips ─────────────────────────────── */}
        <div className=" flex items-center justify-between border-t px-3 py-2 text-[11px]">
          <span>
            {searchQ.isFetching
              ? "Searching…"
              : searchQ.data
                ? `${searchQ.data.results.length} result${
                    searchQ.data.results.length === 1 ? "" : "s"
                  } · ${searchQ.data.elapsedMs}ms`
                : "Search across the clinic"}
          </span>
          <span>↑↓ navigate · ⏎ open · esc close</span>
        </div>
      </Command>
    </CommandDialog>
  );
}
