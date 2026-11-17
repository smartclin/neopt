// src/features/search/components/SearchTrigger.tsx
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useSearchDialog } from "./SearchCommand";

export function SearchTrigger() {
  const { setOpen } = useSearchDialog();
  return (
    <Button
      aria-label="Open search (⌘K)"
      className="w-full justify-start"
      onClick={() => setOpen(true)}
      variant="outline"
    >
      <span className="flex w-full items-center gap-2">
        <SearchIcon className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="bg-muted rounded  py-0.5 font-mono text-[10px]">⌘K</kbd>
      </span>
    </Button>
  );
}
