import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, RulerIcon } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";
import { useRecentGrowth } from "#/features/dashboard/use-recent-growth.ts";
import { formatDate } from "@/lib/dates";

export function RecentGrowthCard({ clinicId }: { clinicId: string | undefined }) {
  const { data: entries } = useRecentGrowth(clinicId);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Growth</CardTitle>
          <p className=" text-xs">Latest measurements logged at the clinic.</p>
        </div>
        <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md">
          <RulerIcon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {entries.length === 0 ? (
            <p className=" text-sm">No measurements logged yet.</p>
          ) : (
            <ul className="divide-border divide-y">
              {entries.map((entry) => (
                <li className="py-2 first:pt-0 last:pb-0" key={entry.patientId}>
                  <Link
                    className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors"
                    params={{ patientId: entry.patientId }}
                    search={{ tab: "patients" }}
                    to="/app/patients/$patientId/growth"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{entry.patientName}</p>
                      <p className=" text-xs">
                        {entry.ageLabel} · {formatDate(new Date(entry.measuredAt))}
                      </p>
                    </div>
                    <div className="text-right text-xs tabular-nums">
                      <p className="font-medium">
                        {entry.weightKg.toFixed(1)} kg
                        {entry.weightPercentile != null && (
                          <span className=" ml-1">({entry.weightPercentile}th)</span>
                        )}
                      </p>
                      <p className="">{entry.heightCm.toFixed(0)} cm</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      <div className="p-4 pt-0">
        <Button
          nativeButton={false}
          render={<Link to="/app/patients" />}
          size="xs"
          variant="outline"
          className="w-full justify-between"
        >
          <span>All Measurements</span>
          <ArrowRightIcon className="size-3" />
        </Button>
      </div>
    </Card>
  );
}
