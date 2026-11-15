// src/features/search/queries.ts
import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { STALE } from "@/features/shared/stale-tiime";

import { globalSearchFn } from "./functions";
import type { SearchCategory } from "./schema";

export const searchKeys = {
  all: () => ["search"] as const,
  // `clinicId` is still part of the key — the cache must not bleed
  // across clinics — even though it's no longer sent on the wire.
  run: (clinicId: string, query: string, cats?: SearchCategory[]) =>
    ["search", clinicId, query, cats?.slice().sort().join(",") ?? "all"] as const,
} as const;

export function globalSearchQuery(clinicId: string, query: string, categories?: SearchCategory[]) {
  return queryOptions({
    queryKey: searchKeys.run(clinicId, query, categories),
    // `clinicId` is NOT in the payload — the server resolves the
    // clinic from the session (context.clinicId) so a client can
    // never search another clinic's data.
    queryFn: () => globalSearchFn({ data: { q: query, categories } }),
    staleTime: STALE.ENCOUNTERS,
    enabled: query.trim().length >= 2 && Boolean(clinicId),
    placeholderData: keepPreviousData,
  });
}
