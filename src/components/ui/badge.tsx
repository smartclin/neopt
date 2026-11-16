import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const badgeVariants = cva(
  "group/badge focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-none border-0 bg-transparent px-0 py-0 text-[0.625rem] font-semibold tracking-widest whitespace-nowrap uppercase transition-colors focus-visible:ring-[3px] has-data-[icon=inline-end]:pe-0 has-data-[icon=inline-start]:ps-0 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        pill: "rounded-full border border-border bg-transparent px-3 py-1 gap-1.5 text-muted-foreground",
        default: "text-foreground [a]:hover:text-foreground/70",
        secondary: "text-muted-foreground [a]:hover:text-foreground",
        destructive:
          "text-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:text-destructive/70",
        outline: "text-foreground [a]:hover:text-foreground/70",
        ghost: "text-muted-foreground hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        success:
          "text-module-encounters dark:text-module-encounters [a]:hover:text-module-encounters/70",
        warning: "text-warning dark:text-warning [a]:hover:text-warning/70",
        info: "text-module-labs dark:text-module-labs [a]:hover:text-module-labs/70",
        subtle: "text-muted-foreground bg-muted/50 [a]:hover:bg-muted",
      },
      size: {
        default: "",
        sm: "text-[0.55rem]",
        lg: "text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
