// Relasi data untuk tampilan proyek (U4-5). Hanya MENURUNKAN tampilan dari relasi yang sudah ada di store mock:
// siapa tim sebuah proyek, nama pengguna dari relasi `User`, dan periode proyek. TIDAK memuat aturan izin
// (siapa boleh melihat apa) — itu hanya ada di `access.ts`. Fungsi murni, aman dipakai server dan klien.

import { formatDemoDate } from "@/lib/demo-date";
import type { Project, ProjectMember, User } from "@/types";

export interface ProjectRelationData {
  readonly users: readonly User[];
  readonly members: readonly ProjectMember[];
}

export interface TeamEntry {
  user: User;
  /** Admin Kantor penanggung jawab proyek (`Project.adminId`), bukan anggota (`ProjectMember`). */
  isAdminPrincipal: boolean;
}

/**
 * Susunan tim: Admin principal lebih dulu (bila ada dan penggunanya dikenal), lalu anggota proyek sesuai urutan
 * keanggotaan. Pengguna yang tidak dikenal dilewati; satu pengguna tidak muncul dua kali.
 */
export function getProjectTeam(project: Project, data: ProjectRelationData): TeamEntry[] {
  const entries: TeamEntry[] = [];
  const seen = new Set<string>();
  const add = (userId: string | undefined, isAdminPrincipal: boolean) => {
    if (!userId || seen.has(userId)) return;
    const user = data.users.find((u) => u.id === userId);
    if (!user) return;
    seen.add(userId);
    entries.push({ user, isAdminPrincipal });
  };
  add(project.adminId, true);
  for (const member of data.members) if (member.projectId === project.id) add(member.userId, false);
  return entries;
}

/** Nama pengguna dari relasi `User` (bukan salinan teks legacy seperti `Task.assigneeName`); undefined bila tidak dikenal. */
export const getUserName = (users: readonly User[], userId: string | undefined): string | undefined =>
  userId ? users.find((u) => u.id === userId)?.name : undefined;

/** "15 Jan 2026 – 30 Jun 2026"; hanya satu ujung bila lainnya tidak valid; "—" bila keduanya tidak valid. */
export function formatProjectPeriod(project: Pick<Project, "startDate" | "endDate">): string {
  const start = formatDemoDate(project.startDate);
  const end = formatDemoDate(project.endDate);
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? "—";
}
