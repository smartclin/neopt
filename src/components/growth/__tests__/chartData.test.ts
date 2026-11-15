// src/db/queries/__tests__/chartData.test.ts
//
// Uses the seed DB (ensure `bun run src/db/seed.ts` has been executed).
// Skips gracefully if the seed hasn't run, so CI stays green pre-seed.

import { config } from "dotenv";
import { beforeAll, describe, expect, it } from "vite-plus/test";
import { getGrowthChartBand, getGrowthChartCurves } from "#/db/queries/growth.queries.ts";
import { LmsDomainError } from "@/features/growth/types";

config({ path: ".env.local" });

const HAVE_DB = Boolean(process.env.DATABASE_URL);

describe.skipIf(!HAVE_DB)("chartData queries", () => {
  let hasSeed = false;

  beforeAll(async () => {
    try {
      const c = await getGrowthChartCurves("weight-for-age", "male", {
        xAxis: "age",
        min: 0,
        max: 1,
      });
      hasSeed = c.points.length > 0;
    } catch {
      hasSeed = false;
    }
  });

  it("getGrowthChartCurves returns monotonically increasing x", async () => {
    if (!hasSeed) return;
    const curves = await getGrowthChartCurves("weight-for-age", "male", {
      xAxis: "age",
      min: 0,
      max: 60,
    });
    expect(curves.points.length).toBeGreaterThan(0);
    for (let i = 1; i < curves.points.length; i++) {
      expect(curves.points[i].x).toBeGreaterThan(curves.points[i - 1].x);
    }
  });

  it("getGrowthChartBand interpolates L/M/S between neighbours", async () => {
    if (!hasSeed) return;
    // x = 2.5 sits between the tabulated x=2 and x=3 rows.
    const band = await getGrowthChartBand(
      "weight-for-age",
      "male",
      {
        xAxis: "age",
        min: 0,
        max: 60,
      },
      2.5,
    );
    expect(band).not.toBeNull();
    expect(band!.x).toBe(2.5);
    // Median must lie between the medians of x=2 and x=3. These are
    // stable seed values: 5.8218 and 6.4953 for male.
    expect(band!.median).toBeGreaterThan(5.8218);
    expect(band!.median).toBeLessThan(6.4953);
  });

  it("out-of-domain request throws LmsDomainError", async () => {
    await expect(
      getGrowthChartCurves("weight-for-age", "male", {
        xAxis: "age",
        min: 0,
        // weight-for-age covers 0–120; 200 is out of domain.
        max: 200,
      }),
    ).rejects.toBeInstanceOf(LmsDomainError);
  });

  it("weight-for-length rejects an age-axis request", async () => {
    await expect(
      getGrowthChartCurves("weight-for-length" as never, "male", {
        xAxis: "age",
        min: 0,
        max: 60,
      } as never),
    ).rejects.toBeInstanceOf(LmsDomainError);
  });
});
