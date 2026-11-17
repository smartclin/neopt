// src/routes/_auth/app/conflicts/$conflictId.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOutboxEntry, useResolveConflict } from "@/features/outbox/use-outbox";

export const Route = createFileRoute("/_auth/app/conflicts/$conflictId")({
  component: ConflictDialog,
});

function ConflictDialog() {
  const { conflictId } = Route.useParams();
  const navigate = useNavigate();
  const q = useOutboxEntry(conflictId);
  const resolve = useResolveConflict();

  const close = () => void navigate({ to: "/app" });
  const pick = (resolution: "keep-local" | "use-server") =>
    resolve.mutate({ id: conflictId, resolution }, { onSettled: close });

  return (
    <Dialog onOpenChange={(open) => !open && close()} open>
      <DialogContent aria-labelledby="conflict-title" className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle id="conflict-title">Sync conflict needs review</DialogTitle>
        </DialogHeader>

        {!q.data ? (
          <p className=" text-sm">This conflict has already been resolved.</p>
        ) : (
          <>
            <p className=" text-sm">
              Someone else updated this record while you were offline. Pick which version to keep.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <SnapshotPanel data={q.data.optimisticSnapshot} label="Your change (offline)" />
              <SnapshotPanel data={q.data.serverSnapshot} label="Server version" />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                disabled={resolve.isPending}
                nativeButton
                onClick={() => pick("use-server")}
                variant="outline"
              >
                Use server version
              </Button>
              <Button disabled={resolve.isPending} nativeButton onClick={() => pick("keep-local")}>
                Keep my change
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SnapshotPanel({ label, data }: { label: string; data: unknown }) {
  return (
    <div className="rounded-md border p-3">
      <p className="mb-2 text-xs font-semibold tracking-wide uppercase">{label}</p>
      <pre className="max-h-64 overflow-auto text-[11px] leading-snug">
        {data ? JSON.stringify(data, null, 2) : "—"}
      </pre>
    </div>
  );
}
