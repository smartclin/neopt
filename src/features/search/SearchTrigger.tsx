// src/features/search/components/SearchTrigger.tsx
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useSearchDialog } from "./SearchCommand";

export function SearchTrigger() {
  const { setOpen } = useSearchDialog();
  return (
    <Button
      aria-label="Open search (⌘K)"
      className="text-muted-foreground w-full justify-start gap-2"
      onClick={() => setOpen(true)}
      variant="outline"
    >
      <SearchIcon className="size-4" />
      <span className="flex-1 text-left">Search…</span>
      <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
    </Button>
  );
}
