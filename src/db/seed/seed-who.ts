import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import lhfaBoys from "@data/who/lhfa-boys.json";
import lhfaGirls from "@data/who/lhfa-girls.json";
import wfaBoys from "@data/who/wfa-boys.json";
import wfaGirls from "@data/who/wfa-girls.json";

import { closeDb, db } from "@/db";
import { growthStandards } from "../schema";

interface WhoGrowthRow {
  Day: number;
  L: number;
  M: number;
  S: number;
  SD4neg: number;
  SD3neg: number;
  SD2neg: number;
  SD1neg: number;
  SD0: number;
  SD1: number;
  SD2: number;
  SD3: number;
  SD4: number;
}

const datasets = [
  { metric: "lhfa", gender: "boys", rows: lhfaBoys },
  { metric: "lhfa", gender: "girls", rows: lhfaGirls },
  { metric: "wfa", gender: "boys", rows: wfaBoys },
  { metric: "wfa", gender: "girls", rows: wfaGirls },
] satisfies ReadonlyArray<{
  metric: "lhfa" | "wfa";
  gender: "boys" | "girls";
  rows: WhoGrowthRow[];
}>;

function assertValidDataset(dataset: (typeof datasets)[number]): void {
  if (dataset.rows.length !== 1857) {
    throw new Error(
      `WHO ${dataset.metric}/${dataset.gender} must contain 1,857 daily rows; got ${dataset.rows.length}`,
    );
  }

  for (const [index, row] of dataset.rows.entries()) {
    if (row.Day !== index) {
      throw new Error(
        `WHO ${dataset.metric}/${dataset.gender} has a missing or unordered day at row ${index}`,
      );
    }

    const values = [
      row.L,
      row.M,
      row.S,
      row.SD4neg,
      row.SD3neg,
      row.SD2neg,
      row.SD1neg,
      row.SD0,
      row.SD1,
      row.SD2,
      row.SD3,
      row.SD4,
    ];
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error(
        `WHO ${dataset.metric}/${dataset.gender} contains a non-finite value on day ${row.Day}`,
      );
    }
    if (row.M <= 0 || row.S <= 0) {
      throw new Error(
        `WHO ${dataset.metric}/${dataset.gender} has invalid LMS values on day ${row.Day}`,
      );
    }

    const bands = [
      row.SD4neg,
      row.SD3neg,
      row.SD2neg,
      row.SD1neg,
      row.SD0,
      row.SD1,
      row.SD2,
      row.SD3,
      row.SD4,
    ];
    if (bands.some((value, bandIndex) => bandIndex > 0 && value <= bands[bandIndex - 1])) {
      throw new Error(
        `WHO ${dataset.metric}/${dataset.gender} has unordered SD bands on day ${row.Day}`,
      );
    }
  }
}

function toInsert(dataset: (typeof datasets)[number]) {
  return dataset.rows.map((row) => ({
    metric: dataset.metric,
    gender: dataset.gender,
    day: row.Day,
    l: row.L,
    m: row.M,
    s: row.S,
    sd4neg: row.SD4neg,
    sd3neg: row.SD3neg,
    sd2neg: row.SD2neg,
    sd1neg: row.SD1neg,
    sd0: row.SD0,
    sd1: row.SD1,
    sd2: row.SD2,
    sd3: row.SD3,
    sd4: row.SD4,
  }));
}

export async function seedWhoGrowthStandards() {
  for (const dataset of datasets) assertValidDataset(dataset);

  await db.delete(growthStandards);
  for (const dataset of datasets) {
    const rows = toInsert(dataset);
    for (let index = 0; index < rows.length; index += 100) {
      await db.insert(growthStandards).values(rows.slice(index, index + 100));
    }
    console.log(`Seeded WHO ${dataset.metric}/${dataset.gender}: ${rows.length} rows`);
  }
}

const entryPath = process.argv[1];
if (entryPath && resolve(entryPath) === fileURLToPath(import.meta.url)) {
  seedWhoGrowthStandards()
    .catch((error: unknown) => {
      console.error("Failed to seed WHO growth standards:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await closeDb();
    });
}
