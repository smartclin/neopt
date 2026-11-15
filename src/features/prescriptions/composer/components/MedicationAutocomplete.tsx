import { ChevronDownIcon, SearchIcon } from "lucide-react";
import * as React from "react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
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
  const inputId = `${listboxId}-input`;
  const [open, setOpen] = React.useState(false);
  const [queryState, setQueryState] = React.useState({ value, query: value });
  const query = queryState.value === value ? queryState.query : value;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  const hasResults = filtered.length > 0;

  const choose = React.useCallback(
    (drug: ComposerDrug) => {
      onSelect(drug);
      setQueryState({ value, query: drug.genericName });
      setOpen(false);
      inputRef.current?.focus();
    },
    [onSelect, value],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

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
        setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
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
        setActiveIndex(Math.max(filtered.length - 1, 0));
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
        setOpen(false);
        return;
    }
  };

  const activeOptionId = open && hasResults ? `${listboxId}-opt-${activeIndex}` : undefined;

  return (
    <div className="relative">
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Search medications"
          autoComplete="off"
          className="pl-9 pr-8"
          disabled={disabled}
          id={inputId}
          onBlur={() => setOpen(false)}
          onChange={(event) => {
            setQueryState({ value, query: event.target.value });
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
        <Button
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          aria-label={open ? "Close medication list" : "Open medication list"}
          className="absolute top-1/2 right-1 -translate-y-1/2"
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
          size="icon-xs"
          tabIndex={-1}
          type="button"
          variant="ghost"
        >
          <ChevronDownIcon
            aria-hidden="true"
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </div>

      {open && (
        <div
          aria-label="Medication results"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md bg-popover p-1 shadow-md ring-1 ring-foreground/10"
          id={listboxId}
          role="listbox"
        >
          {hasResults ? (
            filtered.map((drug, index) => {
              const isActive = index === activeIndex;
              return (
                <div key={drug.key} role="presentation">
                  <Button
                    aria-selected={isActive}
                    className={cn(
                      "h-auto w-full justify-start whitespace-normal",
                      isActive ? "bg-muted text-foreground" : "hover:bg-muted/60",
                    )}
                    id={`${listboxId}-opt-${index}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      choose(drug);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    tabIndex={-1}
                    type="button"
                    variant="ghost"
                  >
                    <span className="flex w-full flex-col gap-0.5 text-left">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{drug.genericName}</span>
                        <Badge variant={AWARE_VARIANT[drug.aware]}>{drug.aware}</Badge>
                      </span>
                      {drug.brandNames.length > 0 && (
                        <span className="flex flex-wrap gap-1">
                          {drug.brandNames.slice(0, 3).map((b) => (
                            <span
                              className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xsss"
                              key={b}
                            >
                              {b}
                            </span>
                          ))}
                        </span>
                      )}
                      <span className="truncate text-xs text-muted-foreground">
                        {drug.indication}
                      </span>
                    </span>
                  </Button>
                </div>
              );
            })
          ) : (
            <div
              aria-live="polite"
              className="px-3 py-2 text-sm text-muted-foreground"
              role="status"
            >
              No results found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
