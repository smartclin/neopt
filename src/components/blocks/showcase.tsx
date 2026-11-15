import { type BrandMark, Icons, LogoMark } from "@/components/icons";
import { cn } from "@/lib/utils";

// Tiles sit at staggered heights around the larger 7Ovr mark in the centre.
const LEFT: { Mark: BrandMark; className: string }[] = [
  { Mark: Icons.ReactIcon, className: "size-12 -translate-y-2" },
  {
    Mark: Icons.TypeScriptIcon,
    className: "size-14 translate-y-3 max-sm:hidden",
  },
  { Mark: Icons.ViteIcon, className: "size-12 -translate-y-1" },
];

const RIGHT: { Mark: BrandMark; className: string }[] = [
  { Mark: Icons.TanStackIcon, className: "size-12 translate-y-2" },
  {
    Mark: Icons.TailwindIcon,
    className: "size-14 -translate-y-2 max-sm:hidden",
  },
  { Mark: Icons.ShadcnIcon, className: "size-12 translate-y-1" },
];

function Tile({ Mark, className }: { Mark: BrandMark; className: string }) {
  return (
    <span
      className={cn(
        "text-soft-foreground bg-background grid shrink-0 place-items-center rounded-2xl border shadow-lg",
        className,
      )}
    >
      <Mark aria-hidden="true" className="size-1/2" />
    </span>
  );
}

export function Showcase() {
  return (
    <section
      aria-labelledby="showcase-title"
      className="from-muted/60 to-background flex flex-col items-center gap-6 overflow-hidden rounded-xl border bg-linear-to-b px-6 py-8 text-center"
    >
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-muted-foreground text-xs tracking-wider uppercase">Made By 7Ovr</p>
        <h2 className="text-xl font-semibold tracking-tight" id="showcase-title">
          7Ovr Starter
        </h2>
        <p className="text-soft-foreground text-sm">
          Everything this starter ships with, on one page.
        </p>
      </div>

      <div aria-hidden="true" className="flex items-center gap-3 sm:gap-4">
        {LEFT.map((tile) => (
          <Tile key={tile.className} {...tile} />
        ))}
        <span className="bg-background text-foreground grid size-20 shrink-0 place-items-center rounded-3xl border shadow-xl">
          <LogoMark className="size-9" />
        </span>
        {RIGHT.map((tile) => (
          <Tile key={tile.className} {...tile} />
        ))}
      </div>
    </section>
  );
}
