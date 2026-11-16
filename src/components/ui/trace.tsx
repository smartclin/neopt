import type * as React from "react";

import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "#/components/ui/collapsible";

function Trace({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "*:has-[>[data-slot=trace-line]]:focus-visible:ring-ring/30 flex w-full min-w-0 flex-col gap-3 *:has-[>[data-slot=trace-line]]:flex *:has-[>[data-slot=trace-line]]:w-fit *:has-[>[data-slot=trace-line]]:max-w-full *:has-[>[data-slot=trace-line]]:min-w-0 *:has-[>[data-slot=trace-line]]:rounded-none *:has-[>[data-slot=trace-line]]:text-start *:has-[>[data-slot=trace-line]]:outline-none *:has-[>[data-slot=trace-line]]:focus-visible:ring-2",
        className,
      )}
      data-slot="trace"
      {...props}
    />
  );
}

function TraceLine({
  className,
  status,
  ...props
}: React.ComponentProps<"span"> & {
  status?: "running" | "error" | "pending";
}) {
  return (
    <span
      className={cn(
        "text-muted-foreground in-[a:hover,button:hover]:text-foreground data-[status=error]:text-destructive data-[status=error]:in-[a:hover,button:hover]:text-destructive data-[status=running]:*:data-[slot=trace-title]:shimmer flex w-fit max-w-full min-w-0 items-center gap-2 text-sm transition-colors in-[a,button]:cursor-pointer data-[status=pending]:opacity-60",
        className,
      )}
      data-slot="trace-line"
      data-status={status}
      {...props}
    />
  );
}

function TraceIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [[data-slot=trace-title]~&]:-ms-1",
        className,
      )}
      data-slot="trace-icon"
      {...props}
    />
  );
}

function TraceTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("motion-reduce:shimmer-none min-w-0 truncate", className)}
      data-slot="trace-title"
      {...props}
    />
  );
}

function TraceDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("text-muted-foreground/70 shrink-0 tabular-nums", className)}
      data-slot="trace-description"
      {...props}
    />
  );
}

function TraceCollapsible({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Collapsible>, "open"> &
  (
    | { open?: undefined }
    | {
        open: boolean;
        onOpenChange: NonNullable<React.ComponentProps<typeof Collapsible>["onOpenChange"]>;
      }
  )) {
  return (
    <Collapsible
      className={cn("flex w-full min-w-0 flex-col", className)}
      data-slot="trace-collapsible"
      {...props}
    />
  );
}

function TraceCollapsibleTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsibleTrigger>) {
  return (
    <CollapsibleTrigger
      className={cn(
        "group/trace-collapsible-trigger text-muted-foreground hover:text-foreground focus-visible:ring-ring/30 has-[[data-status=error]]:text-destructive flex w-fit max-w-full min-w-0 cursor-pointer items-center gap-1 rounded-none text-start transition-colors outline-none focus-visible:ring-2",
        className,
      )}
      data-slot="trace-collapsible-trigger"
      {...props}
    >
      {children}
      <TraceIcon className="transition-transform group-aria-expanded/trace-collapsible-trigger:rotate-90">
        <ChevronRightIcon />
      </TraceIcon>
    </CollapsibleTrigger>
  );
}

function TraceCollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent
      className="h-(--collapsible-panel-height) min-w-0 overflow-hidden transition-[height] duration-200 data-ending-style:h-0 data-starting-style:h-0"
      data-slot="trace-collapsible-content"
      {...props}
    >
      <div
        className={cn(
          "text-muted-foreground ms-[calc(--spacing(2)-1px)] mt-3 mb-1 min-w-0 border-s ps-4 pe-1 leading-relaxed wrap-break-word",
          className,
        )}
        data-slot="trace-collapsible-content-inner"
      >
        {children}
      </div>
    </CollapsibleContent>
  );
}

export {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
};
