// src/features/search/components/SearchCommand.tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CalendarIcon, CircleUserIcon, PillIcon, StethoscopeIcon } from "lucide-react";
import * as React from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import type { SearchCategory, SearchResult } from "./schema";

import { globalSearchQuery } from "./queries";

const CAT_ICON: Record<SearchCategory, React.ComponentType<{ className?: string }>> = {
  patient: CircleUserIcon,
  appointment: CalendarIcon,
  prescription: PillIcon,
  diagnosis: StethoscopeIcon,
  measurement: StethoscopeIcon,
};

const CAT_LABEL: Record<SearchCategory, string> = {
  patient: "Patients",
  appointment: "Appointments",
  prescription: "Prescriptions",
  diagnosis: "Diagnoses",
  measurement: "Measurements",
};

// Minimal context so the shortcut hook can open/close without prop-drilling.
const Ctx = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({ open: false, setOpen: () => {} });

export function useSearchDialog() {
  return React.useContext(Ctx);
}

interface SearchCommandProviderProps {
  clinicId: string;
  children: React.ReactNode;
}

export function SearchCommandProvider({ clinicId, children }: SearchCommandProviderProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {children}
      <SearchCommand clinicId={clinicId} onOpenChange={setOpen} open={open} />
    </Ctx.Provider>
  );
}

function SearchCommand({
  clinicId,
  open,
  onOpenChange,
}: {
  clinicId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(t);
  }, [query]);

  // Handle open state changes without triggering cascading synchronous render effects
  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setQuery("");
        setDebounced("");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  const { data, isFetching, isError } = useQuery(globalSearchQuery(clinicId, debounced));

  const grouped = React.useMemo(() => {
    const g: Partial<Record<SearchCategory, SearchResult[]>> = {};
    for (const r of data?.results ?? []) {
      let bucket = g[r.category];
      if (!bucket) {
        bucket = [];
        g[r.category] = bucket;
      }
      bucket.push(r);
    }
    return g;
  }, [data]);

  const go = React.useCallback(
    (r: SearchResult) => {
      handleOpenChange(false);
      void navigate({ to: r.href });
    },
    [navigate, handleOpenChange],
  );

  return (
    <CommandDialog onOpenChange={handleOpenChange} open={open}>
      <Command shouldFilter={false}>
        <CommandInput
          onValueChange={setQuery}
          placeholder="Search patients, meds, diagnoses…"
          value={query}
        />
        <CommandList>
          {isError && (
            <p className="text-destructive px-3 py-2 text-sm">Search failed. Try again.</p>
          )}
          {!isError && debounced.length < 2 && (
            <p className="text-muted-foreground px-3 py-4 text-sm">Type at least 2 characters.</p>
          )}
          {!isError && debounced.length >= 2 && !isFetching && !data?.results.length && (
            <CommandEmpty>No matches for “{debounced}”.</CommandEmpty>
          )}
          {Object.entries(grouped).map(([cat, items]) => {
            const Icon = CAT_ICON[cat as SearchCategory];
            return (
              <CommandGroup heading={CAT_LABEL[cat as SearchCategory]} key={cat}>
                {items?.map((r) => (
                  <CommandItem
                    key={`${r.category}:${r.id}`}
                    onSelect={() => go(r)}
                    value={`${r.category}:${r.id}`}
                  >
                    <Icon className="text-muted-foreground size-4" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{r.title}</span>
                      {r.subtitle && (
                        <span className="text-muted-foreground truncate text-xs">{r.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
        <div className="text-muted-foreground flex items-center justify-between border-t px-3 py-2 text-[11px]">
          <span>
            {isFetching
              ? "Searching…"
              : data
                ? `${data.results.length} result${data.results.length === 1 ? "" : "s"} · ${data.elapsedMs}ms`
                : "Press ⌘K to open"}
          </span>
          <span>↑↓ navigate · ⏎ open · esc close</span>
        </div>
      </Command>
    </CommandDialog>
  );
}
