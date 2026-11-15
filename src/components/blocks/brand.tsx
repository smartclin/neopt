import { Link } from "@tanstack/react-router";

// src/components/blocks/brand.tsx
import { cn } from "@/lib/utils";

export function ClinicBrand({
  to = "/",
  tone = "inline",
  showText = true,
  className,
}: {
  to?: string;
  tone?: "inline" | "stacked";
  showText?: boolean;
  className?: string;
}) {
  // Choose the right asset based on the layout
  const logoSrc = tone === "stacked" ? "/brand/logo-192.png" : "/brand/logo-80.png";

  return (
    <Link
      aria-label="Dr. Hazem Ali Pediatric Clinic — home"
      className={cn(
        "text-foreground focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        tone === "stacked" && "flex-col gap-4",
        className,
      )}
      to={to}
    >
      {/* Logo Container */}
      <span
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10",
          tone === "stacked" ? "size-24" : "size-10",
        )}
      >
        <img alt="" className="size-full object-contain" fetchPriority="high" src={logoSrc} />
      </span>

      {showText && (
        <span className={cn("flex flex-col", tone === "stacked" && "items-center text-center")}>
          <span
            className={cn(
              "text-primary font-bold tracking-tight",
              tone === "stacked" ? "text-2xl" : "text-base leading-tight",
            )}
          >
            Dr. Hazem Ali
          </span>
          <span
            className={cn(
              "text-muted-foreground",
              tone === "stacked" ? "text-sm font-medium" : "text-[11px] leading-tight",
            )}
          >
            Pediatrician &bull; Neonatologist
          </span>
        </span>
      )}
    </Link>
  );
}
