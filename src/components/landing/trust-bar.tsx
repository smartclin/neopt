const ITEMS = [
  { k: "WHO LMS", v: "Reference standards" },
  { k: "Encrypted", v: "At rest & in transit" },
  { k: "Egyptian sheets", v: "Local percentile charts" },
  { k: "Auditable", v: "Per-patient history" },
];

export function TrustBar() {
  return (
    <section className="border-border/60 bg-background border-y">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
        {ITEMS.map((it) => (
          <div className="text-center" key={it.k}>
            <p className="text-foreground text-sm font-bold">{it.k}</p>
            <p className="text-muted-foreground mt-1 text-xs">{it.v}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
