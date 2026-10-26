// Konstanta role. Lima role resmi saja: Owner, Admin Kantor, Mandor, Anggota Tim, Guest.
// Tidak ada role, persona, fitur, atau kategori lain (aturan mutlak di CLAUDE.md §6); tidak boleh ditambah di sini.
//
// Daftar di bawah SENGAJA terpisah: "role yang ada" (label) tidak sama dengan "role yang boleh dipilih/menerima
// sesuatu" pada form atau penugasan tertentu. Jangan menggabungkan atau memakai satu daftar untuk keperluan lain.
// Label tampilan ada di `labels.ts` (ROLE_LABELS).

import type { Role } from "@/types";

/** Kelima role resmi (urutan tampil). Hanya untuk iterasi/validasi, bukan pilihan form. */
export const ALL_ROLES: readonly Role[] = ["OWNER", "ADMIN", "MANDOR", "ANGGOTA", "GUEST"];

/** L2 — satu-satunya role yang boleh menjadi Admin principal proyek (`Project.adminId`). */
export const ADMIN_PRINCIPAL_ROLE: Role = "ADMIN";

/** L2 — role yang boleh menjadi anggota proyek (`ProjectMember`). Admin principal tidak termasuk (field tersendiri). */
export const PROJECT_MEMBER_ROLES: readonly Role[] = ["MANDOR", "ANGGOTA"];

/** L3 — role yang boleh menjadi penanggung jawab tugas (J6); pengguna juga harus anggota proyek tugas itu. */
export const TASK_ASSIGNEE_ROLES: readonly Role[] = ["MANDOR", "ANGGOTA"];

/**
 * L1 — role global yang boleh DITAMBAHKAN oleh pelaku berperan tertentu (kunci = role pelaku).
 * Owner: Admin Kantor, Mandor, Anggota Tim. Admin: hanya Mandor dan Anggota Tim (J4). Role lain: tidak ada.
 * Owner tidak pernah menjadi pilihan (kepemilikan di luar U4, G4); Guest tidak punya akun (U3-1).
 */
export const ORG_ROLE_OPTIONS: Readonly<Record<Role, readonly Role[]>> = {
  OWNER: ["ADMIN", "MANDOR", "ANGGOTA"],
  ADMIN: ["MANDOR", "ANGGOTA"],
  MANDOR: [],
  ANGGOTA: [],
  GUEST: [],
};
