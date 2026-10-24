// Tanggal acuan SIMULASI untuk status tenggat (keputusan pemilik G10). Ini BUKAN tanggal hari ini.
//
// Seluruh seed mock berhenti di 21 Maret 2026 (laporan terakhir r-003), sehingga tenggat dievaluasi terhadap
// tanggal itu agar hasilnya konsisten dan tidak berubah mengikuti jam sistem. Evaluasi hanya memakai TANGGAL
// (YYYY-MM-DD); jam dan tanggal sistem sengaja tidak dipakai. UI wajib menampilkan DEMO_DATE_NOTICE di halaman
// yang menampilkan status tenggat.

import type { Task } from "@/types";

/** Satu-satunya sumber nilai tanggal acuan demo (format YYYY-MM-DD). */
export const DEMO_REFERENCE_DATE = "2026-03-21";

/** "21 Maret 2026" — diformat di UTC agar sama di server dan klien (tanpa hydration mismatch). */
export const DEMO_REFERENCE_DATE_LABEL = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date(`${DEMO_REFERENCE_DATE}T00:00:00Z`));

/** Teks penjelasan untuk UI tahap berikutnya. */
export const DEMO_DATE_NOTICE = `Status tenggat dihitung terhadap tanggal acuan demo ${DEMO_REFERENCE_DATE_LABEL}, bukan tanggal hari ini.`;

export type DeadlineState = "NONE" | "DONE" | "OVERDUE" | "DUE_TODAY" | "UPCOMING";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}/;

/** Ambil bagian tanggal saja; null bila format tidak valid. */
export function toDateOnly(value: string | undefined): string | null {
  if (!value || !DATE_ONLY.test(value)) return null;
  return value.slice(0, 10);
}

/**
 * Status tenggat sebuah tugas terhadap tanggal acuan.
 * - Selesai → DONE; tanpa tenggat valid → NONE.
 * - Terlambat: tenggat lebih awal dari acuan. Jatuh tempo hari ini: sama. Mendatang: lebih akhir (tanpa ambang hari).
 */
export function getDeadlineState(
  task: Pick<Task, "status" | "dueDate">,
  reference: string = DEMO_REFERENCE_DATE,
): DeadlineState {
  if (task.status === "DONE") return "DONE";
  const due = toDateOnly(task.dueDate);
  const ref = toDateOnly(reference);
  if (!due || !ref) return "NONE";
  // YYYY-MM-DD dapat dibandingkan secara leksikografis.
  if (due < ref) return "OVERDUE";
  if (due === ref) return "DUE_TODAY";
  return "UPCOMING";
}

export const isOverdue = (task: Pick<Task, "status" | "dueDate">, reference?: string): boolean =>
  getDeadlineState(task, reference) === "OVERDUE";

export const countOverdue = (tasks: readonly Pick<Task, "status" | "dueDate">[], reference?: string): number =>
  tasks.filter((task) => isOverdue(task, reference)).length;
