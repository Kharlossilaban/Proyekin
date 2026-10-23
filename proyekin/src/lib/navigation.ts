import type { Role } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    roles: ["OWNER", "ADMIN", "MANDOR", "ANGGOTA"],
  },
  {
    label: "Proyek",
    href: "/proyek",
    icon: "FolderKanban",
    roles: ["OWNER", "ADMIN", "MANDOR", "ANGGOTA"],
  },
  {
    label: "Tugas",
    href: "/tugas",
    icon: "ListChecks",
    roles: ["OWNER", "ADMIN", "MANDOR", "ANGGOTA"],
  },
  {
    label: "Laporan",
    href: "/laporan",
    icon: "FileText",
    roles: ["OWNER", "ADMIN", "MANDOR"],
  },
  {
    label: "Dokumen",
    href: "/dokumen",
    icon: "Files",
    roles: ["OWNER", "ADMIN", "MANDOR", "ANGGOTA"],
  },
  {
    label: "Anggota",
    href: "/anggota",
    icon: "Users",
    roles: ["OWNER", "ADMIN", "MANDOR", "ANGGOTA"],
  },
  {
    label: "Pengaturan",
    href: "/pengaturan",
    icon: "Settings",
    roles: ["OWNER", "ADMIN"],
  },
];

export function getNavForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin Kantor",
  MANDOR: "Mandor",
  ANGGOTA: "Anggota Tim",
  GUEST: "Guest",
};
