// src/features/growth/functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { clinicAccessMiddleware } from "@/lib/auth/clinic-middleware";
import { authMiddleware } from "@/lib/auth/middleware";

import {
  fetchGrowthStandardsSchema,
  GrowthChartRequestSchema,
  GrowthChartRequestWithXSchema,
  GrowthIndicatorSchema,
} from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Reference data (authenticated only, not tenant-scoped)
// ─────────────────────────────────────────────────────────────────────────────
//
// WHO standards and Egyptian LMS curves are global reference tables. Every
// clinic reads the same rows, so no tenant check is needed — but they are
// not public either. `authMiddleware` ensures a valid session exists.

export const fetchGrowthStandardsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(fetchGrowthStandardsSchema)
  .handler(async ({ data }) => {
    const { fetchGrowthStandards } = await import("../../db/queries/growth.queries");
    return fetchGrowthStandards(data);
  });

export const fetchGrowthChartCurves = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(GrowthChartRequestSchema)
  .handler(async ({ data }) => {
    const { getGrowthChartCurves } = await import("../../db/queries/growth.queries");
    return getGrowthChartCurves(data.indicator, data.sex, data.range);
  });

export const fetchGrowthChartCurvesMany = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ requests: z.array(GrowthChartRequestSchema).readonly() }))
  .handler(async ({ data }) => {
    const { getGrowthChartCurvesMany } = await import("../../db/queries/growth.queries");
    return getGrowthChartCurvesMany(data.requests);
  });

export const fetchGrowthChartBand = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(GrowthChartRequestWithXSchema)
  .handler(async ({ data }) => {
    const { getGrowthChartBand } = await import("../../db/queries/growth.queries");
    return getGrowthChartBand(data.indicator, data.sex, data.range, data.x);
  });

// ─────────────────────────────────────────────────────────────────────────────
// Patient-scoped data (clinic-isolated)
// ─────────────────────────────────────────────────────────────────────────────

export const fetchChildMeasurementsFn = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid(), metric: z.enum(["lhfa", "wfa"]) }))
  .handler(async ({ data }) => {
    const { fetchChildMeasurements } = await import("../../db/queries/growth.queries");
    return fetchChildMeasurements(data.patientId, data.metric);
  });

export const fetchIndicatorSeries = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid(), indicator: GrowthIndicatorSchema }))
  .handler(async ({ data }) => {
    const { listIndicatorSeries } = await import("../../db/queries/growth.queries");
    return listIndicatorSeries(data.patientId, data.indicator);
  });

export const fetchLatestPanel = createServerFn({ method: "GET" })
  .middleware([clinicAccessMiddleware])
  .validator(z.object({ patientId: z.uuid() }))
  .handler(async ({ data }) => {
    const { latestPanelForPatient } = await import("../../db/queries/measurements.queries");
    return latestPanelForPatient(data.patientId);
  });
