const permittedRoles = new Set(["admin", "doctor", "staff"]);

export function canUseAssistantRole(role: string | undefined): boolean {
  return role !== undefined && permittedRoles.has(role);
}

export function resolveAssistantClinicId(
  role: string | undefined,
  userClinicId: string | null | undefined,
  patientClinicId?: string | null,
): string | null {
  if (!canUseAssistantRole(role)) return null;

  const clinicId = patientClinicId ?? userClinicId;
  if (!clinicId) return null;
  if (role !== "admin" && clinicId !== userClinicId) return null;

  return clinicId;
}
