import * as React from "react";

import { cn } from "@/lib/utils";

type VisualProps = {
  className?: string;
  priority?: boolean;
  aspect?: string;
};

// Mapped to your exact public/images folder
const IMAGE_MAP = {
  hero: "/images/hero.webp",
  growth: "/images/growth-development.webp",
  immunization: "/images/vaccination.webp",
  dosing: "/images/consultation.webp",
  appointments: "/images/development.webp",
  sick: "/images/sick-child.webp",
} as const;

function VisualFrame({
  src,
  priority = false,
  className,
  aspect = "aspect-[5/3]",
}: VisualProps & { src: string }) {
  const [errored, setErrored] = React.useState(false);

  if (errored) {
    return (
      <div
        className={cn(
          "from-primary/15 via-secondary/10 w-full rounded-2xl bg-gradient-to-br to-transparent",
          aspect,
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn("bg-muted/40 relative w-full overflow-hidden rounded-2xl", aspect, className)}
    >
      <img
        alt=""
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        decoding="async"
        draggable={false}
        fetchPriority={priority ? "high" : "auto"}
        height={1200}
        loading={priority ? "eager" : "lazy"}
        onError={() => setErrored(true)}
        sizes={
          priority
            ? "(max-width: 768px) 100vw, 50vw"
            : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        }
        src={src}
        width={1200}
      />
    </div>
  );
}

export function HeroVisual(props: VisualProps) {
  return <VisualFrame src={IMAGE_MAP.hero} {...props} />;
}

export function GrowthChartVisual(props: VisualProps) {
  return <VisualFrame src={IMAGE_MAP.growth} {...props} />;
}

export function ImmunizationVisual(props: VisualProps) {
  return <VisualFrame src={IMAGE_MAP.immunization} {...props} />;
}

export function DosingVisual(props: VisualProps) {
  return <VisualFrame src={IMAGE_MAP.dosing} {...props} />;
}

export function AppointmentsVisual(props: VisualProps) {
  return <VisualFrame src={IMAGE_MAP.appointments} {...props} />;
}

export function SickChildVisual(props: VisualProps) {
  return <VisualFrame src={IMAGE_MAP.sick} {...props} />;
}
