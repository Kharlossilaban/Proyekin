# PROYEKIN — Ringkasan Project

Terakhir diperbarui: 2026-10-23 (akhir fase U2, branch `feat/u2-app-shell`)

## Hierarki acuan
1. `docs/deep-research-report.md` — spesifikasi bisnis dan scope MVP (utama; ada "Catatan Keputusan Pemilik" di akhir).
2. `CLAUDE.md` — Brand Color System, aturan UI/UX, keputusan pemilik.
3. `AGENTS.md` — aturan kerja dan standar teknis.
4. Figma (`Proyekin (1)/`) — referensi visual dan fungsional, bukan desain final.

> `deep-research-report.md` di root repo adalah salinan identik dari `docs/deep-research-report.md`. Rujukan resmi: versi `docs/`. Salinan root belum dihapus; menunggu persetujuan pemilik.

## Status saat ini
- Next.js 16.4.2, React 19.3, TypeScript strict, Tailwind v4 (via `@tailwindcss/turbopack`), npm.
- Halaman: landing publik (`/`), app shell + 7 halaman placeholder (Dashboard, Proyek, Tugas, Laporan, Dokumen, Anggota, Pengaturan). **Belum ada** backend, database, API, maupun auth. Semua data masih mock (`src/data/mock.ts`). **Tidak ada fitur yang production-ready.**
- Git: repo diinisialisasi di root `C:\proyekin_project` (branch `main`), baseline commit sebelum U0.

## Keputusan pemilik
| Tanggal | Keputusan |
|---|---|
| 2026-10-23 | Brand: Orange `#E68D1F` + Charcoal `#293036` menggantikan hijau. Hijau hanya semantic. |
| 2026-10-23 | Skala Orange 50–900 dan varian tua untuk teks disetujui. Light mode saja; dark mode ditunda. |
| 2026-10-23 | Font utama Geist. |
| 2026-10-23 | Figma = referensi visual dan fungsional. Business logic, workflow, role, validasi tidak berubah tanpa persetujuan. |
| 2026-10-23 | Lima role resmi saja: Owner, Admin Kantor, Mandor, Anggota Tim, Guest. |
| 2026-10-23 | Hak akses MVP: Owner menetapkan Admin per proyek (1 Admin utama per proyek). |
| 2026-10-23 | Mandor boleh mengatur penugasan anggota dalam tim/proyek-nya; tidak boleh ubah role global/akses lintas proyek. |
| 2026-10-23 | Pengaturan Admin Kantor terbatas pada preferensi operasional; tidak boleh ubah kepemilikan/role global/keamanan. |
| 2026-10-23 | Guest tanpa App Shell — hanya akses halaman publik. |
| 2026-10-23 | `proyekin/AGENTS.md` (auto-generated) di-gitignore. Lockfile root (ECC) dibiarkan. |

## Matriks scope fitur Figma
A = MVP, B = pasca-MVP, C = butuh keputusan pemilik. Hanya A yang boleh dikerjakan sekarang.

| Fitur Figma | Kelas | Catatan |
|---|---|---|
| Dashboard Owner | A | |
| Login, daftar, lupa/reset password, akses ditolak, responsif | A | Reset via email sesuai spesifikasi |
| Penugasan tugas ke mandor/anggota | A | |
| Laporan Harian (mobile Mandor) | A | |
| Dokumen: daftar, upload/download, kategori, state kosong/error | A | |
| Landing publik (fitur) | A | |
| Tentang Kami, Kontak | A (kandidat) | Implementasi mengikuti prioritas MVP |
| Kanban | A (terbatas) | Hanya visualisasi alternatif tugas yang ada; perubahan workflow butuh persetujuan |
| Manajemen Vendor, Vendor Invitation, Contractor Login | B | Dipertahankan di perencanaan jangka panjang |
| WBS | C | Menunggu spesifikasi |
| Multi-company / Company Onboarding / Manajemen perusahaan | C | |
| Document versioning, archive/restore, publication settings | C | |
| Undangan pengguna (Foreman/Office Admin/Vendor) | C | MVP: ikuti mekanisme penambahan pengguna di spesifikasi |
| Verifikasi email | C | Bagian keamanan auth; detail dan scope diajukan dulu |
| Role di luar lima role resmi (Perencana, Keuangan, Project Manager, dst.) | C | Tidak boleh ditambah tanpa persetujuan |
| Model harga (`MOCK_PRICING`), notifikasi | C | Belum disetujui |

### Konsep di luar scope yang sudah ada di kode (tidak dihapus, menunggu evaluasi)
- `MOCK_PRICING` (paket harga) di `src/data/mock.ts`.
- Field `version` dan status `ARKIP` pada tipe `Document`.
- Role "Project Manager" pada `MOCK_TEAM_MEMBERS`.

## Fase U0 (selesai 2026-10-23)
- Dokumentasi disinkronkan (AGENTS.md, CLAUDE.md, spesifikasi, `docs/`).
- Git dan toolchain: dependency terpasang, `clsx` dan `tailwind-merge` ditambahkan, peringatan multi-lockfile diatasi.
- Fondasi design system: token di `src/app/globals.css`, `src/lib/tokens.ts` merujuk token, skrip `npm run check:contrast` (37 pasangan lolos WCAG AA).

## Fase U1 (selesai 2026-10-23, merged ke main)
- Komponen di `src/components/ui`: Button, Input, Label/FieldHint/FieldError, Badge, Card, Table, Dialog (Base UI + class-variance-authority + lucide-react).
- Token kompatibel shadcn di `globals.css` (`muted`, `muted-foreground`, `border`, `input`, `ring`, `card`, `secondary`, `accent`, `destructive`); memakai `@theme static` agar semua token selalu terbit sebagai CSS variable.
- `/style-guide`: hanya development, 404 pada build production (diverifikasi dengan `next start`). Buka lewat `npm run dev` lalu http://localhost:3000/style-guide.
- Skrip pemeriksaan: `check:contrast` (50 pasangan), `check:tokens` (deteksi warna mentah), `check:browser` (axe-core + keyboard + screenshot di 375/768/1280 lewat Chrome/Edge lokal).
- Palet default Tailwind dikunci di U2 (22 namespace di-reset ke `initial`).
- Catatan: pemeriksaan axe otomatis tidak menggantikan uji manual dengan pembaca layar.

## Fase U2 (selesai 2026-10-23, branch `feat/u2-app-shell`)
- **App Shell:** Sidebar (desktop fixed, mobile drawer), Header (sticky, hamburger), responsif.
- **Routing:** `src/app/page.tsx` = landing publik di `/`; `src/app/(app)/` = route group dengan layout shell.
- **Halaman placeholder (mock data):** Dashboard, Proyek, Tugas, Laporan, Dokumen, Anggota, Pengaturan.
- **Navigasi per role:** `src/lib/navigation.ts` — config deklaratif, `getNavForRole()` filter. Guest tanpa shell.
- **Komponen baru:** AppShell, Sidebar, AppHeader, Logo, Skeleton, EmptyState, ErrorState.
- **CardTitle polimorfik:** menerima prop `as` untuk heading hierarchy (h2/h3/h4).
- **Palet default Tailwind dikunci:** 22 namespace di-reset ke `initial` di `globals.css`.
- **Logo:** `public/logo-proyekin.jpeg` (sementara; SVG/PNG transparan masuk backlog).
- **Skip link:** di root layout, target `#main-content`.
- **Error boundary:** `src/app/(app)/error.tsx` dengan `ErrorState` + tombol retry.
- **Aksesibilitas:** 0 pelanggaran axe di 9 route × 3 viewport (27 tes). Keyboard, focus trap, dialog, reduced motion — semua lulus.
- **Browser check diperluas:** `scripts/browser-check.mjs` sekarang menguji semua `APP_ROUTES` + sidebar drawer.
- Commit: `83bc537`, `abff984` (a11y fix), `86f23eb` (palette lock).
- Screenshot: `docs/u2-evidence/` (29 file, 3 viewport × 9 route + sidebar + landing).

## Roadmap UI/UX (disetujui sebagai dasar awal)
| Fase | Isi |
|---|---|
| U0 | Dokumentasi, Git, toolchain, fondasi design system — **selesai** |
| U1 | Design system: komponen dasar (Button, Input, Card, Badge, Table, Dialog) — **selesai, merged** |
| U2 | App shell: sidebar, header, navigasi per role, responsif — **selesai** |
| U3 | Halaman auth (UI, mock) |
| U4 | Dashboard, Proyek, Tugas, Anggota |
| U5 | Laporan Harian, Dokumen |
| U6 | Gantt, landing publik |
| U7 | Polesan: state kosong/error/loading, aksesibilitas, uji responsif |

Roadmap UI/UX bukan roadmap aplikasi. Rencana backend, database, auth, integrasi API, testing, security, dan deployment ada di `docs/BACKEND-ROADMAP.md`.

## Technical backlog
Dicatat, tidak diperbaiki diam-diam. Perbaikan yang menyentuh business logic atau keputusan scope butuh persetujuan pemilik.
- **Warning lint (1):** `src/data/mock.ts:1:66` — `'Role' is defined but never used` (`@typescript-eslint/no-unused-vars`). Belum diperbaiki karena berada di file mock data; aman dihapus bersama pembersihan mock berikutnya.
- Item di "Masalah terbuka" di bawah.
- Logo: gunakan logo resmi PROYEKIN (`logo proyekin.jpeg`) sebagai acuan; jangan membuat identitas logo baru tanpa persetujuan.
- Salinan root `deep-research-report.md`: dipertahankan sementara. Satu-satunya rujukan path ke spesifikasi (`AGENTS.md`) sudah menunjuk `docs/`; penghapusan menunggu persetujuan.

## Masalah terbuka
Daftar singkat:
- `getStatusLabel()` di `utils.ts` selalu memakai label proyek (bug), parameter `lang` tidak dipakai.
- `mock.ts`: karakter Mandarin "已完成" di FAQ, typo "angut"/"ARKIP", import `Role` tidak terpakai.
- `DocumentCategory` memuat `"SURAT menyurat"` (tidak konsisten); `StatCard` memakai `React.ReactNode` tanpa import; `MOCK_TESTIMONIALS` tanpa tipe.
- Logo hanya JPEG; perlu SVG/PNG transparan.
- Konflik warna Figma (hijau/oranye bervariasi antar layar) tidak lagi relevan: brand mengikuti `CLAUDE.md`.
