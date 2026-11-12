// Galat aksi tim proyek (U4-7). Dilempar dialog saat pemeriksaan ulang terhadap snapshot store terbaru menolak aksi, agar
// `ConfirmDialog` (prop `errorMessage`) dan dialog form menampilkan sebab yang SPESIFIK, bukan pesan generik.
// Aturan role tidak ada di sini (lihat `lib/access.ts`); berkas ini hanya membawa alasan dan konteks untuk teks.

import { getTeamActionFailureText, TEAM_GENERIC_ERROR, type TeamFailureContext } from "@/lib/labels";

export class TeamActionError extends Error {
  readonly reason: string;
  readonly context: TeamFailureContext;

  constructor(reason: string, context: TeamFailureContext = {}) {
    super(reason);
    this.name = "TeamActionError";
    this.reason = reason;
    this.context = context;
  }
}

/** Teks galat untuk pengguna: spesifik bila alasannya diketahui, generik ("Perubahan belum tersimpan. Coba lagi.") bila tidak. */
export const describeTeamActionError = (error: unknown): string =>
  error instanceof TeamActionError ? getTeamActionFailureText(error.reason, error.context) : TEAM_GENERIC_ERROR;
