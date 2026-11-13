# PROYEKIN — Ringkasan Project

Terakhir diperbarui: 2026-11-13 (U3 merged ke `main`; U4 berjalan bertahap di `feat/u4-core-ui`: **U4-0 sampai U4-5 PASS, U4-6, U4-7, dan Dashboard Access Correction PASS WITH NOTES, U4-8 sampai U4-12 NOT STARTED (U4-8..U4-10 disetujui Owner, dikerjakan berurutan); U5 PLANNING ONLY**; rencana U4-5..U4-12 tertulis di `docs/U4-PLAN.md`, draf U5 di `docs/U5-PLAN.md`; **keputusan final Owner 2026-10-28: Dokumen tetap dengan scope visual sempit (F1), anggaran dihapus total (F2); pembersihan kode anggaran sudah dieksekusi dan terverifikasi, evidence `docs/u4-evidence/budget-cleanup/`**; workflow skill dan evaluasi visual dicatat, lihat "Milestone workflow")

## Hierarki acuan
1. `docs/deep-research-report.md` — spesifikasi bisnis dan scope MVP (utama; ada "Catatan Keputusan Pemilik" di akhir).
2. `CLAUDE.md` — Brand Color System, aturan UI/UX, keputusan pemilik.
3. `AGENTS.md` — aturan kerja dan standar teknis.
4. Figma (`Proyekin (1)/`) — referensi visual dan fungsional, bukan desain final.

> **Sumber kanonis spesifikasi: `docs/deep-research-report.md`** (keputusan pemilik 2026-10-24). `deep-research-report.md` di root adalah salinan cermin yang dipertahankan dan disinkronkan dari versi `docs/` (terakhir 2026-10-28; isinya identik kecuali baris penanda di paling atas). Edit hanya versi `docs/`, lalu salin ke root. Bila keduanya berbeda, versi `docs/` yang berlaku.

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
| 2026-10-28 | **Urutan U4:** U4-5 → U4-12 dipertahankan; U5 diimplementasikan setelah U4 selesai. U5 disimpan sebagai draf (`docs/U5-PLAN.md`), belum disetujui. |
| 2026-10-28 | **FINAL F1 — Dokumen tetap ada, scope sempit.** Menu `/dokumen` dipertahankan; isinya hanya (A) gambar/render 3D proyek/bangunan yang sedang dikerjakan dan (B) foto kegiatan/progres yang dilampirkan Mandor lewat Laporan Harian. Foto laporan satu sumber (lampiran laporan); Dokumen = galeri turunan, tanpa unggah kedua. Di luar scope: kontrak, RAB, surat, berita acara, administrasi umum, blueprint/denah, spesifikasi material, repositori serbaguna, versioning, publikasi, arsip/restore, approval kompleks, viewer 3D interaktif. Menu Dokumen dan foto laporan Mandor tidak boleh dihapus. Tipe media visual baru terpisah dari `Document` legacy; data legacy tidak dihapus sekarang. |
| 2026-10-28 | **FINAL F2 — Anggaran dihapus total dari produk.** Tidak dibutuhkan role mana pun (termasuk Owner/Admin); bukan aturan sembunyi per role. Tanpa nominal di Dashboard, tanpa kolom/kartu/detail di Proyek, tanpa input di form Proyek, tanpa statistik/kalkulasi/validasi/permission anggaran, dan tidak diganti fitur keuangan lain. Kode anggaran sudah dihapus menyeluruh (tipe, seed, statistik mock, util, Dashboard) dan dijaga uji otomatis; rincian `docs/U4-PLAN.md` §6. (Menggantikan status "OPEN" sebelumnya.) |

## Matriks scope fitur Figma
A = MVP, B = pasca-MVP, C = butuh keputusan pemilik. Hanya A yang boleh dikerjakan sekarang.

| Fitur Figma | Kelas | Catatan |
|---|---|---|
| Dashboard Owner | A | |
| Login, daftar, lupa/reset password, akses ditolak, responsif | A | Reset via email sesuai spesifikasi |
| Penugasan tugas ke mandor/anggota | A | |
| Laporan Harian (mobile Mandor) | A | |
| Dokumen (menu `/dokumen`) | A, **dipersempit (F1, final 2026-10-28)** | Hanya galeri visual: render 3D proyek + foto lampiran laporan harian (turunan, satu sumber). Tanpa kategori berkas, unggah dokumen umum, versi, arsip, atau publikasi. Lihat `docs/U5-PLAN.md`; spesifikasi sudah diselaraskan |
| Anggaran/budget proyek (Dashboard, Proyek, form) | **Dihapus dari scope (F2, final 2026-10-28)** | Tidak untuk role mana pun; tidak diganti fitur keuangan lain. **Kode sudah dibersihkan** (hasil di `docs/U4-PLAN.md` §6, evidence `docs/u4-evidence/budget-cleanup/`). `MOCK_PRICING` (harga langganan SaaS) dipertahankan: konteks berbeda, tetap kelas C |
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

**Status faktual (audit 2026-10-28, branch `feat/u4-core-ui` @ `9b1664c`):**
| Langkah | Status |
|---|---|
| U4-0, U4-1, U4-2, U4-3, U4-4, **U4-5** | **PASS** (bukti: bagian di bawah dan `docs/u4-evidence/`; U4-5: `U4-5-PROJECT-DETAIL.md`) |
| U4-6 (buat, ubah, hapus proyek) | **PASS WITH NOTES** (verifikasi final 2026-11-06; `docs/u4-evidence/U4-6-PROJECT-CRUD.md`) |
| U4-7 (kelola anggota proyek, Admin penanggung jawab) | **PASS WITH NOTES** (verifikasi final M7 2026-11-13; `docs/u4-evidence/U4-7-PROJECT-MEMBERS.md`) |
| Dashboard Access Correction | **PASS WITH NOTES** (2026-11-13; `docs/u4-evidence/DASHBOARD-ACCESS-CORRECTION.md`): Dashboard hanya menurunkan data dari proyek dalam lingkup pengguna aktif (Admin hanya proyek principal-nya; Rina tanpa penugasan tidak melihat data; Anggota Tim = orang unik termasuk Admin principal); mock, bukan otorisasi |
| U4-8, U4-9, U4-10, U4-11, U4-12 | **NOT STARTED** (tidak ada commit, evidence, atau skrip uji; `/tugas/[id]` masih placeholder; `/dashboard`, `/tugas`, `/anggota` masih tampilan lama tanpa fitur U4) |
| U5 (Laporan Harian, Dokumen) | **PLANNING ONLY**: draf `docs/U5-PLAN.md` berstatus **DRAFT / NOT APPROVED FOR IMPLEMENTATION**; tidak ada kode U5 |

Commit `709487b`, `e5b197e`, `88b0bb7`, `951b9d7` adalah perbaikan responsif/aksesibilitas pada halaman placeholder dan **bukan** kemajuan U4-5 s.d. U4-12 (tidak mengubah data, `access.ts`, guard, atau business logic).

**Dokumen rencana:**
- `docs/U4-PLAN.md` — rencana U4-5 s.d. U4-12 ditulis ulang karena teks aslinya tidak tersimpan di repository. Butir diberi label **[D]** terdokumentasi, **[R]** rekonstruksi (bukan keputusan baru), **[OPEN]** butuh keputusan Owner. Urutan U4-5 → U4-12 dipertahankan.
- `docs/U5-PLAN.md` — draf U5. Menu Dokumen **tetap ada** dengan dua jenis konten visual (F1); foto laporan satu sumber (lampiran laporan harian) dan Dokumen menampilkannya sebagai galeri turunan. Direkomendasikan tipe `ReportPhoto` dan `ProjectRender`, terpisah dari `Document` legacy; data legacy tidak dihapus dan tidak tampil di UI U5. Memuat dependensi U5 terhadap U4.

**Keputusan final 2026-10-28 (bukan OPEN lagi):**
- **F1 Dokumen** — lihat tabel Keputusan pemilik dan `docs/U5-PLAN.md` §1.
- **F2 Anggaran dihapus total** — U4-O1 ditutup (REMOVE FEATURE ENTIRELY) dan **kodenya sudah dibersihkan** (lihat "Pembersihan anggaran" di bawah). U4-5 detail dan U4-6 form tidak boleh memuat anggaran; U4-12 mempertahankan penjaga di Dashboard.

**Pembersihan anggaran (F2) — dieksekusi 2026-10-28, hasil aktual** (rincian: `docs/U4-PLAN.md` §6; evidence, log, dan screenshot: `docs/u4-evidence/budget-cleanup/`; ringkasan: `BUDGET-CLEANUP.md` di folder itu):
- **Dihapus:** `Project.budget` (tipe, sehingga `NewProjectInput` ikut), `budget` pada 5 proyek seed, `MOCK_STATS.budgetTotal/budgetSpent`, `formatRupiah`, kolom dan sel Anggaran di Dashboard, argumen `budget` di halaman uji `/u4-spike` dan `check:u4-foundation`, komentar usang di `project-list.tsx`. Tidak ada fitur keuangan pengganti; tidak ada perubahan `access.ts` atau permission.
- **Dipertahankan sengaja:** `MOCK_PRICING` (harga langganan SaaS), data legacy `Document`/"RAB Renovasi" (U5), teks mock tugas "sesuai RAB" (menunggu evaluasi), contoh angka "Rp 1.250.000" di `/style-guide` (dev), dan evidence historis.
- **Penjaga baru:** `npm run check:no-budget` (22 pemeriksaan: nol token di `src/`, kunci `Project` persis himpunan diizinkan, tanpa kunci/teks anggaran di semua ekspor `mock.ts`) dan bagian G `check:u4-projects` (HTML dan DOM, Dashboard persis 4 kolom). Uji merah-hijau: 5 mutasi statis tertangkap; Dashboard yang diberi kembali kolom Anggaran menggagalkan 19 pemeriksaan browser.
- **Hasil regresi aktual:** lint 0 error (1 warning lama); typecheck; build; `check:contrast` 57/57; `check:tokens`; `check:no-budget` 22/22; `check:u4-foundation` 213/213; `check:u4-projects` 261/261; `check:u4-components` 62/62; `check:u4-access` 201/201; `check:responsive-lists` 449/449; `check:login-touch` 244/244; `check:browser` 54 flow + axe 0 di 42 titik + 0 overflow; `check:dynamic-routes` 28/28.
- **Temuan visual (375px):** tabel Dashboard 544px dalam kontainer 299px; kolom Status dan Progres tergulir keluar tanpa petunjuk geser (halaman tidak overflow). Kelemahan lama yang bukan akibat pembersihan; dibawa ke U4-12 (kartu responsif di bawah `lg`).

**Keputusan yang masih OPEN (tidak boleh diputuskan implementor):** `docs/U4-PLAN.md` §5 (U4-O2 s.d. U4-O8, termasuk isi G6 yang tidak ditemukan di repository) dan `docs/U5-PLAN.md` §9 (U5-O0 s.d. U5-O9, U5-O11, U5-O12).

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
- Artefak spike: store digantikan di U4-1; di U4-3 guard eksperimen dihapus dan probe dimigrasikan ke `components/detail/`. Sisa sementara: halaman `/u4-spike`, `components/spike/spike-controls.tsx`, `lib/u4-spike-gate.ts` (dihapus di U4-6/U4-10). Skrip baru: `npm run check:dynamic-routes`.

**U4-1 — fondasi data dan matriks akses UI: selesai** (detail di `docs/u4-evidence/U4-1-FOUNDATION.md`, bukti di `docs/u4-evidence/u4-1/`). Hanya fondasi; belum ada UI bisnis, CRUD, guard, atau redirect.
- **Tiga lapisan:** L1 pengguna organisasi + role global; L2 keanggotaan proyek (`ProjectMember`, `Project.adminId` untuk satu Admin principal); L3 penugasan dan status tugas. `Project.managerId` lama dipertahankan sebagai legacy.
- **Modul baru:** `lib/mock-store.ts` (+ `use-mock-store.ts`), `lib/roles.ts` (konstanta pilihan role), `lib/labels.ts` (label dan nada Badge terpusat), `lib/demo-date.ts`, `lib/access.ts` (izin UI, fungsi murni, **bukan keamanan**), `components/auth/use-current-user.ts`.
- **Seed:** `MOCK_PROJECT_MEMBERS` (5 baris), `adminId` PRJ-001/002 = Siti, TSK-005 dipindah ke Eko Prasetyo (penanggung jawab harus Mandor/Anggota anggota proyek). `MOCK_TEAM_MEMBERS` tidak disentuh.
- **Tanggal acuan demo (G10):** `DEMO_REFERENCE_DATE = 2026-03-21`; seed menghasilkan 2 tugas terlambat (TSK-002, TSK-003). UI tahap berikutnya wajib menampilkan `DEMO_DATE_NOTICE`.
- **G1–G9:** diterapkan fail-closed di `access.ts`; belum ada hak yang diperluas dan belum ada konflik bisnis baru.
- **Pengujian:** `npm run check:u4-foundation` (182 pemeriksaan: relasi seed, tenggat, store, lima role, matriks izin 7 persona) + seluruh regresi U1–U3 + `check:dynamic-routes` lulus.

**U4-2 — komponen UI bersama: selesai** (detail, props, dan bukti di `docs/u4-evidence/U4-2-COMPONENTS.md` dan `docs/u4-evidence/u4-2/`). Hanya komponen presentasi + demo di `/style-guide`; belum ada halaman bisnis, guard, redirect, atau perubahan navigasi.
- **Komponen baru:** `Textarea`, `Select` (native), `Tabs` (Base UI), `ProgressBar` (display-only), `ConfirmDialog`, `PageHeader`, `StatCard`, `DemoDataNotice`, `DeadlineBadge`, ditambah pola `RadioCardGroup` dan `TaskCard` (`components/tasks/`). Varian `size="touch"` untuk `Input`, `Select`, `Textarea`, `Button` (tinggi ≥44px, font input 16px); ukuran bawaan tidak berubah.
- **Platform:** Mandor/Anggota Tim mobile-first (375px); Owner/Admin desktop-first (1280px); Vendor tetap di luar U4.
- **Pengujian:** `npm run check:u4-components` (62 pemeriksaan, `mobile:true` + emulasi sentuh: keyboard Tabs/radio/Select/ConfirmDialog, target sentuh ≥44px, font ≥16px, kartu satu kolom, tab bergulir di dalam komponen, overflow 375/768/1280, axe 0 termasuk dialog terbuka); `check:contrast` 57/57; `check:u4-foundation` 183; `check:browser` 53/53 + axe 0 (style-guide 0/0/0); `check:dynamic-routes` 7/7 + 21/21. 40 dari 42 screenshot halaman lama identik dengan evidence U3 (dua `tugas-*` berbeda karena seed TSK-005 di U4-1).
- **Catatan:** popup `<select>` native tidak teruji di headless (cek manual di ponsel nyata sebelum U4-9); kontrol aksi di dalam `TaskCard` ber-`href` harus `relative z-10`; halaman yang memakai `DeadlineBadge` wajib menampilkan `DemoDataNotice showDeadlineReference`.

**U4-3 — navigasi, redirect login per role, dan guard URL: selesai** (detail, matriks teruji, dan bukti di `docs/u4-evidence/U4-3-ACCESS.md` dan `docs/u4-evidence/u4-3/`). Representasi UI di atas mock, **bukan** otorisasi/keamanan; belum ada halaman bisnis baru; `SessionShell` tidak diubah.
- **Aturan satu sumber:** `access.ts` (`canAccessSection`, `getPostLoginPath`) dipakai menu, guard URL, dan redirect login; `navigation.ts` tidak lagi memuat daftar role. Login: Owner/Admin → `/dashboard`, Mandor/Anggota Tim → `/tugas`, Guest → `/akses-ditolak`. Menu: Dashboard dan Anggota hanya Owner/Admin; Tugas menu pertama untuk Mandor (Tugas, Proyek, Laporan, Dokumen) dan Anggota Tim (Tugas, Proyek, Dokumen).
- **Guard:** `PathGuard` (seluruh `(app)`) + `AccessGuard` (pola "menyembunyikan" dari U4-0: `children` selalu dirender, `hidden`+`inert` sampai diizinkan, lalu `/akses-ditolak`); detail proyek/tugas memakai `canViewProject`/`canViewTask` (termasuk ID runtime). URL langsung dan navigasi klien teruji untuk Budi, Siti, Ahmad, Dewi, dan Guest.
- **Keterbatasan:** HTML/RSC halaman tetap memuat data seed untuk semua pengunjung (hanya disembunyikan secara visual); sesi hanya `sessionStorage`; daftar `/proyek` dan `/tugas` belum dibatasi per lingkup (U4-4, U4-8). Penegakan sesungguhnya di backend (U3-B1, U3-B2).
- **Cacat U2 diperbaiki:** `z-sticky`/`z-modal` tak terdefinisi (tabel menimpa drawer mobile) kini `@utility` di `globals.css`; drawer `<aside role="dialog">` → `<div>` (axe `aria-allowed-role`).
- **Ekspektasi pengujian U3 yang berubah (J2):** login Mandor kini ke `/tugas` dan menu Mandor persis Tugas, Proyek, Laporan, Dokumen (alur 53 → 54; asersi lama tetap, tidak dilonggarkan).
- **Cleanup spike:** guard eksperimen dihapus; probe dan not-found dimigrasikan ke `components/detail/`; `/u4-spike` + `spike-controls` + `u4-spike-gate.ts` dipertahankan sementara untuk membuat ID runtime (dihapus di U4-6/U4-10).
- **Pengujian:** `check:u4-access` 171, `check:u4-foundation` 201, `check:u4-components` 62, `check:dynamic-routes` 7/7 + 21/21, `check:browser` 54/54 + axe 0, `check:contrast` 57/57.
- **Temuan terbuka:** tautan drawer mobile 264×36px dan tombol 40px (bawaan U2) di bawah 44px; belum diubah, menunggu keputusan pemilik. (Diselesaikan di follow-up U4-3, commit `20a36e7`: kontrol drawer kini 44px; desktop tidak berubah.)

**U4-4 — halaman daftar proyek `/proyek`: selesai** (detail, matriks teruji, dan bukti di `docs/u4-evidence/U4-4-PROJECTS.md` dan `docs/u4-evidence/u4-4/`). Representasi UI di atas mock, **bukan** otorisasi/keamanan dan **tidak production-ready**. Hanya DAFTAR: tanpa detail final (U4-5), CRUD (U4-6), atau kelola anggota (U4-7); `SessionShell`, redirect, dan guard U4-3 tidak diubah; tanpa dependency/backend baru.
- **Lingkup per role** lewat `getVisibleProjects` (`access.ts`), tanpa aturan role di komponen: Owner semua proyek; Admin Kantor hanya proyek yang ia tangani sebagai Admin principal (G8); Mandor dan Anggota Tim hanya proyek tempat mereka anggota; Guest tanpa App Shell. Proyek Arsip ditandai "Hanya baca". Proyek runtime (di memori) hanya terlihat Owner.
- **Tampilan:** kartu satu kolom di bawah `lg` (mobile-first; seluruh kartu satu target sentuh >= 44px, tanpa aksi hover-only), tabel di `lg` ke atas; informasi: kode, nama, klien, status (label + titik), periode, lokasi, progres; `DemoDataNotice`; state kosong; skeleton sebelum sesi diketahui (HTML prerender tidak memuat daftar proyek). **Anggaran sengaja tidak ditampilkan** (belum ada keputusan siapa boleh melihat; dibawa ke U4-5). (Dilampaui keputusan final F2 2026-10-28: anggaran dihapus total dari produk; asersi "anggaran tidak ditampilkan" dipertahankan sebagai penjaga regresi.) Tidak ada tombol bisnis, filter, atau pencarian.
- **Pengujian:** `check:u4-projects` 205/205 (baru; lingkup per role, runtime, state kosong, navigasi, Mandor 375 `mobile:true` + sentuhan, axe 0, tanpa overflow 375/768/1280), `check:u4-foundation` 213, `check:u4-components` 62, `check:u4-access` 201, `check:dynamic-routes` 28/28, `check:browser` 54/54 + axe 0, `check:contrast` 57/57, `check:tokens`, lint 0 error, typecheck, build. Satu asersi `check:u4-foundation` (daftar pemakai `access.ts`) hanya ditambah satu entri; tidak ada asersi dilonggarkan.
- **Catatan:** satu kegagalan sementara `check:u4-access` (login ketuk Mandor 375) pada regresi pertama tidak terulang dua kali jalan ulang; penyebab belum terbukti, dipantau. *(2026-11-06: race hidrasi di harness `check:u4-access` — isian form sebelum React terhidrasi — dibuktikan sebagai akar kegagalan serupa saat verifikasi U4-6; kemungkinan besar kasus ini juga. Lihat `U4-6-PROJECT-CRUD.md` §5.)* `/u4-spike` masih dipakai pengujian (dihapus di U4-6/U4-10).
- **Housekeeping logo:** `logo-proyekin_1.svg` (tidak dipakai aplikasi) dipindahkan ke `C:\proyekin-assets-backup\` di luar repository; logo aktif tetap `public/logo-proyekin.jpeg`.

**U4-5 — detail proyek `/proyek/[projectId]` (READ-ONLY): selesai, PASS** (detail, matriks per role, hasil uji, evaluasi visual, dan risiko U4-6 di `docs/u4-evidence/U4-5-PROJECT-DETAIL.md`, bukti di `docs/u4-evidence/u4-5/`). Representasi UI di atas mock, **bukan** otorisasi/keamanan dan **tidak production-ready**. Tanpa CRUD proyek (U4-6), tanpa kelola anggota (U4-7), tanpa daftar/detail/ubah tugas (U4-8 s.d. U4-10), tanpa Dokumen (U5), tanpa anggaran (F2), tanpa dependency/role baru.
- **Isi:** header (tautan kembali, kode, nama, klien, status, penanda "Hanya baca" untuk Arsip); tab **Ringkasan** (informasi proyek, Admin penanggung jawab, progres, ringkasan tugas dalam lingkup), **Tugas (n)** (kartu di bawah `lg`, tabel di `lg` ke atas; nama penanggung jawab dari relasi `User`; tenggat terhadap 21 Maret 2026 dengan `DemoDataNotice`), **Tim** (Owner/Admin/Mandor; email hanya Owner/Admin). State loading, kosong, not-found, dan denied jelas.
- **Akses** (satu sumber `access.ts`; fungsi baru `canViewProjectTeam`, `getVisibleProjectTasks`, `seesOnlyOwnTasks`): Owner semua proyek; Admin hanya proyek yang ia tangani (G8); Mandor dan Anggota Tim hanya proyek tempat mereka anggota; Anggota Tim hanya melihat tugas miliknya dan tidak memiliki tab Tim; Guest tanpa App Shell; Arsip dapat dibaca bila dalam lingkup tanpa aksi mutasi. URL langsung dan navigasi klien diuji untuk semua persona.
- **Pengujian aktual:** `check:u4-project-detail` (baru) **642/642**; `check:u4-foundation` **281/281** (213 + 68, satu entri ditambahkan pada daftar pemakai `access.ts`, tanpa asersi dilonggarkan); `check:no-budget` 22/22; `check:u4-projects` 261/261; `check:u4-components` 62/62; `check:u4-access` 201/201; `check:responsive-lists` 449/449; `check:login-touch` 244/244; `check:browser` 54 flow, axe 0 di 42 titik, 0 overflow; `check:dynamic-routes` 28/28; `check:contrast` 57/57; `check:tokens`; lint 0 error (1 warning lama); typecheck; build. Uji merah-hijau: 4 mutasi akses/read-only tertangkap dan satu mutasi izin di browser menggagalkan 21 dari 642 pemeriksaan.
- **Cacat lama yang ditemukan dan diperbaiki:** not-found tanpa `h1` (axe), dengan prop `titleAs` pada `EmptyState` (default `h3`).
- **Temuan visual:** setelah perbaikan, tabel 1280 muat penuh dan isi tab terlihat di layar pertama 375px. Kelemahan tersisa: Ringkasan 375px panjang dan mengulang Kode/Status dari header; pilihan tab tidak tersimpan di URL.
- **Backlog U4-12 (dicatat, tidak diubah):** Dashboard Admin belum dilingkup per role (G8); tabel Dashboard 375px tergulir tanpa petunjuk.
- **Risiko U4-6:** lihat bagian 8 evidence U4-5 (aksi ubah/hapus pada detail, migrasi uji dari `/u4-spike`, hapus proyek berisi tugas/anggota U4-O2, penempatan Admin principal U4-O3).

**U4-6 — buat, ubah, hapus proyek: selesai, PASS WITH NOTES** (verifikasi final 2026-11-06; detail, matriks per role, hasil uji, evaluasi visual, risiko, dan temuan review di `docs/u4-evidence/U4-6-PROJECT-CRUD.md`, bukti di `docs/u4-evidence/u4-6/`). Representasi UI di atas mock, **bukan** otorisasi/keamanan dan **tidak production-ready**. Tanpa kelola anggota/penetapan Admin principal (U4-7), tanpa tugas (U4-8..U4-10), tanpa anggaran (F2), tanpa dependency/role baru.
- **Isi:** Owner menambah proyek (kode otomatis `PRJ-00n`, status bawaan Draf, Arsip tidak dapat dipilih) dan menghapus proyek; Owner atau Admin principal mengubah proyek; Mandor/Anggota Tim tanpa aksi; Arsip tanpa aksi. Pesan sukses dan keadaan setelah hapus menyebut "(simulasi)"; `DemoDataNotice` di setiap dialog.
- **Aturan hapus (keputusan pemilik U4-6):** proyek yang masih memiliki Task, ProjectMember, atau Admin principal **tidak dapat dihapus**, tanpa kaskade; dialog menyebut setiap penghalang. Satu sumber: `access.ts` (`getProjectDeleteBlockers`, `decideDeleteProject`, `isProjectReadOnly`).
- **Pengujian aktual (2026-11-06, output + exit code):** `check:u4-project-crud` (baru) 129/129; `check:u4-foundation` 328/328 (281 + 47); `check:u4-project-detail` 642/642; `check:u4-projects` 261/261; `check:u4-components` 62/62; `check:u4-access` 201/201 (run ke-3; dua run awal gagal karena race hidrasi di harness, akar dibuktikan); `check:responsive-lists` 449/449; `check:dynamic-routes` lolos; `check:browser` lolos (`failures: []`); `check:no-budget` 22/22; `check:contrast` 57/57; `check:tokens`; lint 0 error (1 warning lama); typecheck; build. `check:login-touch`: 244/244 di worktree isi commit; **4/244 gagal di tree utama** karena `logo.tsx` Owner yang belum di-commit (tautan logo desktop 92x40 vs bawaan 91x40) — tidak di-rebaseline tanpa keputusan Owner.
- **Temuan visual:** 18 tangkapan 375/768/1280 dilihat. Kuat: hierarki dialog, fokus awal terlihat (Batal sebagai default hapus), penolakan hapus menyebut penghalang, target sentuh ≥ 44px. Lemah: keadaan "dihapus" 1280 terasa kosong; footer dialog tambah terpotong setelah galat di 1280×900 dan tidak sticky di 375; tombol destruktif di posisi atas pada 375.
- **Risiko terbuka:** peringatan dev Next.js `/proyek/[projectId]` (`params` di luar `<Suspense>`) sudah ada sejak U4-5; 9 temuan `code-review` medium yang belum diperbaiki (copy petunjuk status ambigu, banner `?dibuat=1` muncul lagi saat Back, alasan gagal hapus generik pada jalur race, kebersihan kode); `/u4-spike` masih dipakai uji (U4-10).

**U4-7 — kelola anggota proyek dan Admin penanggung jawab: selesai, PASS WITH NOTES** (verifikasi final M7 2026-11-13; detail, aturan, matriks, hasil uji, evaluasi visual, dan keterbatasan di `docs/u4-evidence/U4-7-PROJECT-MEMBERS.md`, bukti di `docs/u4-evidence/u4-7/`). Representasi UI di atas mock, **bukan** otorisasi/keamanan dan **tidak production-ready**; tanpa backend, database, atau otorisasi server. Tanpa role baru, tanpa Tukang, tanpa anggaran (F2), tanpa dependency baru.
- **Isi:** tab Tim di detail proyek. Owner: tambah anggota, keluarkan anggota, tetapkan/ganti/cabut Admin penanggung jawab. Admin principal: tambah anggota saja. Mandor: read-only tanpa email. Anggota Tim: tanpa tab Tim. Arsip tanpa aksi; Selesai tetap dapat diubah. Semua pesan sukses menyebut "(simulasi)".
- **Aturan (satu sumber `access.ts`):** anggota hanya Mandor/Anggota Tim; Admin principal hanya Admin Kantor, satu per proyek (§7A); keluarkan Owner saja (G9) dan diblokir selama anggota tercatat di tugas apa pun termasuk Selesai (G3); cabut Admin Owner saja (keputusan pemilik U4-O10); tanpa kaskade. Setiap aksi diputuskan ulang saat menyimpan terhadap data terbaru (keadaan stale ditolak dengan pesan spesifik).
- **Seed:** Admin Kantor kedua **Rina Wulandari** (`u-006`, keputusan pemilik U4-O9), tidak menjadi Admin principal atau anggota proyek mana pun.
- **Komponen bersama:** `RecordCard` slot `actions` opsional dan `ConfirmDialog` `errorMessage` opsional + penjaga klik ganda; tanpa prop, perilaku lama tetap.
- **Pengujian aktual (2026-11-13, output + exit code, kode final `5670102`):** `check:u4-project-members` (baru) 114/114 termasuk verifikasi production (hook uji tidak ada di 387 berkas build dan tidak tersedia pada `next start`); `check:u4-access` 201/201 pada 3 run berturut-turut setelah perbaikan race hidrasi harness (`5670102`; diagnostik CPU 6×: pola lama 1/4, pola baru 4/4); `check:u4-projects` 261/261; `check:u4-project-detail` 642/642; `check:u4-project-crud` 129/129; `check:responsive-lists` 467/467; `check:u4-components` 72/72; `check:u4-foundation` 412/412; `check:dynamic-routes` dan `check:browser` lolos; `check:no-budget` 22/22; `check:contrast` 57/57; `check:tokens`; lint 0 error (1 warning lama); typecheck; build. `check:login-touch`: **4/244 gagal di tree utama** (logo 92x40 vs 91x40, `logo.tsx` Owner belum di-commit), 244/244 di worktree isi commit.
- **Risiko terbuka:** Dashboard belum mengikuti lingkup proyek (Dashboard Access Correction berikutnya); login UI kedua tanpa muat ulang tertahan di `/masuk` pada `next dev` (temuan terpisah); dialog Tetapkan/Ganti setelah Admin berubah tetap menampilkan pilihan lama (aman, simpan ditolak); `/u4-spike` masih dipakai uji (U4-10).

## Milestone workflow: skill dan evaluasi visual (2026-10-26)
Perubahan **cara kerja**, bukan perubahan aplikasi: tidak ada source code, komponen, mock data, atau business logic yang diubah. Aturan lengkap, tabel skill, contoh pemanggilan, dan checklist fallback ada di `CLAUDE.md` §8; ringkasan di `AGENTS.md` bagian Skill Strategy (commit `4f95dbe`).

**Latar belakang (audit transkrip, 2026-10-26):** dari seluruh transkrip yang masih tersimpan (U0 sampai U4-4), **tidak ditemukan bukti satu pun skill dipanggil**, baik lewat tool `Skill`, slash command, maupun pembacaan `SKILL.md`. Karena itu **tidak ada klaim bahwa skill digunakan pada fase U0–U4**; pekerjaan fase tersebut dilakukan dengan tool dasar. Riwayat yang tidak tersedia (mis. sesi Opus terpisah, bila ada) tidak dapat diverifikasi. `AGENTS.md` sebelumnya mewajibkan "UI UX Pro Max" dan "premium-fullstack"; keduanya tidak terpasang, rujukan wajibnya dihapus.

**Aturan workflow yang berlaku mulai sekarang:**
1. Skill yang relevan wajib **benar-benar dipanggil** lewat mekanisme yang tersedia (Claude Code: tool `Skill`, atau pemilik mengetik `/<nama-skill>`). Menyebut nama skill di prompt, atau skill sekadar tersedia, bukan pemakaian.
2. Pekerjaan design system (token dan komponen bersama): `design:design-system`.
3. Audit aksesibilitas yang relevan: `design:accessibility-review`.
4. Microcopy Bahasa Indonesia (label, pesan, state kosong, konfirmasi): `design:ux-copy`.
5. `verification-before-completion` sebelum mengklaim pekerjaan selesai, lulus, atau siap commit.
6. `code-review` pada perubahan penting bila relevan (tanpa `--fix`/`--comment` kecuali disetujui pemilik).
7. Bila skill tidak dapat dipanggil: laporkan alasannya dan jalankan **checklist manual** di `CLAUDE.md` §8C sebagai fallback. Skill atau plugin baru tidak dipasang tanpa persetujuan pemilik.
8. **Evaluasi visual aktual** pada viewport **375, 768, dan 1280px** wajib untuk pekerjaan UI yang relevan: screenshot benar-benar dilihat dan dinilai (hierarchy, spacing, typography, komposisi, konsistensi antarhalaman, usability mobile), kelemahan dilaporkan apa adanya. **Build, lint, dan axe yang lolos tidak otomatis membuktikan kualitas visual baik.**
9. Penggunaan skill tidak boleh diklaim tanpa bukti pemanggilan; laporan akhir menyebut skill yang benar-benar dipanggil.

**Status verifikasi (2026-10-26):** `design:design-system`, `design:accessibility-review`, `design:ux-copy` (plugin `design` tersinkron), `verification-before-completion` (`.claude/skills/`), dan `code-review` (bawaan) terverifikasi tersedia. Satu-satunya pemanggilan terbukti sejauh ini: `verification-before-completion`, dipanggil sebelum commit dokumentasi `4f95dbe`. Skill lain belum pernah dipanggil di proyek ini.

## Roadmap UI/UX (disetujui sebagai dasar awal)
| Fase | Isi |
|---|---|
| U0 | Dokumentasi, Git, toolchain, fondasi design system — **selesai** |
| U1 | Design system: komponen dasar (Button, Input, Card, Badge, Table, Dialog) — **selesai, merged** |
| U2 | App shell: sidebar, header, navigasi per role, responsif — **selesai, merged** |
| U3 | Halaman auth (UI, mock) — **selesai, merged** (PASS WITH NOTES; catatan di Technical backlog) |
| U4 | Dashboard, Proyek, Tugas, Anggota — **berjalan bertahap** (U4-0 s.d. U4-5 **PASS**; U4-6, U4-7, dan Dashboard Access Correction **PASS WITH NOTES**; U4-8 s.d. U4-12 **NOT STARTED**, menunggu persetujuan per langkah; rencana di `docs/U4-PLAN.md`). **Tanpa anggaran (F2):** kode anggaran sudah dihapus (2026-10-28, terverifikasi); U4-6 form tidak boleh memuatnya, U4-12 mempertahankan penjaga Dashboard |
| U5 | Laporan Harian, Dokumen — **PLANNING ONLY** (draf `docs/U5-PLAN.md`: DRAFT / NOT APPROVED FOR IMPLEMENTATION; dikerjakan setelah U4 selesai). **Menu Dokumen tetap (F1):** hanya render 3D proyek + foto lampiran laporan harian Mandor (galeri turunan, satu sumber); Mandor mobile-first 375px |
| U6 | Gantt, landing publik |
| U7 | Polesan: state kosong/error/loading, aksesibilitas, uji responsif |

Roadmap UI/UX bukan roadmap aplikasi. Rencana backend, database, auth, integrasi API, testing, security, dan deployment ada di `docs/BACKEND-ROADMAP.md`.

## Technical backlog
Dicatat, tidak diperbaiki diam-diam. Perbaikan yang menyentuh business logic atau keputusan scope butuh persetujuan pemilik.
- **Warning lint (1):** `src/data/mock.ts:1:66` — `'Role' is defined but never used` (`@typescript-eslint/no-unused-vars`). Belum diperbaiki karena berada di file mock data; aman dihapus bersama pembersihan mock berikutnya.
- Item di "Masalah terbuka" di bawah.
- **Pembersihan anggaran (F2, 2026-10-28): SELESAI.** Rincian `docs/U4-PLAN.md` §6 dan evidence `docs/u4-evidence/budget-cleanup/`. Sisa yang menunggu keputusan Owner: teks mock tugas "sesuai RAB" dan contoh "Rp 1.250.000" di `/style-guide` (dipertahankan sementara).
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
    - **U3-L1** `logo-proyekin_1.svg` (semula di root, untracked; sejak 2026-10-26 dipindahkan ke `C:\proyekin-assets-backup\` di luar repository) adalah trace monokrom hitam tanpa heksagon oranye dan titik oranye huruf "i"; **tidak boleh dipakai**. Minta file vektor resmi berwarna.
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
