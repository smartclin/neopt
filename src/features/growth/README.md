## Growth charts — which chart is canonical

There are two chart components under `features/growth/components/`, and only
**one** is used by the patient-facing UI:

| Component                                      | Data source                                                                               | Used by                                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **`EgyptianGrowthChart.tsx`** _(canonical)_    | `ChartCurves` (Egyptian 2021 LMS) + optional `ChartBand` marker + patient `GrowthPoint[]` | `PatientGrowthPanel` — **the** growth screen                                         |
| `NewGrowthChart.tsx` (a.k.a. `WhoGrowthChart`) | `GrowthStandard[]` (WHO, day-indexed SD bands) + `ChildMeasurement[]`                     | `WhoGrowthPanel` — the _secondary_ WHO comparison chart shown below the Egyptian one |

### Rules

1. **Egyptian is primary.** Clinical decisions in this app are based on the
   Egyptian 2021 reference. `PatientGrowthPanel` renders
   `EgyptianGrowthChart`. The WHO panel is a secondary, comparative view
   and is intentionally _not_ the main chart.
2. **Never reintroduce `GrowthChart.tsx`.** It was a parallel implementation
   built on `RendererChart` + `motion` + `d3-scale`/`d3-shape` and was
   deleted in favour of `EgyptianGrowthChart` (which uses the newer
   `@tanstack/charts` `defineChart`/`Chart` API, without the extra
   `d3-*` runtime dependencies). The test file
   `GrowthChart.test.tsx` now targets `EgyptianGrowthChart`.
3. **State lives in the panel.** `PatientGrowthPanel` owns
   `indicator` / `flaggedOnly` / `formOpen` / `useCorrectedAge` in
   `useState`. There is no `growthStore` — a per-patient global `Map` was
   removed because it leaked across navigations and had no reset
   semantics. If cross-route persistence is ever required, model it as a
   **router search param**, not a module-level store.
4. **Weight-for-length overlay.** The x-axis for WFL is length (cm). Each
   series row's `lengthCm` is derived server-side in
   `listIndicatorSeries` from the sibling `length-for-age` measurement at
   the same `visitId`. There is no `lengthCmAtMeasurement` column and no
   backfill: the derivation is retroactive and keeps a single source of
   truth.
5. **Corrected age.** Preterm patients (`gestationalAgeWeeks < 37`) get a
   `Use corrected age` toggle. When enabled, the patient points' x-values
   are recomputed as `decimalMonthsBetween(dob, visitedAt) - weeksPreterm*7/30.4375`,
   and the x-axis label becomes `Corrected age (months)`. The reference
   curves themselves are unchanged — correction applies only to the
   patient overlay, which is the correct clinical convention.

## Which chart is canonical?

- **`EgyptianGrowthChart.tsx`** — canonical growth chart. Uses `@tanstack/charts` `defineChart` / `Chart`, no `d3-scale` / `d3-shape` imports. Renders LMS reference curves plus optional patient overlay, optional band marker, optional `xAxisLabel` for corrected age.
- **`WhoGrowthChart.tsx`** (formerly `NewGrowthChart.tsx`) — secondary. Used only by `WhoGrowthPanel`. Uses `d3-scale` because the WHO standards are in a separate table (`growthStandards`) indexed by day and shown on a UTC axis.
- **`GrowthChart.tsx`** — deleted. It was a parallel implementation with `RendererChart` + `motion`. Do not resurrect.

State for the growth panel (`indicator`, `flaggedOnly`, `formOpen`, `useCorrectedAge`) lives in `PatientGrowthPanel` via `useState`. There is no store. If cross-route persistence is ever needed, use a router search param — not a module-level `Map`.

Weight-for-length overlay: `IndicatorSeriesRow.lengthCm` is derived server-side in `listIndicatorSeries` from the sibling `length-for-age` measurement at the same visit. No `lengthCmAtMeasurement` column exists; do not add one — it duplicates a value that already exists on the visit.
