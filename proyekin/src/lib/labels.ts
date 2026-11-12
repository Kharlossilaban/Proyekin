// Label dan varian Badge terpusat. Satu sumber untuk role, status proyek, status tugas, prioritas, status
// laporan/dokumen, status tenggat, dan alasan penolakan akses UI. Jangan menulis ulang peta ini di komponen.

import type { DeadlineState } from "@/lib/demo-date";
import type { DenyReason, ProjectDeleteBlockerReason } from "@/lib/access";
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
  // U4-7. Teks lengkap yang menyebut nama ada di `getTeamActionFailureText`.
  NOT_MEMBER: "Pengguna ini sudah tidak terdaftar di proyek.",
  ALREADY_MEMBER: "Pengguna ini sudah terdaftar di proyek.",
  USER_NOT_FOUND: "Data pengguna ini tidak ditemukan.",
  INVALID_CANDIDATE: "Pilihan ini tidak memenuhi syarat.",
  NO_ADMIN: "Proyek ini tidak memiliki Admin penanggung jawab.",
  ADMIN_CHANGED: "Admin penanggung jawab proyek sudah berubah.",
  SAME_ADMIN: "Pengguna ini sudah menjadi Admin penanggung jawab proyek.",
};

// ---------- U4-7: copy tim proyek ----------
// Istilah pengguna: "Admin penanggung jawab" (bukan istilah internal "Admin principal"). Setiap pesan galat menyebut akibatnya
// pada data; pesan sukses menyebut "(simulasi)" karena perubahan hanya di memori tab (J9).

const NO_CHANGE = "Tidak ada data yang diubah.";

/** Pesan galat bila sebab penolakan tidak dikenali (mis. store menolak tanpa alasan yang diketahui). */
export const TEAM_GENERIC_ERROR = "Perubahan belum tersimpan. Coba lagi.";

/** Pesan validasi pilihan kosong di dialog tim. */
export const TEAM_VALIDATION_TEXT = {
  member: "Pilih satu Mandor atau Anggota Tim.",
  admin: "Pilih satu Admin Kantor.",
} as const;

export type TeamSuccessKind = "member-added" | "member-removed" | "admin-assigned" | "admin-replaced" | "admin-revoked";

/** Pesan sukses aksi tim. `previousName` hanya untuk penggantian Admin. */
export function getTeamSuccessText(kind: TeamSuccessKind, ctx: { name: string; previousName?: string }): string {
  switch (kind) {
    case "member-added":
      return `${ctx.name} ditambahkan ke tim proyek (simulasi).`;
    case "member-removed":
      return `${ctx.name} dikeluarkan dari tim proyek (simulasi).`;
    case "admin-assigned":
      return `${ctx.name} ditetapkan sebagai Admin penanggung jawab (simulasi).`;
    case "admin-replaced":
      return `Admin penanggung jawab diganti dari ${ctx.previousName ?? "Admin sebelumnya"} ke ${ctx.name} (simulasi).`;
    case "admin-revoked":
      return `${ctx.name} tidak lagi menjadi Admin penanggung jawab (simulasi).`;
  }
}

/** Anggota tidak dapat dikeluarkan karena masih tercatat di tugas (semua status, termasuk Selesai). Jumlah dari data aktual. */
export function getMemberRemoveBlockedText(name: string, tasks: { total: number; done: number }): string {
  const doneNote =
    tasks.done === 0
      ? ""
      : tasks.done === tasks.total
        ? tasks.total === 1
          ? " (tugas tersebut sudah selesai)"
          : " (semuanya sudah selesai)"
        : ` (${tasks.done} di antaranya sudah selesai)`;
  return `${name} tidak dapat dikeluarkan karena masih tercatat sebagai penanggung jawab ${tasks.total} tugas di proyek ini${doneNote}. ${NO_CHANGE}`;
}

export interface TeamFailureContext {
  /** Anggota yang ditambah/dikeluarkan. */
  memberName?: string;
  /** Admin Kantor yang dipilih (tetapkan/ganti) atau yang hendak dicabut. */
  adminName?: string;
  /** Admin penanggung jawab proyek SEKARANG (stale); kosong bila sudah dicabut. */
  currentAdminName?: string;
  /** Tugas yang masih mencatat anggota (untuk `HAS_TASKS`). */
  tasks?: { total: number; done: number };
}

/** Pesan galat aksi tim per alasan penolakan; spesifik bila sebabnya diketahui, generik hanya untuk sebab tak dikenal. */
export function getTeamActionFailureText(reason: string, ctx: TeamFailureContext = {}): string {
  const member = ctx.memberName ?? "Pengguna ini";
  switch (reason) {
    case "ROLE":
      return `Peran Anda tidak lagi memiliki hak untuk aksi ini. ${NO_CHANGE}`;
    case "ARCHIVED":
      return `Proyek ini sudah berstatus Arsip dan hanya dapat dibaca. ${NO_CHANGE}`;
    case "ALREADY_MEMBER":
      return `${member} sudah terdaftar di proyek ini. ${NO_CHANGE} Pilih anggota lain.`;
    case "NOT_MEMBER":
      return `${member} sudah tidak terdaftar di proyek ini. ${NO_CHANGE}`;
    case "USER_NOT_FOUND":
      return `Data pengguna ini tidak ditemukan. ${NO_CHANGE}`;
    case "PROJECT_NOT_FOUND":
      return `Proyek ini sudah tidak ada di data demo. ${NO_CHANGE}`;
    case "INVALID_CANDIDATE":
      return `Pilihan ini tidak memenuhi syarat. Pilih dari daftar yang tersedia. ${NO_CHANGE}`;
    case "HAS_TASKS":
      return getMemberRemoveBlockedText(member, ctx.tasks ?? { total: 0, done: 0 });
    case "NO_ADMIN":
      return `Proyek ini sudah tidak memiliki Admin penanggung jawab. ${NO_CHANGE}`;
    case "ADMIN_CHANGED":
      return ctx.currentAdminName
        ? `Admin penanggung jawab sudah berubah menjadi ${ctx.currentAdminName}. Periksa lagi sebelum melanjutkan. ${NO_CHANGE}`
        : `Admin penanggung jawab sudah dicabut. Periksa lagi sebelum melanjutkan. ${NO_CHANGE}`;
    case "SAME_ADMIN":
      return `${ctx.adminName ?? "Pengguna ini"} sudah menjadi Admin penanggung jawab proyek ini. Pilih Admin Kantor lain.`;
    default:
      return TEAM_GENERIC_ERROR;
  }
}

/**
 * Alasan proyek tidak dapat dihapus (U4-6), berbeda dari `DENY_REASON_LABELS` yang ditulis untuk anggota/akun.
 * `adminName` hanya untuk Admin Kantor penanggung jawab. Tidak ada penghapusan berantai.
 */
export function getProjectDeleteBlockerText(reason: ProjectDeleteBlockerReason, count: number, adminName?: string): string {
  switch (reason) {
    case "HAS_TASKS":
      return `${count} tugas masih tercatat di proyek ini.`;
    case "HAS_MEMBERSHIPS":
      return `${count} anggota tim masih terdaftar di proyek ini.`;
    case "IS_ADMIN_PRINCIPAL":
      return adminName
        ? `Admin Kantor penanggung jawab masih ditetapkan: ${adminName}.`
        : "Admin Kantor penanggung jawab masih ditetapkan.";
  }
}

// Fungsi per domain. Menggantikan `getStatusLabel()` lama di utils.ts, yang selalu memakai peta proyek apa pun
// domainnya (label tugas "TODO" jatuh ke "TODO") dan mengabaikan parameter `lang`.
const lookup = (map: Record<string, string>, key: string): string => map[key] ?? key;

export const getRoleLabel = (key: string): string => lookup(ROLE_LABELS, key);
export const getProjectStatusLabel = (key: string): string => lookup(PROJECT_STATUS_LABELS, key);
export const getTaskStatusLabel = (key: string): string => lookup(TASK_STATUS_LABELS, key);
export const getTaskPriorityLabel = (key: string): string => lookup(TASK_PRIORITY_LABELS, key);
export const getReportStatusLabel = (key: string): string => lookup(REPORT_STATUS_LABELS, key);
export const getDocumentStatusLabel = (key: string): string => lookup(DOCUMENT_STATUS_LABELS, key);
