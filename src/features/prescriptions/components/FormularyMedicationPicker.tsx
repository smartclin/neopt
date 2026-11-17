import { EGYPTIAN_NATIONAL_FORMULARY } from "@data/formulary/egyptianNationalFormulary";
import { NEONATAL_PEDIATRIC_FORMULARY } from "@data/formulary/neonatalDrugs";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MedicationOption {
  id: string;
  name: string;
  searchText: string;
  source: string;
  detail: string;
}

const MEDICATION_OPTIONS: MedicationOption[] = [
  ...EGYPTIAN_NATIONAL_FORMULARY.map((drug) => ({
    id: `egyptian:${drug.id}`,
    name: drug.genericName,
    searchText: [
      drug.genericName,
      drug.brandNamesEgypt.join(" "),
      drug.pharmacologicalCategory,
      drug.indications.join(" "),
    ]
      .join(" ")
      .toLocaleLowerCase(),
    source: "Egyptian formulary",
    detail: [
      drug.brandNamesEgypt.length ? `Brands: ${drug.brandNamesEgypt.join(", ")}` : "",
      drug.pediatricDosing.standardDosePerKg !== undefined
        ? `Reference dose: ${drug.pediatricDosing.standardDosePerKg} ${drug.pediatricDosing.doseUnit}`
        : "",
      drug.indications[0],
    ]
      .filter(Boolean)
      .join(" · "),
  })),
  ...NEONATAL_PEDIATRIC_FORMULARY.map((drug) => ({
    id: `neonatal:${drug.id}`,
    name: drug.genericName,
    searchText: [drug.name, drug.genericName, drug.category, drug.indication]
      .join(" ")
      .toLocaleLowerCase(),
    source: "Neonatal formulary",
    detail: `${drug.indication} · ${drug.standardDose} ${drug.doseUnit}`,
  })),
].toSorted((a, b) => a.name.localeCompare(b.name));

interface FormularyMedicationPickerProps {
  id: string;
  onSelect: (medicationName: string) => void;
}

export function FormularyMedicationPicker({ id, onSelect }: FormularyMedicationPickerProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const selected = MEDICATION_OPTIONS.find((option) => option.id === selectedId);
  const filteredOptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? MEDICATION_OPTIONS.filter((option) => option.searchText.includes(query))
      : MEDICATION_OPTIONS;
  }, [search]);

  return (
    <div className="bg-muted/30 grid gap-2 rounded-md p-3">
      <Label htmlFor={`${id}-search`}>Find medication in a formulary</Label>
      <Input
        autoComplete="off"
        id={`${id}-search`}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search generic name, brand, or indication"
        value={search}
      />
      <Select
        onValueChange={(value) => {
          if (!value) return;
          const option = MEDICATION_OPTIONS.find((item) => item.id === value);
          if (!option) return;
          setSelectedId(option.id);
          onSelect(option.name);
        }}
        value={selectedId}
      >
        <SelectTrigger aria-label="Select a formulary medication">
          <SelectValue placeholder="Choose a medication" />
        </SelectTrigger>
        <SelectContent>
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name} · {option.source}
              </SelectItem>
            ))
          ) : (
            <div className=" px-3 py-2 text-sm">
              No formulary matches. You can still enter a medication manually.
            </div>
          )}
        </SelectContent>
      </Select>
      {selected && (
        <p className=" text-xs">
          {selected.source}: {selected.detail}
        </p>
      )}
      <p className=" text-xs">
        Reference information only. Confirm indication, patient-specific dose, and formulation
        before prescribing.
      </p>
    </div>
  );
}
