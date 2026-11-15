import { ChevronDownIcon, SearchIcon } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { COMPOSER_DRUGS, type ComposerDrug } from "../formulary";

interface MedicationAutocompleteProps {
  value: string;
  onSelect: (drug: ComposerDrug) => void;
  disabled?: boolean;
}

const AWARE_VARIANT = {
  Access: "success",
  Watch: "warning",
  Reserve: "destructive",
  "Not Applicable": "outline",
} as const;

const MAX_RESULTS = 20;
const INITIAL_RESULTS = 8;

export function MedicationAutocomplete({ value, onSelect, disabled }: MedicationAutocompleteProps) {
  const listboxId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keep the input synced when the parent resets `value` (e.g. after save).
  React.useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMPOSER_DRUGS.slice(0, INITIAL_RESULTS);
    return COMPOSER_DRUGS.filter(
      (d) =>
        d.genericName.toLowerCase().includes(q) ||
        d.brandNames.some((b) => b.toLowerCase().includes(q)) ||
        d.indication.toLowerCase().includes(q),
    ).slice(0, MAX_RESULTS);
  }, [query]);

  // Reset active index whenever the list changes so we never point past
  // the end of a shrunken list.
  React.useEffect(() => {
    setActiveIndex(0);
  }, []);

  const choose = React.useCallback(
    (drug: ComposerDrug) => {
      onSelect(drug);
      setQuery(drug.genericName);
      setOpen(false);
      // Return focus to the input so the user can keep typing or submit.
      inputRef.current?.focus();
    },
    [onSelect],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Open on any printable key or ArrowDown when closed.
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        return;
      case "End":
        event.preventDefault();
        setActiveIndex(filtered.length - 1);
        return;
      case "Enter": {
        event.preventDefault();
        const picked = filtered[activeIndex];
        if (picked) choose(picked);
        return;
      }
      case "Escape":
        event.preventDefault();
        setOpen(false);
        return;
      case "Tab":
        // Let focus leave; close the popover.
        setOpen(false);
        return;
    }
  };

  const hasResults = filtered.length > 0;
  const activeOptionId = hasResults ? `${listboxId}-opt-${activeIndex}` : undefined;

  return (
    <div className="relative">
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          aria-activedescendant={open ? activeOptionId : undefined}
          aria-autocomplete="list"
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Search medications"
          autoComplete="off"
          className="pr-8 pl-9"
          disabled={disabled}
          id={`${listboxId}-input`}
          onBlur={() => setOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search by generic name, brand, or indication"
          ref={inputRef}
          role="combobox"
          type="text"
          value={query}
        />
        <button
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          aria-label={open ? "Close medication list" : "Open medication list"}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-1.5 transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
          disabled={disabled}
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              setOpen(true);
              inputRef.current?.focus();
            }
          }}
          onMouseDown={(event) => event.preventDefault()}
          tabIndex={-1}
          type="button"
        >
          <ChevronDownIcon
            aria-hidden="true"
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {open && (
        <ul
          aria-label="Medication results"
          className="bg-popover ring-foreground/10 absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md p-1 shadow-md ring-1"
          id={listboxId}
          role="listbox"
        >
          {hasResults ? (
            filtered.map((drug, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  aria-selected={isActive}
                  className={cn(
                    "flex cursor-pointer flex-col gap-0.5 rounded-sm p-2",
                    isActive ? "bg-muted text-foreground" : "hover:bg-muted/60",
                  )}
                  id={`${listboxId}-opt-${index}`}
                  key={drug.key}
                  // Use onMouseDown so the selection fires before
                  // the input's onBlur closes the popover. `onClick`
                  // would be too late.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(drug);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{drug.genericName}</span>
                    <Badge variant={AWARE_VARIANT[drug.aware]}>{drug.aware}</Badge>
                  </div>
                  {drug.brandNames.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {drug.brandNames.slice(0, 3).map((b) => (
                        <span
                          className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]"
                          key={b}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="text-muted-foreground truncate text-xs">{drug.indication}</span>
                </li>
              );
            })
          ) : (
            <li
              aria-disabled="true"
              aria-live="polite"
              className="text-muted-foreground px-3 py-2 text-sm"
              role="option"
            >
              No results found.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
