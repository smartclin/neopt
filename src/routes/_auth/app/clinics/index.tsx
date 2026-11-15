import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "#/components/blocks/page-header.tsx";
import {
  DEFAULT_PAGE_SIZE,
  isPageSize,
  type PageSize,
} from "#/components/tables/table-pagination-constants.ts";
import { ClinicForm, ClinicsTable } from "#/features/index.ts";
import { useAuthSuspense } from "#/lib/auth/hooks.ts";

export const Route = createFileRoute("/_auth/app/clinics/")({
  validateSearch: z.object({
    page: z.number().int().min(1).optional(),
    size: z.custom<PageSize>((v) => isPageSize(String(v))).optional(),
  }),
  component: ClinicsPage,
});

function ClinicsPage() {
  const search = Route.useSearch();
  const { user } = useAuthSuspense();

  // Only admins manage the clinic directory. Everything else (doctors, staff,
  // patients) sees a hint instead of the table.
  if (typeof user?.role !== "string" || user.role !== "admin") {
    return (
      <PageHeader
        description="Only administrators can manage the clinic directory."
        title="Clinics"
      />
    );
  }

  const page = search.page ?? 1;
  const size = (search.size ?? DEFAULT_PAGE_SIZE) as PageSize;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={<ClinicForm />}
        description="Register, browse, and edit the clinics that make up the network."
        title="Clinics"
      />
      <ClinicsTable page={page} size={size} />
    </div>
  );
}
