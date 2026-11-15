import { EGYPTIAN_NATIONAL_FORMULARY } from "@data/formulary/egyptianNationalFormulary";
import { NEONATAL_PEDIATRIC_FORMULARY } from "@data/formulary/neonatalDrugs";
import { db } from "@/db";
import * as schema from "../schema";

async function seedDrugFormulary() {
  console.log("\n💊 Seeding Egyptian National Drug Formulary…");

  const rows = EGYPTIAN_NATIONAL_FORMULARY.map((drug) => ({
    id: drug.id,
    genericName: drug.genericName,
    pharmacologicalCategory: drug.pharmacologicalCategory,
    atcCode: drug.atcCode,
    awareClassification: drug.awareClassification,
    data: drug,
  })) satisfies (typeof schema.drugFormulary.$inferInsert)[];

  await db.insert(schema.drugFormulary).values(rows).onConflictDoNothing();
  console.log(`   ✔ ${rows.length} drugs in Egyptian National Formulary`);
}

async function seedNeonatalFormulary() {
  console.log("\n👶 Seeding Neonatal & Pediatric Drug Formulary…");

  const rows = NEONATAL_PEDIATRIC_FORMULARY.map((drug) => ({
    id: drug.id,
    name: drug.name,
    genericName: drug.genericName,
    category: drug.category,
    data: drug,
  })) satisfies (typeof schema.neonatalFormulary.$inferInsert)[];

  await db.insert(schema.neonatalFormulary).values(rows).onConflictDoNothing();
  console.log(`   ✔ ${rows.length} drugs in Neonatal & Pediatric Formulary`);
}

export async function seedFormulary() {
  await seedDrugFormulary();
  await seedNeonatalFormulary();
}
