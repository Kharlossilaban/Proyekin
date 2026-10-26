// Label dan varian Badge terpusat. Satu sumber untuk role, status proyek, status tugas, prioritas, status
// laporan/dokumen, status tenggat, dan alasan penolakan akses UI. Jangan menulis ulang peta ini di komponen.

import type { DeadlineState } from "@/lib/demo-date";
import type { DenyReason } from "@/lib/access";
import type { ProjectStatus, Role, TaskPriority, TaskStatus } from "@/types";

/** Sama dengan varian `Badge`. */
export type BadgeTone = "brand" | "neutral" | "info" | "success" | "warning" | "danger";

/** Label lima role resmi (bukan pilihan form; lihat `roles.ts` untuk daftar pilihan). */
export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin Kantor",
  MANDOR: "Mandor",
  ANGGOTA: "Anggota Tim",
  GUEST: "Guest",
};

export const ROLE_TONES: Record<Role, BadgeTone> = {
  OWNER: "brand",
  ADMIN: "info",
  MANDOR: "success",
  ANGGOTA: "neutral",
  GUEST: "neutral",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draf",
  ON_PROGRESS: "Berjalan",
  PAUSED: "Tertunda",
  COMPLETED: "Selesai",
  ARCHIVED: "Arsip",
};

export const PROJECT_STATUS_TONES: Record<ProjectStatus, BadgeTone> = {
  DRAFT: "neutral",
  ON_PROGRESS: "success",
  PAUSED: "warning",
  COMPLETED: "neutral",
  ARCHIVED: "neutral",
};

/** Status yang boleh DIPILIH di form proyek (J7). Arsip tidak dapat dipilih (kelas C). */
export const PROJECT_STATUS_OPTIONS: readonly ProjectStatus[] = ["DRAFT", "ON_PROGRESS", "PAUSED", "COMPLETED"];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Belum Dimulai",
  IN_PROGRESS: "Dalam Progres",
  DONE: "Selesai",
};

export const TASK_STATUS_TONES: Record<TaskStatus, BadgeTone> = {
  TODO: "neutral",
  IN_PROGRESS: "warning",
  DONE: "success",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
};

export const TASK_PRIORITY_TONES: Record<TaskPriority, BadgeTone> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

export const DEADLINE_STATE_LABELS: Record<DeadlineState, string> = {
  NONE: "Tanpa tenggat",
  DONE: "Selesai",
  OVERDUE: "Terlambat",
  DUE_TODAY: "Jatuh tempo hari ini",
  UPCOMING: "Mendatang",
};

export const DEADLINE_STATE_TONES: Record<DeadlineState, BadgeTone> = {
  NONE: "neutral",
  DONE: "success",
  OVERDUE: "danger",
  DUE_TODAY: "warning",
  UPCOMING: "neutral",
};

// Dipindahkan dari `utils.ts` (peta lama itu dipakai oleh fungsi yang salah, lihat catatan di bawah). Dipakai U5.
export const REPORT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draf",
  SUBMITTED: "Terkirim",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PUBLIK: "Publik",
  PRIVAT: "Privat",
  ARKIP: "Arsip",
};

/** Alasan UI menolak sebuah aksi (lihat `access.ts`). Representasi UI, bukan kontrol keamanan. */
export const DENY_REASON_LABELS: Record<DenyReason, string> = {
  ROLE: "Peran Anda tidak memiliki hak untuk aksi ini.",
  ARCHIVED: "Proyek berstatus Arsip bersifat hanya baca.",
  HAS_TASKS: "Masih memegang tugas. Alihkan tugasnya terlebih dahulu.",
  HAS_MEMBERSHIPS: "Masih menjadi anggota proyek. Keluarkan dari proyek terlebih dahulu.",
  IS_ADMIN_PRINCIPAL: "Masih menjadi Admin Kantor principal proyek. Ganti Admin principal terlebih dahulu.",
  PROTECTED_ACCOUNT: "Akun Owner tidak dapat diubah atau dihapus pada tahap ini.",
};

// Fungsi per domain. Menggantikan `getStatusLabel()` lama di utils.ts, yang selalu memakai peta proyek apa pun
// domainnya (label tugas "TODO" jatuh ke "TODO") dan mengabaikan parameter `lang`.
const lookup = (map: Record<string, string>, key: string): string => map[key] ?? key;

export const getRoleLabel = (key: string): string => lookup(ROLE_LABELS, key);
export const getProjectStatusLabel = (key: string): string => lookup(PROJECT_STATUS_LABELS, key);
export const getTaskStatusLabel = (key: string): string => lookup(TASK_STATUS_LABELS, key);
export const getTaskPriorityLabel = (key: string): string => lookup(TASK_PRIORITY_LABELS, key);
export const getReportStatusLabel = (key: string): string => lookup(REPORT_STATUS_LABELS, key);
export const getDocumentStatusLabel = (key: string): string => lookup(DOCUMENT_STATUS_LABELS, key);
