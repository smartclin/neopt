export function RecentGrowthSkeleton() {
  return (
    <div className="bg-card border-border flex h-full animate-pulse flex-col gap-4 rounded-xl border p-4">
      <div className="bg-muted h-4 w-32 rounded" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div className="flex justify-between gap-3" key={i}>
            <div className="space-y-1.5">
              <div className="bg-muted h-3 w-24 rounded" />
              <div className="bg-muted h-2.5 w-16 rounded" />
            </div>
            <div className="space-y-1.5 text-right">
              <div className="bg-muted ml-auto h-3 w-14 rounded" />
              <div className="bg-muted ml-auto h-2.5 w-10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
