# PROYEKIN — Ringkasan Project

Terakhir diperbarui: 2026-10-25 (U3 merged ke `main`; U4 berjalan bertahap di `feat/u4-core-ui`: U4-0 dan U4-1 selesai, menunggu audit dan persetujuan U4-2)

## Hierarki acuan
1. `docs/deep-research-report.md` — spesifikasi bisnis dan scope MVP (utama; ada "Catatan Keputusan Pemilik" di akhir).
2. `CLAUDE.md` — Brand Color System, aturan UI/UX, keputusan pemilik.
3. `AGENTS.md` — aturan kerja dan standar teknis.
4. Figma (`Proyekin (1)/`) — referensi visual dan fungsional, bukan desain final.

> **Sumber kanonis spesifikasi: `docs/deep-research-report.md`** (keputusan pemilik 2026-10-24). `deep-research-report.md` di root adalah salinan cermin yang dipertahankan dan disinkronkan dari versi `docs/` (terakhir 2026-10-24; isinya identik kecuali baris penanda di paling atas). Edit hanya versi `docs/`, lalu salin ke root. Bila keduanya berbeda, versi `docs/` yang berlaku.

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
| 2026-10-24 | **U3-1:** Registrasi publik hanya untuk Owner. Role lain ditambahkan via mekanisme internal. Guest tidak perlu akun. |
| 2026-10-24 | **U3-2:** Verifikasi email tidak diimplementasikan di U3. Struktur disiapkan agar bisa ditambahkan nanti. |
| 2026-10-24 | **U3-3:** Company onboarding tidak termasuk U3. Registrasi hanya simulasi pembuatan akun. |
| 2026-10-24 | **U3-4:** Workspace selector dan multi-company tidak termasuk MVP. Satu workspace, login langsung ke dashboard. |
| 2026-10-24 | **U3-5:** Logo JPEG yang sudah memuat tulisan "Proyekin" tidak boleh diberi teks tambahan. Perbaiki komponen Logo. |
| 2026-10-24 | **U3-6:** Invitation flow tidak termasuk U3. Penambahan anggota melalui halaman Anggota sesuai spesifikasi. |
| 2026-10-24 | **ATURAN MUTLAK:** PROYEKIN tidak memiliki role Tukang. Jangan menambahkan atau menyamakan dengan Anggota Tim. Lima role resmi saja. |

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

## Fase U2 (selesai 2026-10-24, merged ke main)
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

## Fase U3 (selesai 2026-10-24, audit PASS WITH NOTES, merged fast-forward lokal ke main)
**Semua flow auth adalah SIMULASI UI.** Tidak ada backend, database, token, atau authorization sungguhan.
- **Route:** `/masuk`, `/daftar` (hanya Owner, tanpa pilihan role), `/lupa-sandi`, `/reset-sandi?token=...`, `/akses-ditolak`. Route group `(auth)/` memakai layout split-screen sendiri; `/akses-ditolak` di luar group (layout penuh).
- **Mock auth:** `src/lib/auth-mock.ts` (satu-satunya titik yang diganti saat backend siap; fungsi async). Sesi di `sessionStorage` hanya berisi `{userId, loginAt}`; kata sandi tidak dibaca/disimpan. Login menerima email akun demo (`MOCK_USERS`) dengan kata sandi apa saja.
- **Akses developer:** `(app)` tidak dikunci. Tanpa sesi, aplikasi tetap terbuka sebagai Owner demo dengan notice "Mode pengembangan". Ini bukan kontrol keamanan; menu per role tetap hanya representasi UI.
- **Guest:** tidak ada akun/akun demo Guest. Bila sesi ber-role GUEST muncul, `SessionShell` tidak merender App Shell maupun isi halaman (hanya pesan "Mengalihkan…") lalu mengalihkan ke `/akses-ditolak`. Teruji di `check:browser` (bagian "jalur Guest"): pengguna Guest disisipkan sementara ke `mock.ts` lalu dipulihkan otomatis. Keterbatasan: HTML hasil prerender sama untuk semua pengunjung (sesi hanya dikenal di klien), jadi pencegahan tampilan sebelum hidrasi baru bisa dijamin oleh pemeriksaan sesi di server (backend).
- **Logo:** gambar JPEG ditampilkan utuh (rasio 1540x672) tanpa teks tambahan; ganti aset lewat konstanta `LOGO_ASSET` di `components/layout/logo.tsx`.
- **Validasi:** `src/lib/auth-validation.ts` (email, nama, sandi >= 8 + huruf besar/kecil + angka, konfirmasi). Galat di-link dengan `aria-describedby`, fokus ke galat pertama.
- **Komponen baru:** PasswordInput, FormField, PasswordStrength, AuthCard, StatusMessage, SessionShell, BackButton; `buttonVariants` dipisah ke `button-variants.ts` agar bisa dipakai server component.
- **Di luar U3 (sesuai keputusan):** verifikasi email, company onboarding, workspace selector/multi-company, invitation flow, Vendor, role Tukang (tidak ada).
- **Pengujian (setelah perbaikan audit):** lint (0 error, 1 warning lama), typecheck, build, check:contrast 50/50, check:tokens 0 warna mentah, check:browser: 53/53 pemeriksaan alur (termasuk 6 pemeriksaan jalur Guest), 0 pelanggaran axe di 18 tampilan auth + 24 tampilan app, 0 overflow di 375/768/1280.
- Bukti: `docs/u3-evidence/` (lihat README di folder tersebut).
- **Audit data demo (2026-10-24):**
  - **Sumber:** seluruh data pengguna dan proyek berasal dari satu berkas `src/data/mock.ts` (`MOCK_USERS`, `MOCK_USER`, `MOCK_TEAM_MEMBERS`, dst.). Tidak ada database, API route, server action, `fetch`, atau environment variable.
  - **Fiktif:** 5 pengguna demo (Budi Santoso, Siti Aminah, Ahmad Rizal, Dewi Lestari, Eko Prasetyo) berdomain `@proyekin.id`; email uji di skrip memakai `contoh.co.id`. Tidak ditemukan nomor telepon, alamat, atau identitas pribadi nyata. Nomor di `MOCK_CONTACT` jelas rekayasa.
  - **Tidak persisten:** login hanya menulis `{userId, loginAt}` ke `sessionStorage` (hilang saat tab ditutup); registrasi/lupa/reset tidak menyimpan apa pun. Tidak ada pengguna baru yang bisa dibuat.
  - **Kredensial:** tidak ada password, token rahasia, atau API key di kode, riwayat Git (diperiksa), maupun berkas teks evidence. `demo-token` hanya literal penanda simulasi. Screenshot hanya memuat data demo di atas dan `tidak.ada@contoh.co.id`.
  - **Catatan (belum diubah, menunggu keputusan):** (1) `proyekin.id` bisa saja domain nyata milik pihak lain; pertimbangkan domain khusus contoh (`example.com`/`.test`) saat data mock dirapikan. (2) `MOCK_CONTACT` (alamat, telepon, tautan sosial `instagram.com/proyekin`, `linkedin.com/company/proyekin`) belum dipakai UI mana pun; tautan sosial bisa menunjuk akun pihak lain dan sebaiknya diganti placeholder sebelum halaman Kontak dibuat. (3) Metadata commit Git memuat email penulis; wajar, tetapi perlu diperhatikan bila repo dipublikasikan.

## Fase U4 (berjalan, branch `feat/u4-core-ui`; hanya langkah yang disetujui eksplisit yang boleh dikerjakan)
Rencana final U4 (U4-0 sampai U4-12, fail-closed, prinsip platform) disetujui pemilik; implementasi dilepas **per langkah**. Semua UI U4 berbasis mock dan tidak boleh disebut production-ready.

**Keputusan pemilik U4 (2026-10-25):**
| Kode | Keputusan |
|---|---|
| J1 | Tim Mandor = Anggota Tim di proyek tempat Mandor ditugaskan. Mandor boleh mengatur penugasan tugas dalam proyeknya, bukan role global. Hak penugasan tugas dibedakan dari hak menambah/mengeluarkan anggota proyek; jangan diperluas diam-diam. |
| J2 | Dashboard analitik hanya Owner/Admin Kantor. Mandor dan Anggota Tim diarahkan ke `/tugas` setelah login. |
| J3 | Owner membuat/menghapus proyek. Admin hanya mengelola proyek yang ditugaskan. |
| J4 | Owner mengelola seluruh pengguna dan role. Admin hanya menambah Mandor/Anggota Tim untuk kebutuhan operasional, tanpa mengubah role global atau mengelola akun Owner/Admin. |
| J5 | Anggota Tim melihat detail proyek tempatnya menjadi anggota (hanya baca) dan memperbarui status tugas miliknya. Tidak mengakses daftar pengguna organisasi. |
| J6 | Field tugas existing dipertahankan minimal; progres (%) hanya ditampilkan; tidak ada hapus tugas di U4; penanggung jawab hanya Mandor/Anggota Tim anggota proyek tersebut. |
| J7 | Kode proyek/tugas otomatis; field opsional diterima; Arsip bukan status yang dapat dipilih. |
| J8 | Relasi seed mock dirapikan tanpa menghapus data lama. |
| J9 | Store mock di memori, reset saat reload, dijelaskan di UI. |
| J10 | Kanban di luar U4. |
| J11 | Tidak ada dependency baru tanpa persetujuan. |
| G10 | Tanggal acuan demo untuk status tenggat: **21 Maret 2026**, wajib diberi label jelas bahwa ini bukan tanggal hari ini. |
| G1–G9 | Belum final; U4 memakai batas fail-closed di rencana (tidak memperluas hak). |
| Platform | Mandor: **mobile-first** (375px). Owner/Admin: desktop-first (1280px), tetap responsif. Anggota Tim: responsif, terutama alur tugas di 375px. Vendor: direncanakan mobile-first tetapi kelas B/post-MVP; **tidak ada** role, login, halaman, atau fitur Vendor di U4. Lima role resmi saja; tidak ada Tukang. |

**U4-0 — spike route dinamis: PASS** (detail dan bukti di `docs/u4-evidence/U4-0-SPIKE.md` dan `docs/u4-evidence/u4-0/`).
- `/proyek/[projectId]` dan `/tugas/[taskId]` berfungsi di bawah `cacheComponents`: ID seed diprerender (`generateStaticParams`), ID yang dibuat saat runtime di memori klien terbuka lewat navigasi klien, ID tidak dikenal menampilkan not-found.
- Keterbatasan: ID runtime tidak bisa dibuka lewat URL langsung/reload (store memori); status HTTP ID tidak dikenal tidak konsisten (200 lalu 404 cache); not-found dirender di klien.
- Guard halaman: guard yang menahan `children` meniadakan konten dari HTML prerender (pola d8cd209). Rekomendasi U4-3: guard yang tetap merender `children` dan menyembunyikannya (`hidden` + `inert`). Bukan kontrol keamanan.
- Artefak spike (halaman `/u4-spike*`, `components/spike/*`, `lib/u4-spike-gate.ts`) bersifat sementara dan dibersihkan di U4-3/U4-4 (store spike sudah digantikan di U4-1). Skrip baru: `npm run check:dynamic-routes`.

**U4-1 — fondasi data dan matriks akses UI: selesai** (detail di `docs/u4-evidence/U4-1-FOUNDATION.md`, bukti di `docs/u4-evidence/u4-1/`). Hanya fondasi; belum ada UI bisnis, CRUD, guard, atau redirect.
- **Tiga lapisan:** L1 pengguna organisasi + role global; L2 keanggotaan proyek (`ProjectMember`, `Project.adminId` untuk satu Admin principal); L3 penugasan dan status tugas. `Project.managerId` lama dipertahankan sebagai legacy.
- **Modul baru:** `lib/mock-store.ts` (+ `use-mock-store.ts`), `lib/roles.ts` (konstanta pilihan role), `lib/labels.ts` (label dan nada Badge terpusat), `lib/demo-date.ts`, `lib/access.ts` (izin UI, fungsi murni, **bukan keamanan**), `components/auth/use-current-user.ts`.
- **Seed:** `MOCK_PROJECT_MEMBERS` (5 baris), `adminId` PRJ-001/002 = Siti, TSK-005 dipindah ke Eko Prasetyo (penanggung jawab harus Mandor/Anggota anggota proyek). `MOCK_TEAM_MEMBERS` tidak disentuh.
- **Tanggal acuan demo (G10):** `DEMO_REFERENCE_DATE = 2026-03-21`; seed menghasilkan 2 tugas terlambat (TSK-002, TSK-003). UI tahap berikutnya wajib menampilkan `DEMO_DATE_NOTICE`.
- **G1–G9:** diterapkan fail-closed di `access.ts`; belum ada hak yang diperluas dan belum ada konflik bisnis baru.
- **Pengujian:** `npm run check:u4-foundation` (182 pemeriksaan: relasi seed, tenggat, store, lima role, matriks izin 7 persona) + seluruh regresi U1–U3 + `check:dynamic-routes` lulus.

## Roadmap UI/UX (disetujui sebagai dasar awal)
| Fase | Isi |
|---|---|
| U0 | Dokumentasi, Git, toolchain, fondasi design system — **selesai** |
| U1 | Design system: komponen dasar (Button, Input, Card, Badge, Table, Dialog) — **selesai, merged** |
| U2 | App shell: sidebar, header, navigasi per role, responsif — **selesai, merged** |
| U3 | Halaman auth (UI, mock) — **selesai, merged** (PASS WITH NOTES; catatan di Technical backlog) |
| U4 | Dashboard, Proyek, Tugas, Anggota — **berjalan bertahap** (U4-0 dan U4-1 selesai; U4-2 dst. menunggu persetujuan) |
| U5 | Laporan Harian, Dokumen |
| U6 | Gantt, landing publik |
| U7 | Polesan: state kosong/error/loading, aksesibilitas, uji responsif |

Roadmap UI/UX bukan roadmap aplikasi. Rencana backend, database, auth, integrasi API, testing, security, dan deployment ada di `docs/BACKEND-ROADMAP.md`.

## Technical backlog
Dicatat, tidak diperbaiki diam-diam. Perbaikan yang menyentuh business logic atau keputusan scope butuh persetujuan pemilik.
- **Warning lint (1):** `src/data/mock.ts:1:66` — `'Role' is defined but never used` (`@typescript-eslint/no-unused-vars`). Belum diperbaiki karena berada di file mock data; aman dihapus bersama pembersihan mock berikutnya.
- Item di "Masalah terbuka" di bawah.
- Logo: gunakan logo resmi PROYEKIN (`logo proyekin.jpeg`) sebagai acuan; jangan membuat identitas logo baru tanpa persetujuan.
- **Temuan non-blocking audit U3 (2026-10-24)** — tidak memblokir merge, belum dikerjakan:
  - **Wajib di fase backend:**
    - **U3-B1 Otorisasi server-side.** Semua pembatasan akses di frontend (menu per role, redirect Guest, `/akses-ditolak`, mode pengembangan) hanya representasi UI dan bisa dilewati lewat DevTools. Backend wajib menegakkan autentikasi dan RBAC lima role di setiap endpoint dan route sebelum data dikirim (lihat `docs/BACKEND-ROADMAP.md` §3).
    - **U3-B2 Keterbatasan prerender.** Route `(app)` di-prerender statis dan sesi demo hanya dikenal di klien, sehingga HTML awal sama untuk semua pengunjung. Sebelum hidrasi, Guest atau pengunjung tanpa sesi masih bisa sekilas melihat kerangka shell dan data demo. Penyelesaiannya: pemeriksaan sesi di server (middleware/proxy atau layout dinamis) yang mengalihkan sebelum HTML dikirim; jangan menahan `children` di klien (pernah membuat Next.js membuang halaman dari prerender, commit `d8cd209`).
    - **U3-B3 Mode pengembangan.** Notice "Mode pengembangan" (akses Owner demo tanpa sesi) juga aktif di build production; wajib dimatikan atau dibatasi ke development saat auth sungguhan masuk.
    - **U3-B4 Ganti `src/lib/auth-mock.ts`** dengan pemanggilan API (tanda tangan async dipertahankan). Validasi di `auth-validation.ts` wajib diulang di backend.
  - **UI/UX dan aksesibilitas:**
    - **U3-U1** Di Next 16 halaman sebelumnya tetap tersimpan tersembunyi di DOM, sehingga `#main-content` bisa dobel setelah navigasi klien; skip link juga tidak memindahkan fokus (`<main>` tanpa `tabIndex`, berasal dari U2).
    - **U3-U2** Pengguna yang sudah login tetap melihat form di `/masuk` (tanpa info "sudah masuk sebagai …").
    - **U3-U3** Tombol "Kembali ke halaman sebelumnya" di `/akses-ditolak` bergantung pada riwayat browser; untuk Guest, "Ke beranda" lebih tepat sebagai aksi utama.
    - **U3-U4** Teks persetujuan Syarat dan Ketentuan serta Kebijakan Privasi tanpa dokumen tujuan; dokumen legal perlu disediakan sebelum registrasi sungguhan.
  - **Brand/logo:**
    - **U3-L1** `logo-proyekin_1.svg` di root (untracked, tidak di-commit) adalah trace monokrom hitam tanpa heksagon oranye dan titik oranye huruf "i"; **tidak boleh dipakai**. Minta file vektor resmi berwarna.
    - **U3-L2** Tulisan pada JPEG logo kecil (~10px di header mobile) karena ruang putih di aset; crop/aset baru butuh persetujuan pemilik.
    - **U3-L3** Komentar di `logo.tsx` menyebut field `ratio` yang tidak ada.
  - **Data mock:** domain `proyekin.id` dan tautan sosial di `MOCK_CONTACT` (lihat "Audit data demo" di Fase U3).
  - **Evidence:** screenshot dari dev server memuat indikator Next.js ("N") di pojok kiri bawah.
- Salinan root `deep-research-report.md`: dipertahankan sebagai cermin tersinkron (lihat Hierarki acuan). Satu-satunya rujukan path ke spesifikasi (`AGENTS.md`) sudah menunjuk `docs/`.

## Masalah terbuka
Daftar singkat:
- ~~`getStatusLabel()` di `utils.ts` selalu memakai label proyek (bug)~~ — **selesai di U4-1**: dihapus (tanpa pemanggil) dan digantikan fungsi per domain di `lib/labels.ts`.
- `mock.ts`: karakter Mandarin "已完成" di FAQ, typo "angut"/"ARKIP", import `Role` tidak terpakai.
- `DocumentCategory` memuat `"SURAT menyurat"` (tidak konsisten); `StatCard` memakai `React.ReactNode` tanpa import; `MOCK_TESTIMONIALS` tanpa tipe.
- Logo hanya JPEG; perlu SVG/PNG transparan.
- Konflik warna Figma (hijau/oranye bervariasi antar layar) tidak lagi relevan: brand mengikuti `CLAUDE.md`.
