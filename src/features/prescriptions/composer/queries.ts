// src/features/prescriptions/composer/queries.ts
import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getActivePrescriptionsQuery,
  getPatientForComposerQueryOptions,
} from "@/features/prescriptions/queries";

import type { PrescriptionComposerValues } from "./types";

import { discontinuePrescription, savePrescription } from "./functions";

// ─────────────────────────────────────────────────────────────────────────────
// Shared reads — the composer does NOT define its own
// ─────────────────────────────────────────────────────────────────────────────
//
// The composer used to have `fetchComposerPatientContext` and
// `fetchComposerActiveMeds` as bespoke server functions with bespoke
// query keys. That meant:
//   - the same patient context lived in two cache entries, and
//   - invalidating `["prescriptions", "patient", id]` from the
//     prescriptions register would NOT refresh the composer's
//     "previous prescriptions" rail.
//
// The fix is to reuse the shared queries from the parent features.
// These re-exports exist so the composer route has a single import
// surface — call them from the composer, they hit the shared cache.

export { getActivePrescriptionsQuery, getPatientForComposerQueryOptions };

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────
//
// We export mutation hooks (not raw mutation objects) so the route
// doesn't have to re-specify `onSuccess` invalidation in every caller.
// The invalidation list is exactly the same whether the save comes
// from the composer or the register, so it lives here.

// ─────────────────────────────────────────────────────────────────────────────
// Invalidation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The set of caches touched by a prescription write. Kept private to
 * this module — callers go through the mutation hooks above, which
 * call this for them.
 */
export async function invalidateAfterPrescriptionWrite(
  queryClient: QueryClient,
  args: { prescriptionId: string; patientId: string },
): Promise<void> {
  await Promise.all([
    // The prescription itself.
    queryClient.invalidateQueries({
      queryKey: ["prescriptions", "detail", args.prescriptionId],
    }),
    // The register list (any page/filter combination).
    queryClient.invalidateQueries({
      queryKey: ["prescriptions", "register"],
    }),
    // The patient's full medication history — used by the safety rail
    // in any open composer tab.
    queryClient.invalidateQueries({
      queryKey: ["prescriptions", "patient", args.patientId],
    }),
    // Visit-level prescription lists (the visit detail page).
    queryClient.invalidateQueries({
      queryKey: ["prescriptions", "visit"],
    }),
  ]);
}

export function useSavePrescriptionMutation() {
  const queryClient = useQueryClient();
  const saveFn = useServerFn(savePrescription);

  return useMutation({
    mutationFn: (values: PrescriptionComposerValues & { prescriptionId?: string }) =>
      saveFn({ data: values }),
    onSuccess: (row) => {
      if (!row) return;
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["prescriptions", "detail", row.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["prescriptions", "register"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["prescriptions", "patient", row.patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["prescriptions", "visit", row.visitId],
        }),
      ]);
    },
  });
}

export function useDiscontinuePrescriptionMutation() {
  const queryClient = useQueryClient();
  const discontinueFn = useServerFn(discontinuePrescription);

  return useMutation({
    mutationFn: (input: { prescriptionId: string }) => discontinueFn({ data: input }),
    onSuccess: (row) => {
      if (!row) return;
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["prescriptions", "detail", row.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["prescriptions", "register"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["prescriptions", "patient", row.patientId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["prescriptions", "visit", row.visitId],
        }),
      ]);
    },
  });
}
