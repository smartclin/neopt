// src/features/search/hooks/use-search-shortcut.ts
import * as React from "react";

import { useSearchDialog } from "./SearchCommand";

export function useSearchShortcut() {
  const { setOpen } = useSearchDialog();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (!isCmdK) return;
      e.preventDefault();
      setOpen((prev) => !prev);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setOpen]);
}
