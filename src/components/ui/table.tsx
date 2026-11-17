import type * as React from "react";

import { cn } from "cn";

interface TableProps extends React.ComponentProps<"table"> {
  layout?: "fixed" | "auto";
}

function Table({ className, layout, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-x-auto" data-slot="table-container">
      <table
        className={cn(
          "w-full caption-bottom text-sm",
          layout === "fixed" && "table-fixed",
          layout === "auto" && "table-auto",
          className,
        )}
        data-slot="table"
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("[&_tr]:border-b", className)} data-slot="table-header" {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      data-slot="table-body"
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
      data-slot="table-footer"
      {...props}
    />
  );
}

interface TableRowProps extends React.ComponentProps<"tr"> {
  variant?: "default" | "subtle";
}

function TableRow({ className, variant = "default", ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        "has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        variant === "default" && "hover:bg-muted/50",
        variant === "subtle" && "group hover:bg-muted/40",
        className,
      )}
      data-slot="table-row"
      {...props}
    />
  );
}

interface TableHeadProps extends React.ComponentProps<"th"> {
  hideOnMobile?: boolean;
  variant?: "default" | "pinned";
}

function TableHead({ className, hideOnMobile, variant = "default", ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        " h-12 px-3 text-start align-middle text-xs font-medium tracking-wider whitespace-nowrap uppercase [&:has([role=checkbox])]:pe-0",
        hideOnMobile && "max-sm:hidden",
        variant === "pinned" && "bg-background sticky left-0 z-10",
        className,
      )}
      data-slot="table-head"
      {...props}
    />
  );
}

interface TableCellProps extends React.ComponentProps<"td"> {
  hideOnMobile?: boolean;
  variant?: "default" | "pinned";
}

function TableCell({ className, hideOnMobile, variant = "default", ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "p-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pe-0",
        hideOnMobile && "max-sm:hidden",
        variant === "pinned" && "bg-background group-hover:bg-muted/40 sticky left-0 z-10",
        className,
      )}
      data-slot="table-cell"
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption className={cn(" mt-4 text-sm", className)} data-slot="table-caption" {...props} />
  );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
