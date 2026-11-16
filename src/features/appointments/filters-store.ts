// features/appointments/filters-store.ts
import { createStore, useSelector } from "@tanstack/react-store";

import type { AppointmentStatus } from "./status";

export interface AppointmentFilters {
  search: string;
  doctorId: string;
  status: AppointmentStatus | "";
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_FILTERS: AppointmentFilters = {
  search: "",
  doctorId: "",
  status: "",
  dateFrom: "",
  dateTo: "",
};

export const appointmentFiltersStore = createStore<AppointmentFilters>(DEFAULT_FILTERS);

export function setFilter<K extends keyof AppointmentFilters>(
  key: K,
  value: AppointmentFilters[K],
) {
  appointmentFiltersStore.setState((prev) => ({ ...prev, [key]: value }));
}

export function patchFilters(patch: Partial<AppointmentFilters>) {
  appointmentFiltersStore.setState((prev) => ({ ...prev, ...patch }));
}

export function resetFilters() {
  appointmentFiltersStore.setState(() => DEFAULT_FILTERS);
}

// Narrow selector — components re-render only when their slice changes.
export function useAppointmentFilter<K extends keyof AppointmentFilters>(
  key: K,
): AppointmentFilters[K] {
  return useSelector(appointmentFiltersStore, (s) => s[key]);
}

export function useAppointmentFilters(): AppointmentFilters {
  return useSelector(appointmentFiltersStore, (s) => s);
}
