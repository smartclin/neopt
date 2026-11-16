import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  createColumnHelper,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  CalculatorIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  PillIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/blocks/page-header";
import { SectionState } from "@/components/blocks/state-view";
import { TableColGroup } from "@/components/blocks/table-columns";
import { FilterBar } from "@/components/tables/shared/FilterBar";
import { TablePagination } from "@/components/tables/table-pagination";
import { isPageSize, type PageSize } from "@/components/tables/table-pagination-constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import {
  type PrescriptionRegisterSearch,
  prescriptionKeys,
  prescriptionRegisterQuery,
  prescriptionRegisterSearchSchema,
} from "@/features/prescriptions";
// ── imports split into functions vs queries ──────────────────────────────
import { renewPrescriptionFn } from "@/features/prescriptions/functions";
// ─────────────────────────────────────────────────────────────────────────
import { useAuthSuspense } from "@/lib/auth/hooks";

// ── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_auth/app/prescriptions/")({
  validateSearch: (search: Record<string, unknown>): PrescriptionRegisterSearch =>
    prescriptionRegisterSearchSchema.parse(search),
  component: PrescriptionsRegisterPage,
});

// ── Row type ───────────────────────────────────────────────────────────────

type Status = "active" | "completed" | "cancelled";

type RegisterRow = {
  id: string;
  medicationName: string;
  brandName: string | null;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  status: Status;
  prescribedAt: Date;
  prescriber: { id: string; name: string } | null;
  patient: {
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
  } | null;
  flagsInteraction: boolean;
};

// ── Constants ───────────────────────────────────────────────────────────────

const PRESCRIBER_OPTIONS = ["All"];

const STATUS_PILLS: Array<{
  value: PrescriptionRegisterSearch["status"];
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const features = tableFeatures({ rowPaginationFeature });
const column = createColumnHelper<typeof features, RegisterRow>();

// ── Columns (unchanged) ────────────────────────────────────────────────────

const columns = column.columns([
  column.accessor("medicationName", {
    header: "Medication",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2.5 py-1">
        <span className="bg-muted/60 grid size-8 shrink-0 place-items-center rounded-md">
          <PillIcon aria-hidden="true" className="text-muted-foreground size-4" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{row.original.medicationName}</span>
          {row.original.brandName && (
            <span className="text-muted-foreground truncate text-xs">{row.original.brandName}</span>
          )}
        </div>
      </div>
    ),
  }),
  column.accessor((row) => row.patient?.lastName ?? "", {
    id: "patient",
    header: "Patient",
    cell: ({ row }) => {
      const p = row.original.patient;
      if (!p) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="bg-secondary text-secondary-foreground grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold uppercase"
          >
            {p.firstName.charAt(0)}
            {p.lastName.charAt(0)}
          </span>
          <div className="flex min-w-0 flex-col">
            <Link
              className="truncate font-medium underline-offset-4 hover:underline"
              params={{ patientId: p.id }}
              search={{ tab: "overview" }}
              to="/app/patients/$patientId"
            >
              {p.firstName} {p.lastName}
            </Link>
            <span className="text-muted-foreground truncate font-mono text-[11px] tabular-nums">
              {p.mrn}
            </span>
          </div>
        </div>
      );
    },
  }),
  column.accessor("dosage", {
    header: "Dosage",
    meta: { width: "w-28" },
    cell: (info) => (
      <span className="block truncate font-mono text-xs tabular-nums">{info.getValue()}</span>
    ),
  }),
  column.accessor("frequency", {
    header: "Frequency",
    meta: { width: "w-24" },
    cell: (info) => (
      <span className="text-muted-foreground block truncate font-mono text-xs tabular-nums">
        {info.getValue()}
      </span>
    ),
  }),
  column.accessor("durationDays", {
    header: "Duration",
    meta: { width: "w-24", hideOnMobile: true },
    cell: (info) => {
      const d = info.getValue();
      return (
        <span className="text-muted-foreground block font-mono text-xs tabular-nums">
          {d == null ? "Ongoing" : `${d}d`}
        </span>
      );
    },
  }),
  column.accessor((row) => row.prescriber?.name ?? "", {
    id: "prescriber",
    header: "Prescriber",
    meta: { width: "w-40", hideOnMobile: true },
    cell: (info) => (
      <span className="text-muted-foreground block truncate">{info.getValue() || "—"}</span>
    ),
  }),
  column.accessor("prescribedAt", {
    header: "Prescribed",
    meta: { width: "w-32" },
    cell: (info) => {
      const d = new Date(info.getValue());
      return (
        <span className="text-muted-foreground block truncate font-mono text-xs tabular-nums">
          {Number.isNaN(d.getTime()) ? "—" : DATE_FMT.format(d)}
        </span>
      );
    },
  }),
]);

const COLUMN_LAYOUT = [
  {},
  {},
  { width: "w-28" },
  { width: "w-24" },
  { width: "w-24", hideOnMobile: true },
  { width: "w-40", hideOnMobile: true },
  { width: "w-32" },
] as const;

// ── Page ────────────────────────────────────────────────────────────────────

function PrescriptionsRegisterPage() {
  const { user } = useAuthSuspense();
  const search = Route.useSearch();
  const navigate = useNavigate();

  if (!user?.clinicId) {
    return (
      <PageHeader
        description="No clinic is assigned to your account. Ask an administrator to link you."
        title="Prescriptions"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PrescriptionsHeader clinicId={user.clinicId} search={search} />
      <PrescriptionsFilterBar
        onChange={(next) => void navigate({ search: next as never, to: "/app/prescriptions" })}
        search={search}
      />
      <PrescriptionsTable clinicId={user.clinicId} search={search} />
    </div>
  );
}

// ── Header with KPI chips ──────────────────────────────────────────────────

function PrescriptionsHeader({
  clinicId,
  search,
}: {
  clinicId: string;
  search: PrescriptionRegisterSearch;
}) {
  // ── KEY CHANGE: use prescriptionRegisterQuery for each KPI count ────────
  // Each call reuses the same query-options factory with a different
  // `search` shape. The factory normalizes the key so `page`/`size`
  // don't create separate cache entries.
  const activeCount = useQuery({
    ...prescriptionRegisterQuery(clinicId, {
      ...search,
      page: 1,
      size: 1,
      status: "active",
    }),
    // Override: the header only needs the count, so don't keep the full
    // row list alive longer than necessary.
    select: (data) => data.total,
  });

  const completedWeekCount = useQuery({
    ...prescriptionRegisterQuery(clinicId, {
      ...search,
      page: 1,
      size: 1,
      status: "completed",
      from: startOfWeekISO(),
    }),
    select: (data) => data.total,
  });

  // Flagged-interactions is a placeholder — no server function yet.
  const flaggedCount = 0;

  return (
    <div className="flex flex-col gap-2">
      <PageHeader
        actions={
          <div className="flex items-center gap-2">
            <SplitActionButton />
          </div>
        }
        description="All medications prescribed at this clinic."
        title="Prescriptions"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">
          Active&nbsp;
          <span className="font-mono tabular-nums">{activeCount.data ?? "…"}</span>
        </Badge>
        <Badge variant="secondary">
          Completed this week&nbsp;
          <span className="font-mono tabular-nums">{completedWeekCount.data ?? "…"}</span>
        </Badge>
        <Badge variant={flaggedCount > 0 ? "warning" : "outline"}>
          <CircleAlertIcon aria-hidden="true" className="size-3" />
          Flagged interactions&nbsp;
          <span className="font-mono tabular-nums">{flaggedCount}</span>
        </Badge>
      </div>
    </div>
  );
}

function SplitActionButton() {
  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-md border">
      <Button
        className="rounded-none border-0"
        nativeButton={false}
        render={<Link to="/app/prescriptions/neonatal-dose-calculator" />}
      >
        <PlusIcon aria-hidden="true" />
        New prescription
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="More prescription actions"
              className="rounded-none border-0 border-l"
              size="icon"
              variant="default"
            />
          }
        >
          <ChevronDownIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            nativeButton={false}
            render={<Link to="/app/prescriptions/neonatal-dose-calculator" />}
          >
            <CalculatorIcon aria-hidden="true" />
            Open NICU calculator
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Filter bar (unchanged) ─────────────────────────────────────────────────

function PrescriptionsFilterBar({
  search,
  onChange,
}: {
  search: PrescriptionRegisterSearch;
  onChange: (next: PrescriptionRegisterSearch) => void;
}) {
  const [q, setQ] = useState(search.q ?? "");
  const [medication, setMedication] = useState(search.medication ?? "");

  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  });

  useEffect(() => {
    const t = setTimeout(() => {
      if ((searchRef.current.q ?? "") !== q) {
        onChange({ ...searchRef.current, q: q || undefined, page: 1 });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, onChange]);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.medication ?? "") !== medication)
        onChange({ ...search, medication: medication || undefined, page: 1 });
    }, 250);
    return () => clearTimeout(t);
  }, [medication, search, onChange]);

  const hasFilters =
    Boolean(search.q) ||
    Boolean(search.medication) ||
    Boolean(search.prescriberId) ||
    search.status !== "all" ||
    Boolean(search.from) ||
    Boolean(search.to);

  return (
    <div className="bg-background/95 sticky top-0 z-10 -mx-6 space-y-3 border-b px-6 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          aria-label="Search patients"
          className="border-border bg-background focus-visible:border-ring h-9 rounded-md border px-3 text-sm outline-none"
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search patient name or MRN"
          type="search"
          value={q}
        />
        <input
          aria-label="Search medications"
          className="border-border bg-background focus-visible:border-ring h-9 rounded-md border px-3 text-sm outline-none"
          onChange={(e) => setMedication(e.target.value)}
          placeholder="Search medication or brand"
          type="search"
          value={medication}
        />
        <FilterBar
          filters={[
            {
              allLabel: "All prescribers",
              onChange: (value) =>
                onChange({
                  ...search,
                  prescriberId: value === "All" ? undefined : value,
                  page: 1,
                }),
              options: PRESCRIBER_OPTIONS,
              value: search.prescriberId ?? "All",
            },
          ]}
          hasFilters={hasFilters}
          hideSearch
          onClear={() => onChange({ ...prescriptionRegisterSearchSchema.parse({}), page: 1 })}
          onSearchChange={() => undefined}
          searchPlaceholder=""
          searchValue=""
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div aria-label="Filter by status" className="flex flex-wrap gap-1" role="group">
          {STATUS_PILLS.map((pill) => {
            const active = search.status === pill.value;
            return (
              <button
                aria-pressed={active}
                className={
                  active
                    ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                }
                key={pill.value}
                onClick={() => onChange({ ...search, status: pill.value, page: 1 })}
                type="button"
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <input
            aria-label="Prescribed from"
            className="border-border bg-background h-8 rounded-md border px-2 text-xs"
            onChange={(e) =>
              onChange({
                ...search,
                from: e.target.value || undefined,
                page: 1,
              })
            }
            type="date"
            value={search.from ?? ""}
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            aria-label="Prescribed to"
            className="border-border bg-background h-8 rounded-md border px-2 text-xs"
            onChange={(e) => onChange({ ...search, to: e.target.value || undefined, page: 1 })}
            type="date"
            value={search.to ?? ""}
          />
        </div>
      </div>
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────────────────────

function PrescriptionsTable({
  clinicId,
  search,
}: {
  clinicId: string;
  search: PrescriptionRegisterSearch;
}) {
  const queryClient = useQueryClient();
  const size: PageSize = isPageSize(String(search.size)) ? (search.size as PageSize) : 20;
  const page = search.page;

  // ── KEY CHANGE: use prescriptionRegisterQuery ───────────────────────────
  // Note: pass `search` as-is; the factory filters out page/size for the
  // key, but the queryFn gets the full search object (including page/size)
  // so the server returns the correct page. No manual destructuring needed.
  const query = useQuery(prescriptionRegisterQuery(clinicId, search));

  const rows = (query.data?.rows ?? []) as RegisterRow[];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / size));

  const table = useTable({
    columns,
    data: rows,
    features,
    getRowId: (row) => row.id,
    manualPagination: true,
    rowCount: total,
    state: { pagination: { pageIndex: page - 1, pageSize: size } },
  });

  if (query.isError) {
    return (
      <SectionState
        action={
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            variant="outline"
          >
            {query.isFetching ? "Retrying…" : "Try Again"}
          </Button>
        }
        description={
          query.error instanceof Error ? query.error.message : "An unexpected error occurred."
        }
        icon={CircleAlertIcon}
        title="Failed to Load Prescriptions"
      />
    );
  }

  if (!query.isLoading && total === 0) {
    return <PrescriptionsEmptyState />;
  }

  const leafColumnCount = table.getAllLeafColumns().length;
  const FlexRender = table.FlexRender;

  return (
    <div className="flex flex-col gap-2">
      <Table aria-busy={query.isFetching} aria-label="Prescriptions" layout="fixed">
        <TableColGroup columns={COLUMN_LAYOUT} />
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead
                  className="tracking-wider uppercase"
                  hideOnMobile={header.column.columnDef.meta?.hideOnMobile}
                  key={header.id}
                >
                  <FlexRender header={header} />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <PrescriptionTableRow
              FlexRender={FlexRender}
              key={row.id}
              queryClient={queryClient}
              row={row}
            />
          ))}
          {query.isFetching &&
            Array.from({ length: Math.min(size, 5) }, (_, i) => (
              <TableRow key={`sk-${i}`}>
                <TableCell colSpan={leafColumnCount}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <div className="bg-background/95 sticky bottom-0 py-2 backdrop-blur max-sm:-mx-6 max-sm:px-6 max-sm:pb-[env(safe-area-inset-bottom)]">
        <TablePagination
          ariaLabel="Prescription Pages"
          page={page}
          pageCount={pageCount}
          route={Route}
          size={size}
        />
      </div>
    </div>
  );
}

function PrescriptionTableRow({
  row,
  FlexRender,
  queryClient,
}: {
  row: ReturnType<
    ReturnType<typeof useTable<typeof features, RegisterRow>>["getRowModel"]
  >["rows"][number];
  FlexRender: ReturnType<typeof useTable<typeof features, RegisterRow>>["FlexRender"];
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const flags = row.original.flagsInteraction;
  return (
    <TableRow
      className={
        flags
          ? "relative before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-amber-500"
          : undefined
      }
    >
      {row.getAllCells().map((cell) => (
        <TableCell
          className={
            cell.column.id === "patient" || cell.column.id === "medicationName" ? "relative" : ""
          }
          hideOnMobile={cell.column.columnDef.meta?.hideOnMobile}
          key={cell.id}
        >
          {cell.column.id === "medicationName" ? (
            <div className="group/cell relative flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <FlexRender cell={cell} />
              </div>
              <RenewButton prescriptionId={row.original.id} queryClient={queryClient} />
            </div>
          ) : (
            <FlexRender cell={cell} />
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Renew mutation ─────────────────────────────────────────────────────────

function RenewButton({
  prescriptionId,
  queryClient,
}: {
  prescriptionId: string;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  // ── KEY CHANGE: use useMutation + useServerFn instead of calling
  // the server function directly from onClick. This gives us:
  //   - isPending state for a proper loading indicator
  //   - onSuccess hook for invalidation
  //   - error handling through the standard mutation API
  const renew = useServerFn(renewPrescriptionFn);

  const mutation = useMutation({
    mutationFn: () => renew({ data: { prescriptionId } }),
    onSuccess: (newRow) => {
      toast.add({
        type: "success",
        description: `Prescription renewed${newRow?.id ? ` (${newRow.id.slice(0, 8)})` : ""}`,
      });
      // Invalidate the whole register subtree — the new row must appear.
      // The `clinic` segment isn't in this query's key, so invalidate
      // by the register prefix instead.
      void queryClient.invalidateQueries({
        queryKey: ["prescriptions", "register"],
      });
      // Also invalidate the specific prescription if anyone has it open.
      void queryClient.invalidateQueries({
        queryKey: prescriptionKeys.detail(prescriptionId),
      });
    },
    onError: (err: unknown) => {
      toast.add({
        type: "destructive",
        description: err instanceof Error ? err.message : "Failed to renew",
      });
    },
  });

  return (
    <div className="opacity-0 transition-opacity group-hover/cell:opacity-100 focus-within:opacity-100">
      <Button
        disabled={mutation.isPending}
        nativeButton
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          mutation.mutate();
        }}
        size="xs"
        variant="ghost"
      >
        <RefreshCwIcon aria-hidden="true" className={mutation.isPending ? "animate-spin" : ""} />
        {mutation.isPending ? "Renewing…" : "Renew"}
      </Button>
    </div>
  );
}

// ── Empty state (unchanged) ────────────────────────────────────────────────

function PrescriptionsEmptyState() {
  return (
    <div className="grid gap-6 rounded-xl border border-dashed p-8 md:grid-cols-[1fr_360px] md:p-10">
      <div className="flex flex-col justify-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">No prescriptions yet</h2>
          <p className="text-muted-foreground text-sm">
            Prescriptions written at this clinic will appear here, filterable by status, prescriber,
            and date.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            nativeButton={false}
            render={<Link to="/app/prescriptions/neonatal-dose-calculator" />}
          >
            <PlusIcon aria-hidden="true" />
            Write a prescription
          </Button>
          <Button
            nativeButton={false}
            render={<Link to="/app/prescriptions/neonatal-dose-calculator" />}
            variant="outline"
          >
            <CalculatorIcon aria-hidden="true" />
            Browse formulary
          </Button>
        </div>
      </div>

      <aside className="bg-muted/40 flex flex-col gap-2 rounded-lg border p-4 text-sm">
        <p className="text-foreground font-semibold">Pediatric dosing, in one line</p>
        <p className="text-muted-foreground">
          Doses are weight-based (mg/kg/dose or mg/kg/day). Use the NICU calculator for neonates —
          it accounts for gestational age and renal dosing. Always round to the smallest measurable
          volume for the prepared concentration.
        </p>
        <Link
          className="text-primary text-xs font-medium underline-offset-4 hover:underline"
          to="/app/prescriptions/neonatal-dose-calculator"
        >
          Open the dosing reference →
        </Link>
      </aside>
    </div>
  );
}

// ── Helpers (unchanged) ────────────────────────────────────────────────────

function startOfWeekISO(): string {
  const d = new Date();
  const day = d.getUTCDay() || 7; // Monday = 1
  d.setUTCDate(d.getUTCDate() - (day - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
