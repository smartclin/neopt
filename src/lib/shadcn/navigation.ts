import {
  Building2Icon,
  CalendarPlusIcon,
  ClipboardListIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  SyringeIcon,
  UsersIcon,
} from "lucide-react";

/**
 * One list drives the sidebar and the command menu.
 *
 * Route constants must match the file-based routes produced by
 * `routeTree.gen.ts`. When you add a route, add the entry here — the
 * `AppShell` and `CommandMenu` both derive everything from these arrays.
 */
export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/patients", label: "Patients", icon: UsersIcon },
  { to: "/appointments", label: "Appointments", icon: CalendarPlusIcon },
  { to: "/visits", label: "Visits", icon: ClipboardListIcon },
  { to: "/prescriptions", label: "Prescriptions", icon: SyringeIcon },
  { to: "/immunizations", label: "Immunizations", icon: ShieldCheckIcon },
  { to: "/clinics", label: "Clinics", icon: Building2Icon },
] as const;

/**
 * Outbound reference links — rendered in the sidebar's second group and in
 * the command menu's "References" group. Lucide icons (not brand marks),
 * because these are functional links a clinician opens mid-task, not
 * marketing tiles.
 */
export interface ResourceLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const RESOURCES: readonly ResourceLink[] = [
  {
    href: "https://www.who.int/tools/child-growth-standards/standards",
    label: "WHO Growth Standards",
    icon: StethoscopeIcon,
  },
  {
    href: "https://icd.who.int/browse10/2019/en",
    label: "ICD-10 Browser",
    icon: FileTextIcon,
  },
] as const;
