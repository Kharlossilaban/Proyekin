# PROYEKIN — Rencana Non-UI (Draf untuk Persetujuan)

Status: **draf, belum disetujui.** Dasar: stack yang direkomendasikan di `docs/deep-research-report.md` (NestJS, PostgreSQL, Prisma, NextAuth + JWT, S3/MinIO). Keputusan arsitektur besar tetap butuh persetujuan pemilik sebelum dikerjakan. Tidak ada bagian di sini yang sudah diimplementasikan.

## 1. Backend (NestJS)
- Putuskan struktur repo: monorepo (Turborepo) atau folder terpisah `api/` di samping `proyekin/`.
- Modul per fitur MVP: Auth, Users, Projects, Tasks, Reports, Documents, Dashboard.
- API REST dengan validasi input (DTO + class-validator) dan error response seragam.
- Hanya scope kelas A. Vendor (B) dan fitur C tidak dibuat.

## 2. Database (PostgreSQL + Prisma)
- Skema awal: User (role dari lima role resmi), Project, ProjectMember, Task, DailyReport, Document.
- Migrasi dikelola Prisma; setiap migrasi diajukan dulu karena termasuk perubahan skema.
- Field di luar spesifikasi (versioning dokumen, multi-company, harga) tidak dimasukkan sebelum ada keputusan.
- Seed dari contoh `PRJ-001 – Renovasi Gedung Kantor Batam`.

## 3. Authentication dan authorization
- Registrasi, login, reset password via email (spesifikasi).
- Verifikasi email: diajukan sebagai proposal terpisah sebelum implementasi.
- NextAuth di frontend, Passport JWT di backend; RBAC per modul untuk lima role.
- Aturan akses (dari spesifikasi): Owner penuh; Admin Kantor mengelola proyek yang ditugaskan; Mandor hanya proyek yang ditugaskan, memperbarui tugas tim, membuat laporan harian, mengunggah foto/dokumen; Anggota melihat dan menandai progres tugasnya; Guest hanya konten publik.
- Penegakan di sisi server, bukan hanya UI.

## 4. Integrasi API (frontend ↔ backend)
- Klien API bertipe (tipe bersama atau hasil generate dari OpenAPI).
- Ganti mock data per modul secara bertahap; modul yang masih mock harus ditandai jelas di UI/dokumen.

## 5. Testing
- Unit test (Jest) untuk service dan guard RBAC.
- Test API/e2e untuk alur utama: login, buat proyek, tugas, laporan harian, upload dokumen.
- Test komponen dan e2e UI (Playwright) untuk alur kritis; pemeriksaan aksesibilitas otomatis.
- `npm run check:contrast` dijalankan di CI.

## 6. Security
- Hash password (argon2/bcrypt), rate limit login dan reset, proteksi CSRF/CORS yang tepat.
- Validasi dan batas ukuran/tipe upload; scan tipe MIME; URL file bertanda tangan dan berkedaluwarsa.
- Secrets hanya di environment variable; `.env*` tidak di-commit (sudah di `.gitignore`).
- Audit dependency berkala (`npm audit`).

## 7. Deployment
- Frontend: Vercel/Netlify. Backend: container (Docker) di AWS/GCP. DB terkelola. Storage: S3/MinIO.
- CI/CD (GitHub Actions): lint, typecheck, build, test, `check:contrast`.
- Lingkungan: development, staging, production dengan konfigurasi terpisah.

## Urutan yang disarankan
1. Persetujuan struktur repo dan skema DB.
2. Auth + RBAC.
3. Projects/Tasks → Reports → Documents → Dashboard.
4. Sambungkan UI per modul, lalu testing dan hardening.
5. Deployment staging, lalu production.
