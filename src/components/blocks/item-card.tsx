import type { LucideIcon } from "lucide-react";

import { IconTile } from "@/components/blocks/icon-tile";

// A compact card: icon, title, two lines of description, an optional meta line and corner action.
export function ItemCard({
  icon: Icon,
  title,
  description,
  meta,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border p-3.5">
      <IconTile size="lg" tone="secondary">
        <Icon aria-hidden="true" />
      </IconTile>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-soft-foreground line-clamp-2 text-sm">{description}</p>
        {meta ? <p className="text-muted-foreground mt-auto pt-0.5 text-xs">{meta}</p> : null}
      </div>
      {action ? <div className="shrink-0 self-start">{action}</div> : null}
    </div>
  );
}
