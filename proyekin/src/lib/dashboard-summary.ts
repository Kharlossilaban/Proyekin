// Ringkasan Dashboard (Dashboard Access Correction, keputusan Owner 2026-11-13). Fungsi murni yang HANYA MENURUNKAN angka dari
// data dalam lingkup pelaku. Aturan siapa melihat apa tetap di `access.ts` (`canViewDashboard`, `getVisibleProjects`,
// `getVisibleTasks`, `seesAllProjects`); modul ini tidak memeriksa role sendiri. Semua informasi turunan (kartu statistik,
// tabel proyek, kalimat lingkup) berasal dari satu daftar proyek terlihat, sehingga tidak ada jalur yang memakai seed penuh.
// Representasi UI mock, BUKAN otorisasi: penegakan sesungguhnya wajib di server/backend.

import { canViewDashboard, getVisibleProjects, getVisibleTasks, seesAllProjects, type AccessData, type Actor } from "@/lib/access";
import { getProjectTeam } from "@/lib/project-relations";
import type { DailyReport, Project, ProjectStatus } from "@/types";

/** Status proyek yang dihitung sebagai "Proyek Aktif" (sama dengan Dashboard sebelumnya): Berjalan atau Tertunda. */
const ACTIVE_PROJECT_STATUSES: readonly ProjectStatus[] = ["ON_PROGRESS", "PAUSED"];

/** ALL = seluruh proyek organisasi (Owner); ASSIGNED = proyek yang ditangani; NONE = tidak ada proyek dalam lingkup. */
export type DashboardScope = "ALL" | "ASSIGNED" | "NONE";

export interface DashboardSummary {
  scope: DashboardScope;
  /** Proyek dalam lingkup, urutan sama dengan store. */
  projects: Project[];
  activeProjects: number;
  /** Tugas dalam lingkup yang belum Selesai. */
  pendingTasks: number;
  /** Laporan berstatus Terkirim pada proyek dalam lingkup. */
  pendingReports: number;
  /** Orang unik di tim proyek dalam lingkup (Admin penanggung jawab + anggota); satu orang dihitung sekali. */
  teamMembers: number;
}

const EMPTY: DashboardSummary = { scope: "NONE", projects: [], activeProjects: 0, pendingTasks: 0, pendingReports: 0, teamMembers: 0 };

export function getDashboardSummary(actor: Actor, data: AccessData, reports: readonly DailyReport[]): DashboardSummary {
  if (!canViewDashboard(actor)) return EMPTY;
  const projects = getVisibleProjects(actor, data);
  const projectIds = new Set(projects.map((p) => p.id));
  const people = new Set(projects.flatMap((p) => getProjectTeam(p, data).map((entry) => entry.user.id)));
  return {
    scope: seesAllProjects(actor) ? "ALL" : projects.length > 0 ? "ASSIGNED" : "NONE",
    projects,
    activeProjects: projects.filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status)).length,
    // Lingkup tugas sepenuhnya dari getVisibleTasks (canViewTask sudah membatasi ke proyek yang terlihat).
    pendingTasks: getVisibleTasks(actor, data).filter((t) => t.status !== "DONE").length,
    pendingReports: reports.filter((r) => projectIds.has(r.projectId) && r.status === "SUBMITTED").length,
    teamMembers: people.size,
  };
}
