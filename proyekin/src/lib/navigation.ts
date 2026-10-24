import { canAccessSection, getHomePath, type AppSection } from "@/lib/access";
import type { User } from "@/types";

/**
 * Menu aplikasi. Siapa yang boleh melihat tiap menu TIDAK didefinisikan di sini: semuanya memakai
 * `canAccessSection` (access.ts), sumber yang sama dengan guard URL. Jangan menambahkan daftar role di berkas ini.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  section: AppSection;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", section: "dashboard" },
  { label: "Proyek", href: "/proyek", icon: "FolderKanban", section: "proyek" },
  { label: "Tugas", href: "/tugas", icon: "ListChecks", section: "tugas" },
  { label: "Laporan", href: "/laporan", icon: "FileText", section: "laporan" },
  { label: "Dokumen", href: "/dokumen", icon: "Files", section: "dokumen" },
  { label: "Anggota", href: "/anggota", icon: "Users", section: "anggota" },
  { label: "Pengaturan", href: "/pengaturan", icon: "Settings", section: "pengaturan" },
];

/**
 * Menu untuk pengguna ini. Halaman awal role (J2: Dashboard untuk Owner/Admin, Tugas untuk Mandor/Anggota Tim)
 * selalu menjadi menu pertama; urutan lainnya mengikuti NAV_ITEMS. Guest/kosong: tidak ada menu (tanpa App Shell).
 * Representasi UI saja, bukan otorisasi.
 */
export function getNavForUser(user: User | null | undefined): NavItem[] {
  if (!user) return [];
  const items = NAV_ITEMS.filter((item) => canAccessSection(user, item.section));
  const home = items.find((item) => item.href === getHomePath(user.role));
  return home ? [home, ...items.filter((item) => item !== home)] : items;
}

/** Bagian aplikasi untuk sebuah path (berdasarkan menu), atau null bila path tidak termasuk bagian mana pun. */
export function getSectionForPath(pathname: string): AppSection | null {
  const item = NAV_ITEMS.find((candidate) => pathname === candidate.href || pathname.startsWith(`${candidate.href}/`));
  return item?.section ?? null;
}
