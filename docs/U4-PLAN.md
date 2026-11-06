# PROYEKIN — Rencana U4-5 sampai U4-12 (tertulis ulang)

Dibuat: 2026-10-28 · Branch: `feat/u4-core-ui` · Status dokumen: **REFERENSI IMPLEMENTASI; tidak ada langkah di sini yang sudah dimulai.**
Revisi: 2026-10-28 — dua keputusan FINAL Owner dicatat (§2 "Keputusan final Owner 2026-10-28"): **F1** Dokumen tetap ada dengan scope visual sempit; **F2** anggaran dihapus total dari produk. U4-O1 ditutup. Audit dampak anggaran di §6.
Revisi 2 (2026-10-28): Owner memerintahkan pembersihan menyeluruh **sekarang**, bukan bertahap. Pembersihan **sudah dieksekusi** dan terverifikasi; §6 kini mencatat hasil (bukan lagi rencana T1–T4). Evidence: `docs/u4-evidence/budget-cleanup/`.

## 0. Cara membaca dokumen ini

Teks asli rencana final U4 yang "disetujui pemilik" (`docs/PROJECT-SUMMARY.md`, bagian Fase U4) **tidak tersimpan di repository**. Dokumen ini menuliskannya ulang dari tiga sumber: keputusan pemilik J1–J11/G10 di `PROJECT-SUMMARY.md`, catatan "untuk langkah berikutnya" di `docs/u4-evidence/*.md`, dan kode yang sudah ada (`src/lib/access.ts`, `src/lib/mock-store.ts`, komentar in-code). Karena itu setiap butir diberi label:

| Label | Arti |
|---|---|
| **[D]** | **Terdokumentasi.** Ada di sumber tertulis; rujukannya disebut. |
| **[R]** | **Rekonstruksi.** Disimpulkan dari rujukan terserak atau dari kode. **Bukan keputusan baru** dan belum dikonfirmasi pemilik; Owner boleh mengoreksinya sebelum langkah dikerjakan. |
| **[OPEN]** | **Butuh keputusan Owner.** Tidak boleh diputuskan oleh implementor. |

Rencana ini tidak mengubah business logic, role, API contract, atau scope MVP. Bila bertentangan dengan `docs/deep-research-report.md`, `CLAUDE.md` §2, atau keputusan pemilik, yang terakhir menang dan konflik dilaporkan, bukan diselesaikan sendiri.

## 1. Baseline status (hasil audit 2026-10-28, diterima apa adanya)

| Langkah | Status | Bukti |
|---|---|---|
| U4-0 spike route dinamis | **PASS** | `2d8f705`, `docs/u4-evidence/U4-0-SPIKE.md` |
| U4-1 fondasi data + matriks akses | **PASS** | `7bd05f0`, `U4-1-FOUNDATION.md` |
| U4-2 komponen UI bersama | **PASS** | `555648d`, `U4-2-COMPONENTS.md` |
| U4-3 navigasi, redirect login, guard URL | **PASS** | `06fc2df`, `20a36e7`, `U4-3-ACCESS.md`, `U4-3-FOLLOWUP.md` |
| U4-4 daftar proyek `/proyek` | **PASS** | `9a29fc6`, `U4-4-PROJECTS.md` |
| U4-5 detail proyek `/proyek/[projectId]` (read-only) | **PASS** (2026-10-28) | commit U4-5, `U4-5-PROJECT-DETAIL.md` |
| U4-6 buat, ubah, hapus proyek | **PASS WITH NOTES** (verifikasi final 2026-11-06) | commit U4-6, `U4-6-PROJECT-CRUD.md` (catatan: §5 dan §9 evidence) |
| U4-7 s.d. U4-12 | **NOT STARTED** | tidak ada commit, evidence, atau skrip uji |

Commit `88b0bb7`, `951b9d7`, `709487b`, `e5b197e` adalah perbaikan responsif/aksesibilitas pada halaman placeholder. Bukan kemajuan U4-5 s.d. U4-12.

## 2. Aturan yang berlaku untuk semua langkah

**Urutan:** U4-5 → U4-6 → U4-7 → U4-8 → U4-9 → U4-10 → U4-11 → U4-12 **[D: keputusan pemilik 2026-10-28]**. U5 baru dikerjakan setelah U4 selesai. Implementasi dilepas **per langkah** dan hanya setelah persetujuan eksplisit **[D: PROJECT-SUMMARY, Fase U4]**.

**Keputusan pemilik yang membatasi semua langkah [D: PROJECT-SUMMARY, "Keputusan pemilik U4 (2026-10-25)"]:**

| Kode | Isi ringkas |
|---|---|
| J1 | Tim Mandor = Anggota Tim di proyek tempat Mandor ditugaskan. Hak **penugasan tugas** ≠ hak **menambah/mengeluarkan anggota proyek**; jangan diperluas diam-diam. |
| J2 | Dashboard analitik hanya Owner/Admin. Mandor/Anggota Tim ke `/tugas` setelah login. |
| J3 | Owner membuat/menghapus proyek. Admin hanya mengelola proyek yang ditugaskan. |
| J4 | Owner mengelola semua pengguna dan role. Admin hanya menambah Mandor/Anggota Tim. |
| J5 | Anggota Tim: detail proyek (hanya baca) dan ubah status tugas miliknya; tanpa daftar pengguna organisasi. |
| J6 | Field tugas minimal; progres (%) hanya ditampilkan; **tidak ada hapus tugas**; penanggung jawab hanya Mandor/Anggota Tim anggota proyek. |
| J7 | Kode otomatis; field opsional diterima; Arsip bukan status yang dapat dipilih. |
| J8 | Relasi seed dirapikan tanpa menghapus data lama. |
| J9 | Store mock di memori, reset saat reload, dijelaskan di UI. |
| J10 | Kanban di luar U4. |
| J11 | Tidak ada dependency baru tanpa persetujuan. |
| G10 | Tanggal acuan demo 21 Maret 2026, wajib berlabel (`DemoDataNotice showDeadlineReference`). |
| G1–G9 | **Belum final**; dipakai batas fail-closed di `access.ts`. Tidak boleh memperluas hak. |

**Keputusan final Owner 2026-10-28 [D: instruksi Owner 2026-10-28]** — menggantikan rekomendasi dan OPEN sebelumnya bila bertentangan:

| Kode | Keputusan FINAL |
|---|---|
| **F1** | **Menu `/dokumen` tetap dipertahankan**, isinya hanya (A) gambar/render 3D proyek/bangunan yang sedang dikerjakan dan (B) foto kegiatan/progres yang dilampirkan Mandor melalui Laporan Harian. Foto laporan punya **satu sumber data**: lampiran laporan harian; Dokumen menampilkannya sebagai galeri turunan, **tanpa unggah kedua**. Di luar scope: kontrak, RAB, surat, berita acara, administrasi umum, blueprint/denah, spesifikasi material, repositori berkas serbaguna, versioning, publikasi, arsip/restore, approval dokumen kompleks, viewer model 3D interaktif. Dikerjakan di U5 (`docs/U5-PLAN.md`), bukan U4. |
| **F2** | **Anggaran/budget dihapus total dari scope produk** — tidak dibutuhkan role mana pun, termasuk Owner dan Admin Kantor. **Bukan** aturan menyembunyikan per role. Tidak ada nominal di Dashboard; tidak ada kolom/kartu/detail anggaran di Proyek; tidak ada input anggaran di form tambah/ubah Proyek; tidak ada statistik, kalkulasi, validasi bisnis, atau permission anggaran; tidak ada data anggaran di UI role mana pun; **tidak diganti** dengan fitur keuangan lain. |

**Aturan turunan F2 untuk semua langkah:** tidak ada langkah U4 (atau U5 dan seterusnya) yang boleh memperkenalkan kembali tampilan, field, statistik, fungsi izin, atau label anggaran/keuangan. `Project.budget`, nilai seed, dan statistik anggaran **sudah dihapus seluruhnya** dari kode (§6); tidak ada properti legacy yang dipertahankan. Penjaga otomatis (`npm run check:no-budget` dan bagian G `check:u4-projects`) menggagalkan pengujian bila anggaran muncul kembali di sumber, model data, HTML, atau DOM.

**Catatan G6:** definisi G6 tidak ditemukan di `docs/` maupun komentar kode (G1–G5 dan G7–G10 ada). **[OPEN]** pemilik mengonfirmasi isinya.

**Platform [D]:** Mandor **mobile-first (375px)**; Owner/Admin desktop-first (1280px); Anggota Tim responsif, terutama alur tugas di 375px. Lima role resmi saja; **tidak ada Tukang**; tidak ada Vendor.

**Batas teknis [D]:** UI di atas mock; **bukan** otorisasi/keamanan (penegakan di backend, U3-B1/B2); tidak ada klaim production-ready; tanpa dependency/backend baru; aturan role **hanya** di `src/lib/access.ts` (jangan menyalin ke komponen); warna hanya dari token; teks Bahasa Indonesia dengan istilah dari `labels.ts`.

**Pola route dinamis [D: U4-0-SPIKE.md, "Implikasi"]:** halaman server tipis + komponen klien + `generateStaticParams` dari seed + `not-found.tsx` segmen; tautan ke detail memakai `<Link>`; setelah membuat entitas arahkan lewat `router.push` (bukan `redirect` server); pesan sukses menyebut "(simulasi)"; ID runtime tidak bisa dibuka lewat URL langsung (selalu not-found).

**Gerbang selesai per langkah [D: CLAUDE.md §8–9, AGENTS.md]** — berlaku untuk setiap U4-5 s.d. U4-12:
1. Rencana UI/perubahan (file + dampak) ditampilkan dan disetujui **sebelum** kode diubah (`CLAUDE.md` §5).
2. Skrip uji baru untuk fitur langkah itu dijalankan lebih dulu; lalu regresi: statis (`lint`, `typecheck`, `build`, `check:contrast`, `check:tokens`, `check:u4-foundation`), browser U4 (`check:u4-components`, `check:u4-access`, `check:u4-projects` + skrip baru), regresi lama (`check:dynamic-routes`, `check:browser`). Skrip browser **satu per satu**, tidak paralel; tanpa melonggarkan asersi lama.
3. Evaluasi visual aktual 375/768/1280 (screenshot benar-benar dilihat), kelemahan dilaporkan apa adanya (`CLAUDE.md` §8D).
4. Skill yang relevan benar-benar dipanggil (`design:*`, `verification-before-completion`, `code-review` tanpa `--fix`/`--comment`), dan laporan menyebut yang dipanggil (`CLAUDE.md` §8B).
5. Evidence `docs/u4-evidence/U4-n-*.md` + `docs/PROJECT-SUMMARY.md` diperbarui. Laporan memisahkan: lulus, gagal, belum dijalankan (`CLAUDE.md` §9C).
6. Berhenti dan menunggu persetujuan sebelum langkah berikutnya.

## 3. Rencana per langkah

### U4-5 — Detail proyek `/proyek/[projectId]`

> **STATUS: SELESAI, PASS (2026-10-28).** Rencana di bawah dipertahankan sebagai catatan; hasil aktual, matriks per role, keputusan implementasi di celah spesifikasi, dan risiko U4-6 ada di `docs/u4-evidence/U4-5-PROJECT-DETAIL.md`. Implementasi memakai tab Ringkasan, Tugas, Tim (Tim tidak untuk Anggota Tim; email hanya Owner/Admin), fungsi izin baru `canViewProjectTeam`, `getVisibleProjectTasks`, `seesOnlyOwnTasks`, dan `lib/project-relations.ts`.

**Tujuan:** mengganti `ProjectDetailPlaceholder` (`components/detail/entity-detail-placeholders.tsx`, komentarnya sendiri menyebut "dipakai sampai U4-5") dengan halaman detail proyek yang sebenarnya, hanya-baca.

- **[D]** Pola route dinamis di §2; guard `AccessGuard` + `canViewProject` dari U4-3 dipertahankan (`U4-3-ACCESS.md`).
- **[D]** Mandor/Anggota Tim hanya baca (J5). Proyek Arsip hanya baca (G7). Tanpa tombol ubah/hapus (U4-6) dan tanpa kelola anggota (U4-7) (`U4-4-PROJECTS.md` "Catatan untuk U4-5").
- **[D]** `Tabs` (U4-2) boleh dipakai; bila panel berat, pertimbangkan pemuatan malas per panel (`U4-2-COMPONENTS.md` batasan 6).
- **[D]** Halaman yang memakai `DeadlineBadge` wajib menampilkan `DemoDataNotice showDeadlineReference`.
- **[R]** Isi: kode, nama, klien, status, periode, lokasi, deskripsi, progres; panel anggota proyek (hanya baca) dan panel tugas proyek (lingkup lewat `canViewTask`). Pembagian tab belum ditetapkan di sumber mana pun.
- **[R]** Detail ini kelak menjadi titik masuk tautan ke media proyek (U5-B), tetapi **tidak boleh** memuat tab/placeholder U5 sebelum U5 disetujui.
- **[D: F2] Tanpa anggaran:** detail proyek **tidak menampilkan** anggaran dalam bentuk apa pun (nominal, kartu, baris, label, tooltip), untuk role mana pun. Komponen detail tidak membaca `project.budget`. (Sebelumnya OPEN U4-O1; ditutup 2026-10-28.)
- **Izin dipakai:** `canViewProject`. Tidak ada fungsi izin baru yang diharapkan.
- **Pengujian [R]:** skrip baru pola `check:u4-projects` — lingkup per role di detail, ID runtime via navigasi klien, not-found, Arsip hanya baca, 375/768/1280, axe 0, dan **asersi tanpa anggaran** (pola `check-u4-projects.mjs:179`: tidak ada `Rp`/`IDR`/"anggaran" di detail) untuk Owner, Admin, Mandor, Anggota Tim.

### U4-6 — Buat, ubah, hapus proyek

> **STATUS: SELESAI, PASS WITH NOTES (verifikasi final 2026-11-06).** Rencana di bawah dipertahankan sebagai catatan; hasil aktual ada di `docs/u4-evidence/U4-6-PROJECT-CRUD.md`. Butir [OPEN] di bawah sudah diputuskan: hapus proyek **diblokir** bila masih ada Task, ProjectMember, atau Admin principal — tanpa kaskade (`access.ts` `getProjectDeleteBlockers`, "ATURAN MUTLAK (pemilik, U4-6)"); penetapan Admin principal **tidak** di U4-6 (U4-7). `/u4-spike` belum dihapus; uji lama masih memakainya (U4-10). Catatan terbuka: `check:login-touch` di tree utama gagal 4/244 karena `logo.tsx` Owner yang belum di-commit (lolos 244/244 tanpa file itu); harness `check:u4-access` rawan race hidrasi saat mesin lambat; peringatan dev Next.js pada `/proyek/[projectId]` sudah ada sejak U4-5.

- **[D]** Owner membuat dan menghapus proyek; Admin Kantor hanya mengubah proyek yang ia tangani (J3). `canCreateProject`, `canEditProject`, `canDeleteProject` sudah ada di `access.ts` tetapi **belum punya pemanggil UI**.
- **[D]** Kode proyek otomatis (`PRJ-00n`); field opsional diterima; **Arsip bukan status yang dapat dipilih** di form (J7). Proyek Arsip tidak dapat diubah atau dihapus (G7).
- **[D]** Hapus memakai `ConfirmDialog` yang menyebut akibat (CLAUDE.md §8C); setelah membuat, `router.push` ke detail; pesan sukses menyebut "(simulasi)"; `DemoDataNotice` menjelaskan reload menghapus data (J9).
- **[D]** `createProject` sudah ada di `mock-store.ts`; mutasi ubah/hapus dan lapisan async/latensi simulasi (pola `auth-mock.ts`) **ditambahkan di langkah ini**, tanpa pemeriksaan izin di store (`mock-store.ts`, komentar header).
- **[D]** Halaman uji `/u4-spike`, `components/spike/spike-controls.tsx`, `lib/u4-spike-gate.ts` **dihapus di U4-6/U4-10** (`U4-3-ACCESS.md:95`). Pemakainya: `check:dynamic-routes`, `check:u4-access`, `check:u4-projects`. **Pengujian harus dipindahkan** ke alur buat-proyek yang sungguhan (navigasi klien) sebelum artefak dihapus, tanpa melonggarkan asersi.
- **[R]** Pembagian penghapusan `/u4-spike`: karena `createTask` baru memiliki UI di U4-10, penghapusan tuntas realistis baru di U4-10; U4-6 cukup memindahkan pembuatan proyek runtime. Konfirmasi saat rencana langkah diajukan.
- **[OPEN] Hapus proyek yang masih punya anggota/tugas:** `canDeleteProject` hanya memeriksa Owner + bukan Arsip (`access.ts:163`). Tidak ada aturan tertulis tentang proyek yang masih memiliki tugas/anggota/laporan (bandingkan G3 untuk akun). Implementor tidak boleh memilih sendiri (blokir, kaskade, atau izinkan).
- **[D: F2] Form tanpa field anggaran:** form tambah dan ubah proyek **tidak memiliki** input anggaran; tidak ada validasi, nilai bawaan yang terlihat, atau ringkasan anggaran. `Project` dan `NewProjectInput` sudah tidak memiliki `budget` (§6), sehingga form dan store tidak punya field anggaran untuk diisi; `check:no-budget` menjaga kunci `Project` persis himpunan yang diizinkan.
- **[OPEN] Penetapan Admin principal** (`canAssignAdminPrincipal`, Owner saja, §7A): ditempatkan di U4-6 (form proyek) atau U4-7 (kelola anggota)? Dikelompokkan sebagai L2 di `access.ts`; **[R]** usul U4-7.
- **Pengujian [R]:** matriks per role (Owner buat/hapus; Admin principal ubah; Admin lain/Mandor/Anggota tidak), validasi form, Arsip hanya baca, ConfirmDialog, 375/768/1280, axe 0, migrasi uji `/u4-spike`, dan asersi form **tanpa** field/label anggaran.

### U4-7 — Kelola anggota proyek

- **[D]** Tambah anggota (Mandor/Anggota Tim): Owner atau Admin principal proyek itu; **Mandor tidak** (J1). `canAddProjectMember`, `getProjectMemberCandidates`.
- **[D]** Keluarkan anggota: **Owner saja** (G9, fail-closed: Admin hanya menambah); diblokir selama anggota masih memegang tugas di proyek itu (G3) via `decideRemoveProjectMember` (alasan `HAS_TASKS`).
- **[D]** Admin principal: satu per proyek, ditetapkan Owner (§7A), kandidat hanya role Admin Kantor (`canAssignAdminPrincipal`, `getAdminPrincipalCandidates`).
- **[D]** Proyek Arsip hanya baca. Hak penugasan tugas (U4-8/9) tidak diperluas ke keanggotaan (J1).
- **[R]** Antarmuka berada di detail proyek (panel anggota dari U4-5 menjadi dapat diubah untuk yang berhak). Belum ada rancangan tertulis.
- **[R]** Pesan penolakan per `DenyReason` dalam Bahasa Indonesia (copy via `design:ux-copy` bila tersedia).
- **Pengujian [R]:** tiap persona × tiap aksi; blokir `HAS_TASKS`; Mandor tidak melihat kontrol tambah/keluarkan; daftar kandidat; ConfirmDialog; 375/768/1280, axe 0.

### U4-8 — Daftar tugas `/tugas` per lingkup

- **[D]** Menerapkan `getVisibleTasks` (`access.ts`): Owner semua; Admin proyek principal; Mandor semua tugas proyek tempatnya menjadi anggota (G5); Anggota Tim hanya miliknya (J5). Komentar `tugas/page.tsx:29-30` menandai ini sebagai pekerjaan U4-8.
- **[D]** Tautan ke detail memakai `<Link>`; `TaskCard` ber-`href` memakai stretched link, sehingga kontrol aksi di dalam kartu wajib `relative z-10` (`U4-2-COMPONENTS.md` batasan 3). `DemoDataNotice showDeadlineReference` wajib.
- **[D]** `assigneeName` pada `Task` sebaiknya diambil dari `User` (`U4-1-FOUNDATION.md:112`).
- **[D]** Mandor/Anggota Tim: mobile-first 375px; tanpa aksi yang hanya muncul saat hover. Tabel tetap mulai `lg`; kartu responsif (`951b9d7`) dipertahankan dan diberi tautan.
- **[D]** Kanban di luar U4 (J10). Tanpa filter/pencarian kecuali disetujui.
- **[R]** Daftar membaca dari store mock (bukan `MOCK_TASKS` langsung) agar tugas runtime muncul setelah U4-10.
- **Pengujian [R]:** jumlah baris per persona = `getVisibleTasks`; tautan ke detail; 375 sentuh (Mandor, Anggota), 768, 1280; axe 0.

### U4-9 — Detail tugas `/tugas/[taskId]`, ubah status, tugaskan ulang

- **[D]** Mengganti `TaskDetailPlaceholder`. Status: `TODO`/`IN_PROGRESS`/`DONE`.
- **[D]** Ubah status (`canChangeTaskStatus`): Owner/Admin principal; Anggota Tim hanya tugas miliknya (J5); Mandor tugas yang dipegang dirinya atau Anggota Tim di proyeknya, **bukan** tugas Mandor lain dan bukan tugas tanpa penanggung jawab (G1, fail-closed).
- **[D]** Tugaskan ulang (`canReassignTask`, `getAssigneeCandidates`): Owner/Admin principal ke Mandor/Anggota anggota proyek; Mandor **hanya** tugas yang kini dipegang Anggota Tim, **hanya** ke Anggota Tim (G1); Anggota Tim tidak. Penanggung jawab harus anggota proyek (J6).
- **[D]** Progres (%) **hanya ditampilkan** (J6); **tidak ada hapus tugas** (J6).
- **[D]** Popup `<select>` native tidak teruji di headless: **cek manual di ponsel nyata sebelum U4-9 dianggap selesai** (`U4-2-COMPONENTS.md` batasan 1). Ini membutuhkan perangkat Owner; tidak dapat dibuktikan otomatis.
- **[R]** Edit field tugas (judul, deskripsi, tenggat, prioritas, tanggal mulai; `canEditTask`: Owner/Admin principal) ditempatkan di U4-9 atau U4-10; belum tertulis. Usul: bersama formnya di U4-10.
- **[OPEN] Status vs progres:** progres hanya tampil (J6), sehingga mengubah status ke `DONE` tidak mengubah angka progres (bisa tampil "Selesai" dengan 60%). Apakah ini diterima, atau ada aturan hubungan status–progres? Tidak ada dasar dokumentasi.
- **Pengujian [R]:** matriks G1 (termasuk penolakan), reassign, kandidat, status per persona, 375 sentuh, axe 0.

### U4-10 — Buat tugas

- **[D]** Membuat tugas: Owner atau Admin principal proyek itu; **Mandor dan Anggota Tim tidak** (`canCreateTask`). Proyek Arsip tidak.
- **[D]** Field minimal (judul wajib; lainnya mengikuti J6/J7), kode otomatis (`TSK-00n`), penanggung jawab dari `getAssigneeCandidates`, `router.push` ke detail, "(simulasi)", `DemoDataNotice` J9. `createTask` sudah ada di store.
- **[D]** Pembersihan `/u4-spike` dan pemindahan hook ujinya (lihat U4-6).
- **[R]** Pilihan proyek di form dibatasi proyek yang boleh dikelola pelaku.
- **Pengujian [R]:** matriks per role, validasi, penanggung jawab tidak valid ditolak, tugas runtime muncul di `/tugas` dan detail, 375/768/1280, axe 0.

### U4-11 — Manajemen pengguna `/anggota`

- **[D]** Lihat daftar: Owner dan Admin Kantor saja; Mandor (G2) dan Anggota Tim (J5) tidak (`canViewOrgUsers`; sudah ditegakkan sebagai akses menu di U4-3).
- **[D]** Tambah pengguna: Owner → Admin/Mandor/Anggota Tim; Admin → Mandor/Anggota Tim (`getAddableOrgRoles`, J4). Tanpa registrasi publik untuk role selain Owner (U3-1) dan **tanpa alur undangan** (U3-6; undangan = kelas C).
- **[D]** Ubah role global dan hapus akun: **Owner saja**; akun Owner dilindungi (G4); diblokir selama akun masih Admin principal, anggota proyek, atau memegang tugas (G3) via `decideChangeOrgUserRole`/`decideDeleteOrgUser`. Admin tidak mengubah role global atau mengelola akun (J4; CLAUDE.md §7C).
- **[D]** Lima role resmi saja; **tidak ada Tukang**, tidak ada role baru (mis. Project Manager).
- **[R]** Halaman `/anggota` membaca `MOCK_USERS` statis sekarang; U4-11 harus membaca `users` dari store. Konsekuensi: `auth-mock.ts` (`MOCK_USERS.find`, baris 54 dan 63) tidak mengenal pengguna baru. Perlu ditentukan apakah pengguna yang ditambahkan di demo dapat login (lihat U4-O8).
- **[OPEN] Pilihan role tujuan saat mengubah role global:** rencana belum menyebutnya; asumsi sementara = daftar `ORG_ROLE_OPTIONS.OWNER` (`U4-1-FOUNDATION.md:113`). Bila berbeda, **minta keputusan Owner sebelum U4-11**.
- **Pengujian [R]:** matriks per role dan blokir G3/G4, tiap `DenyReason`, ConfirmDialog (akibat disebut), 375/768/1280, axe 0.

### U4-12 — Dashboard, penutupan U4, dan perapian pengujian

- **[D]** Dashboard analitik hanya Owner/Admin (J2). `StatCard` (U4-2) menggantikan kartu lokal dashboard lama (`U4-2-COMPONENTS.md:24`). `DemoDataNotice showDeadlineReference` untuk status tenggat (G10).
- **[D]** Lingkup data dashboard mengikuti `getVisibleProjects`/`getVisibleTasks` (Admin hanya proyek yang ia tangani, G8). Saat ini dashboard membaca `MOCK_PROJECTS/TASKS/REPORTS/USERS` langsung, tanpa lingkup (`dashboard/page.tsx:24,35-36`).
- **[D]** Spesifikasi MVP: total proyek, tugas tertunda, progres anggota, grafik dasar (`docs/deep-research-report.md`). **Grafik tidak boleh memakai library baru** tanpa persetujuan (J11); gunakan `ProgressBar`/CSS yang sudah ada, atau ajukan dulu.
- **[D]** Perapian tes: tes browser U4 memakai navigasi klien untuk ID runtime; rapikan helper CDP yang terduplikasi di `browser-check.mjs` dan `check-dynamic-routes.mjs` (`U4-0-SPIKE.md:67`). Pantau kegagalan sementara `check:u4-access` login ketuk Mandor 375 (`U4-4-PROJECTS.md:69`, penyebab belum terbukti).
- **[R]** Penutupan U4: regresi penuh dalam kelompok (CLAUDE.md §9), evidence ringkasan U4, status roadmap diperbarui, audit sisa placeholder (`/pengaturan` tetap "Segera hadir" sampai ada keputusan fitur).
- **[R]** Angka "laporan menunggu" di dashboard berasal dari `MOCK_REPORTS` (domain U5). U4-12 memakai sumber yang ada apa adanya; penyambungan ke store laporan menjadi tugas U5 (lihat `U5-PLAN.md` §7).
- **[D: F2] Anggaran di Dashboard — SUDAH DIHAPUS (pembersihan 2026-10-28):** kolom "Anggaran", nilai `formatRupiah(p.budget)`, dan impor `formatRupiah` sudah dihapus dari `dashboard/page.tsx`; tabel kini Kode, Nama Proyek, Status, Progres. **Tidak diganti** dengan metrik keuangan. U4-12 **mempertahankan** penjaga (kolom tabel persis empat kolom, tanpa `Rp`/`IDR`/"anggaran" untuk Owner dan Admin di 375/768/1280) dan tidak boleh memperkenalkan kembali kolom atau statistik keuangan saat `StatCard` menggantikan kartu lokal.
- **[FAKTA, visual 375px]** Tabel Dashboard di 375px selebar 544px dalam kontainer 299px: kolom Status dan Progres tergulir keluar tanpa petunjuk geser (halaman tidak overflow). Kelemahan lama yang tidak disebabkan pembersihan (kini satu kolom lebih sedikit); U4-12 sebaiknya memakai pola kartu `RecordCard` di bawah `lg` seperti halaman Laporan/Dokumen/Anggota.

## 4. Peta dependensi internal U4

```
U4-5 detail proyek ──┬─> U4-6 CRUD proyek ──> (hapus /u4-spike tuntas bersama U4-10)
                     └─> U4-7 kelola anggota
U4-7 ──> U4-8 daftar tugas ──> U4-9 detail tugas ──> U4-10 buat tugas
U4-11 manajemen pengguna (mandiri; memengaruhi sumber users di store)
U4-5..U4-11 ──> U4-12 dashboard + penutupan + perapian tes
```
Urutan fisik tetap U4-5 → U4-12 sesuai keputusan pemilik; peta ini hanya menjelaskan alasannya **[R]**.

## 5. Keputusan Owner untuk U4

**Ditutup:**

| ID | Keputusan | Status |
|---|---|---|
| U4-O1 | Visibilitas anggaran proyek | **CLOSED 2026-10-28 — REMOVE FEATURE ENTIRELY (F2).** Anggaran dihapus dari produk untuk semua role; bukan aturan sembunyi per role. Dampak: U4-5, U4-6, U4-12, dan §6. |

**Masih OPEN:**

| ID | Keputusan | Memblokir | Catatan |
|---|---|---|---|
| U4-O2 | Aturan hapus proyek yang masih memiliki anggota/tugas | U4-6 | `canDeleteProject` tidak memeriksa. |
| U4-O3 | Penempatan penetapan Admin principal (U4-6 atau U4-7) | U4-6/U4-7 | Usul [R]: U4-7. |
| U4-O4 | Hubungan status tugas ↔ progres | U4-9 | J6 membuat progres display-only. |
| U4-O5 | Pilihan role tujuan saat ubah role global | U4-11 | `U4-1-FOUNDATION.md:113`. |
| U4-O6 | Isi G6 | semua | Tidak ditemukan di repository. |
| U4-O7 | Penempatan edit field tugas (U4-9 vs U4-10) | U4-9/U4-10 | Usul [R]: U4-10. |
| U4-O8 | Pengguna yang ditambahkan lewat UI demo: dapat login atau tidak | U4-11 | `auth-mock.ts` membaca `MOCK_USERS`. |

G1–G9 tetap fail-closed sampai Owner memfinalkan.

## 6. Penghapusan anggaran (F2): hasil pembersihan

Audit atas `proyekin/src`, `proyekin/scripts`, dan `docs/` (pencarian tidak peka huruf besar/kecil: `budget`, `anggaran`, `RAB`, `biaya`, `harga`, `price`, `cost`, `rupiah`, `Rp`, `IDR`, `currency`, `keuangan`, `finans`, `spent`, `pengeluaran`, `dana`, `nominal`). Catatan teknis: "anggaran" juga cocok dengan kata "pelanggaran" (laporan axe), sehingga penjaga memakai batas kata.

**Status: DIEKSEKUSI 2026-10-28** atas perintah Owner (pembersihan menyeluruh sekarang, bukan bertahap). Rencana awal T1–T4 digantikan. Bukti dan hasil pengujian: `docs/u4-evidence/budget-cleanup/` (`BUDGET-CLEANUP.md`).

### 6.1 Fitur anggaran proyek: DIHAPUS

| # | Lokasi | Jenis | Tindakan yang dilakukan |
|---|---|---|---|
| B1 | `src/app/(app)/dashboard/page.tsx` | UI | Kolom tabel "Anggaran" dihapus |
| B2 | `src/app/(app)/dashboard/page.tsx` | UI | Sel `formatRupiah(p.budget)` dihapus |
| B3 | `src/app/(app)/dashboard/page.tsx` | Impor | `import { formatRupiah }` dihapus |
| B4 | `src/types/index.ts` | Tipe | `Project.budget` dihapus (tanpa properti `@deprecated`); `NewProjectInput` ikut tanpa `budget` |
| B5 | `src/data/mock.ts` | Seed | `budget` pada 5 proyek seed dihapus |
| B6 | `src/data/mock.ts` | Statistik mock | `MOCK_STATS.budgetTotal` dan `budgetSpent` dihapus |
| B7 | `src/lib/utils.ts` | Util | `formatRupiah` dihapus (pemakai tunggal: dashboard; terbukti 0 pemakai sisa) |
| B8 | `src/components/spike/spike-controls.tsx` | Halaman uji sementara | Argumen `budget: 0` dibuang |
| B9 | `scripts/check-u4-foundation.mjs` | Uji | Argumen `budget: 0` dibuang di dua pemanggilan `createProject` (tanpa asersi dilonggarkan; 213 pemeriksaan tetap) |
| B10 | `src/components/projects/project-list.tsx` | Komentar | Paragraf "anggaran sengaja tidak ditampilkan; belum ada keputusan…" dihapus (usang) |
| B11 | `scripts/check-u4-projects.mjs` | Uji (penjaga) | **Dipertahankan dan diperketat:** memakai pola bersama `lib/no-budget.mjs`; ditambah bagian G (HTML 8 route, DOM Dashboard Owner dan Admin di 1280/768/375, detail proyek 6 kombinasi, 6 bagian aplikasi lain, kolom tabel Dashboard persis empat) |
| B12 | `docs/deep-research-report.md` (+ cermin root) | Spesifikasi | Diselaraskan (penanda inline + catatan keputusan) |
| B13 | `scripts/check-no-budget.mjs`, `scripts/lib/no-budget.mjs`, skrip npm `check:no-budget` | Uji baru | Penjaga statis: nol token di `src/`, kunci `Project` persis himpunan yang diizinkan, tidak ada kunci/teks anggaran di semua ekspor `mock.ts`, `createProject` tanpa `budget`, `formatRupiah` tidak diekspor, 22 pemeriksaan. Uji merah-hijau: 5 mutasi tertangkap, kontrol negatif ("pelanggaran") tidak memicu |

`access.ts`, `labels.ts`, `navigation.ts`, `mock-store.ts`: tidak pernah memuat referensi anggaran (tidak ada izin anggaran), jadi tidak diubah. Tidak ada permission role yang diubah.

### 6.2 Dipertahankan dengan sengaja

| # | Lokasi | Isi | Alasan |
|---|---|---|---|
| N1 | `src/data/mock.ts` | `MOCK_PRICING` (harga langganan SaaS) | Konteks berbeda dari anggaran proyek; instruksi Owner mempertahankannya. Tetap kelas C; tidak ada fitur pricing baru. `check:no-budget` menjaga agar tidak ikut terhapus (3 paket, kunci `price`). |
| N2 | `src/components/style-guide/sections.tsx:136` | Contoh tipografi angka "Rp 1.250.000 — 0123456789" (halaman dev `/style-guide`) | Contoh format angka tabular, bukan data atau fitur anggaran; di luar daftar rujukan yang diperintahkan dihapus. Tidak berada di rute aplikasi yang diuji penjaga UI. Dapat diganti kemudian bila Owner menghendaki UI tanpa nominal rupiah sama sekali. |
| N3 | `src/data/mock.ts:165` | Deskripsi tugas t-005 (TSK-005) "…sesuai RAB yang disetujui." | Teks naratif mock, bukan data/fitur anggaran; aturan proyek melarang menghapus mock data konsep di luar scope sebelum dievaluasi (J8). Diusulkan netral saat U4-9; menunggu persetujuan. |
| N4 | `src/data/mock.ts` + `scripts/check-responsive-lists.mjs` | Dokumen legacy "RAB Renovasi Gedung Kantor" (`d-002`) dan asersi isinya | Data legacy `Document`; di luar scope F1 dan tidak dihapus sekarang (keputusan Owner). Berhenti tampil di UI pada U5-B (`U5-PLAN.md` §5.4) dan asersinya diganti di sana. `check:no-budget` menjaga bahwa data ini belum terhapus. |
| N5 | `docs/u2-evidence/`, `docs/u3-evidence/`, `docs/u4-evidence/U4-4-PROJECTS.md` | Evidence historis (screenshot dashboard lama memuat kolom anggaran; catatan "keputusan tertunda") | Perintah Owner: dipertahankan sebagai catatan hasil pengujian masa lalu. Tidak diubah. |
| N6 | `docs/BACKEND-ROADMAP.md` | Tidak menyebut anggaran | Saat skema database disusun, entitas proyek tanpa kolom anggaran (F2). |

### 6.3 Verifikasi (aktual, 2026-10-28)

Lint 0 error (1 warning lama `Role` di `mock.ts`), typecheck, build (normal), `check:contrast` 57/57, `check:tokens`, `check:no-budget` 22/22, `check:u4-foundation` 213/213, `check:u4-projects` 261/261, `check:u4-components` 62/62, `check:u4-access` 201/201, `check:responsive-lists` 449/449, `check:login-touch` 244/244, `check:browser` (54 flow, axe 0 di 42 titik, 0 overflow), `check:dynamic-routes` 28/28. Uji merah: `check:u4-projects` terhadap Dashboard yang sengaja diberi kembali kolom Anggaran gagal pada 19 pemeriksaan (HTML dan DOM); berkas dipulihkan identik. Rincian: `docs/u4-evidence/budget-cleanup/BUDGET-CLEANUP.md`.
