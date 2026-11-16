// src/features/search/functions.ts
import { createServerFn } from "@tanstack/react-start";

import { searchAcrossEntities } from "@/db/queries/search.queries";
import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";

import { searchInputSchema } from "./schema";
export const globalSearchFn = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(searchInputSchema.omit({ clinicId: true })) // client can't send it
  .handler(async ({ data, context }) => {
    return searchAcrossEntities({
      clinicId: context.clinicId, // ← authoritative
      query: data.q,
      categories: data.categories,
      limit: data.limit,
    });
  });
