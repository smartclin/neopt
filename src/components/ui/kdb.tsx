// src/components/ui/kbd.tsx
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A single keyboard key hint.
 *
 * @example
 *   <Kbd>Ctrl</Kbd>
 *   <Kbd>K</Kbd>
 *   <Kbd>⌘</Kbd>
 */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        // layout
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center gap-1", // shape
        "bg-muted rounded border font-mono text-[10px] leading-none font-medium",
        // color
        " select-none",
        // shadow / depth (matches shadcn badge-ish look)
        "shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.08)]",
        // on dark
        "dark:shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.06)]",
        className,
      )}
      data-slot="kbd"
      {...props}
    />
  );
}

/**
 * Groups multiple `<Kbd />` together with a tiny gap.
 *
 * @example
 *   <KbdGroup>
 *     <Kbd>Ctrl</Kbd>
 *     <Kbd>K</Kbd>
 *   </KbdGroup>
 */
function KbdGroup({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      data-slot="kbd-group"
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
