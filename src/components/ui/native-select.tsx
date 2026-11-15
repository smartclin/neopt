import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default";
};

function NativeSelect({ className, size = "default", ...props }: NativeSelectProps) {
  return (
    <div
      className={cn(
        "group/native-select relative w-fit has-[select:disabled]:opacity-50",
        className,
      )}
      data-size={size}
      data-slot="native-select-wrapper"
    >
      <select
        className="border-b-input selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-b-ring aria-invalid:border-b-destructive dark:aria-invalid:border-b-destructive/50 h-10 w-full min-w-0 appearance-none rounded-none border border-transparent bg-transparent py-2 ps-0 pe-8 text-sm transition-[color,border-color] outline-none select-none disabled:pointer-events-none disabled:cursor-not-allowed data-[size=sm]:h-9"
        data-size={size}
        data-slot="native-select"
        {...props}
      />
      <ChevronDownIcon
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute end-0 top-1/2 size-3.5 -translate-y-1/2 select-none"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<"option">) {
  return (
    <option
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      data-slot="native-select-option"
      {...props}
    />
  );
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      data-slot="native-select-optgroup"
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
