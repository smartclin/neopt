import type * as React from "react";

import { cn } from "cn";

interface LabelProps extends React.ComponentProps<"label"> {
  variant?: "default" | "secondary";
}

function Label({ className, variant = "default", ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 text-xs tracking-wide uppercase select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-data-[slot=checkbox]:text-sm peer-data-[slot=checkbox]:font-normal peer-data-[slot=checkbox]:tracking-normal peer-data-[slot=checkbox]:normal-case peer-data-[slot=radio-group-item]:text-sm peer-data-[slot=radio-group-item]:font-normal peer-data-[slot=radio-group-item]:tracking-normal peer-data-[slot=radio-group-item]:normal-case peer-data-[slot=switch]:text-sm peer-data-[slot=switch]:font-normal peer-data-[slot=switch]:tracking-normal peer-data-[slot=switch]:normal-case",
        variant === "default" && "font-semibold",
        variant === "secondary" && "font-normal",
        className,
      )}
      data-slot="label"
      {...props}
    />
  );
}

export { Label };
