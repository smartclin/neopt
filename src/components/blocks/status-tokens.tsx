import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";

import { TableColGroup } from "@/components/blocks/table-columns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Class names are written out in full, because Tailwind only generates classes it can read.
const TOKENS = [
  {
    name: "success",
    label: "Success",
    icon: CircleCheckIcon,
    solid: "bg-success text-success-foreground",
  },
  {
    name: "warning",
    label: "Warning",
    icon: TriangleAlertIcon,
    solid: "bg-warning text-warning-foreground",
  },
  {
    name: "info",
    label: "Info",
    icon: InfoIcon,
    solid: "bg-info text-info-foreground",
  },
  {
    name: "destructive",
    label: "Destructive",
    icon: CircleAlertIcon,
    solid: "bg-destructive text-destructive-foreground",
  },
] as const;

const COLUMNS = [
  { heading: "Token" },
  { heading: "Solid", width: "w-28", hideOnMobile: true },
  { heading: "Badge", width: "w-32" },
  { heading: "Button", width: "w-36", hideOnMobile: true },
];

export function StatusTokens() {
  return (
    <Table aria-label="Status Tokens" layout="fixed">
      <TableColGroup columns={COLUMNS} />
      <TableHeader>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableHead hideOnMobile={column.hideOnMobile} key={column.heading}>
              {column.heading}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {TOKENS.map((token) => (
          <TableRow key={token.name}>
            <TableCell>
              <div className="flex flex-col py-1 whitespace-normal">
                <span className="font-medium">{token.label}</span>
                <span className="text-muted-foreground text-xs max-sm:hidden">
                  {`--${token.name}, --${token.name}-foreground`}
                </span>
              </div>
            </TableCell>
            <TableCell hideOnMobile>
              <span
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-md",
                  token.solid,
                )}
              >
                <token.icon aria-hidden="true" className="size-4" />
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={token.name}>
                <token.icon aria-hidden="true" />
                {token.label}
              </Badge>
            </TableCell>
            <TableCell hideOnMobile>
              <Button size="sm" variant={token.name === "destructive" ? "destructive" : "outline"}>
                <token.icon aria-hidden="true" />
                {token.label}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
