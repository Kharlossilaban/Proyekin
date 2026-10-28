# PROYEKIN — Rencana U4-5 sampai U4-12 (tertulis ulang)

Dibuat: 2026-10-28 · Branch: `feat/u4-core-ui` · Status dokumen: **REFERENSI IMPLEMENTASI; tidak ada langkah di sini yang sudah dimulai.**
Revisi: 2026-10-28 — dua keputusan FINAL Owner dicatat (§2 "Keputusan final Owner 2026-10-28"): **F1** Dokumen tetap ada dengan scope visual sempit; **F2** anggaran dihapus total dari produk. U4-O1 ditutup. Audit dampak anggaran dan rencana pembersihannya di §6.

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
| U4-5 s.d. U4-12 | **NOT STARTED** | tidak ada commit, evidence, atau skrip uji |

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

**Aturan turunan F2 untuk semua langkah:** tidak ada langkah U4 (atau U5 dan seterusnya) yang boleh memperkenalkan kembali tampilan, field, statistik, fungsi izin, atau label anggaran/keuangan. Properti legacy `Project.budget` dan data mock terkait boleh tetap ada **sementara dan internal** selama transisi (lihat §6), tetapi tidak boleh dibaca oleh UI atau dipakai sebagai fitur.

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

- **[D]** Owner membuat dan menghapus proyek; Admin Kantor hanya mengubah proyek yang ia tangani (J3). `canCreateProject`, `canEditProject`, `canDeleteProject` sudah ada di `access.ts` tetapi **belum punya pemanggil UI**.
- **[D]** Kode proyek otomatis (`PRJ-00n`); field opsional diterima; **Arsip bukan status yang dapat dipilih** di form (J7). Proyek Arsip tidak dapat diubah atau dihapus (G7).
- **[D]** Hapus memakai `ConfirmDialog` yang menyebut akibat (CLAUDE.md §8C); setelah membuat, `router.push` ke detail; pesan sukses menyebut "(simulasi)"; `DemoDataNotice` menjelaskan reload menghapus data (J9).
- **[D]** `createProject` sudah ada di `mock-store.ts`; mutasi ubah/hapus dan lapisan async/latensi simulasi (pola `auth-mock.ts`) **ditambahkan di langkah ini**, tanpa pemeriksaan izin di store (`mock-store.ts`, komentar header).
- **[D]** Halaman uji `/u4-spike`, `components/spike/spike-controls.tsx`, `lib/u4-spike-gate.ts` **dihapus di U4-6/U4-10** (`U4-3-ACCESS.md:95`). Pemakainya: `check:dynamic-routes`, `check:u4-access`, `check:u4-projects`. **Pengujian harus dipindahkan** ke alur buat-proyek yang sungguhan (navigasi klien) sebelum artefak dihapus, tanpa melonggarkan asersi.
- **[R]** Pembagian penghapusan `/u4-spike`: karena `createTask` baru memiliki UI di U4-10, penghapusan tuntas realistis baru di U4-10; U4-6 cukup memindahkan pembuatan proyek runtime. Konfirmasi saat rencana langkah diajukan.
- **[OPEN] Hapus proyek yang masih punya anggota/tugas:** `canDeleteProject` hanya memeriksa Owner + bukan Arsip (`access.ts:163`). Tidak ada aturan tertulis tentang proyek yang masih memiliki tugas/anggota/laporan (bandingkan G3 untuk akun). Implementor tidak boleh memilih sendiri (blokir, kaskade, atau izinkan).
- **[D: F2] Form tanpa field anggaran:** form tambah dan ubah proyek **tidak memiliki** input anggaran; tidak ada validasi, nilai bawaan yang terlihat, atau ringkasan anggaran. Transisi tipe (`NewProjectInput` saat ini mewajibkan `budget`) ditangani sesuai §6 tahap T2; form dan store **tidak boleh** mengisi nilai anggaran palsu yang kemudian terlihat di UI.
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
- **[D: F2] Hapus anggaran dari Dashboard (wajib):** kolom tabel "Anggaran" (`dashboard/page.tsx:88`), nilai `formatRupiah(p.budget)` (`:117`), dan impor `formatRupiah` (`:26`) dihapus. Tidak ada statistik/total/sisa anggaran di `StatCard`, grafik, atau ringkasan, dan **tidak diganti** dengan metrik keuangan lain. Pengujian dashboard menambah asersi tanpa `Rp`/`IDR`/"anggaran" untuk Owner dan Admin di 375/768/1280.
- **[D: F2] Pembersihan akhir anggaran** (§6 tahap T4) dijadwalkan sebagai bagian penutupan U4-12, dengan persetujuan Owner tersendiri sebelum properti legacy dihapus.
- **[FAKTA]** Sampai U4-12 dikerjakan, dashboard lama (kode U2) **masih menampilkan** kolom Anggaran untuk Owner/Admin. Owner menetapkan penghapusannya di U4-12; perbaikan lebih awal hanya bila Owner memintanya.

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

## 6. Penghapusan anggaran (F2): audit dampak dan rencana pembersihan terkontrol

Audit 2026-10-28 atas `proyekin/src`, `proyekin/scripts`, dan `docs/` (pencarian: `budget`, `anggaran`, `Rupiah`, `Rp`, `IDR`, `currency`, `RAB`, `biaya`, `harga`, `keuangan`, `finans`, `spent`). **Tidak ada kode yang diubah pada tahap ini.**

### 6.1 Temuan: fitur anggaran proyek (wajib dibersihkan)

| # | Lokasi | Jenis | Kondisi sekarang | Tindakan | Tahap |
|---|---|---|---|---|---|
| B1 | `src/app/(app)/dashboard/page.tsx:88` | UI | Kolom tabel "Anggaran" | Hapus kolom | T3 (U4-12) |
| B2 | `src/app/(app)/dashboard/page.tsx:117` | UI | `formatRupiah(p.budget)` tampil untuk Owner/Admin, tanpa lingkup | Hapus | T3 (U4-12) |
| B3 | `src/app/(app)/dashboard/page.tsx:26` | Impor | `import { formatRupiah }` | Hapus bersama B2 | T3 (U4-12) |
| B4 | `src/types/index.ts:20` | Tipe | `Project.budget: number` (wajib) | T2: jadikan `budget?: number` bertanda `@deprecated` LEGACY (pola `managerId`), tanpa pemakai UI. T4: hapus | T2 (U4-6) → T4 |
| B5 | `src/data/mock.ts:29,44,59,73,87` | Seed | Nilai `budget` di 5 proyek seed | Dipertahankan sementara (internal); hapus bersama B4 | T4 |
| B6 | `src/data/mock.ts:336-337` | Seed | `MOCK_STATS.budgetTotal`, `budgetSpent` (`MOCK_STATS` **tanpa pemakai** di `src` dan `scripts`) | Hapus dua kunci ini | T4 |
| B7 | `src/lib/utils.ts:8-16` | Util | `formatRupiah` — satu-satunya pemakai: dashboard (B2) | Hapus setelah B2 hilang dan pencarian membuktikan 0 pemakai | T4 |
| B8 | `src/components/spike/spike-controls.tsx:22` | Uji sementara | `budget: 0` saat membuat proyek runtime | Ikut terhapus bersama `/u4-spike` (U4-6/U4-10); bila masih ada saat T2, buang argumen `budget` | T2 |
| B9 | `scripts/check-u4-foundation.mjs:133,142` | Uji | `createProject({... budget: 0 ...})` | Buang argumen `budget` (tidak melonggarkan asersi apa pun) | T2 |
| B10 | `src/components/projects/project-list.tsx:7` | Komentar | "belum ada keputusan siapa boleh melihat angka keuangan" — sudah usang | Perbarui komentar: anggaran dihapus dari produk (F2) | T1 (U4-5) |
| B11 | `scripts/check-u4-projects.mjs:5,179-180` | Uji (penjaga) | Asersi "anggaran tidak ditampilkan" di daftar proyek | **Dipertahankan** sebagai penjaga regresi permanen; pola yang sama diperluas ke detail (T1), form (T2), dashboard (T3) | T1–T3 |
| B12 | `docs/deep-research-report.md:22` (+ cermin root) | Spesifikasi | "Setiap proyek berisi detail (nama, deskripsi, anggaran, klien)" | **Sudah diselaraskan 2026-10-28** (ditandai dihapus + catatan keputusan) | selesai (dokumen) |

`access.ts`, `labels.ts`, `navigation.ts`, `mock-store.ts`: **tidak ada** referensi anggaran (izin anggaran memang tidak pernah ada).

### 6.2 Temuan terkait keuangan yang BUKAN fitur anggaran proyek

| # | Lokasi | Isi | Perlakuan |
|---|---|---|---|
| N1 | `src/data/mock.ts:398-423` | `MOCK_PRICING` (harga langganan SaaS, mis. "Rp 199.000"); tanpa pemakai UI | Bukan anggaran proyek; tetap **kelas C** ("model harga belum disetujui"). Tidak diubah oleh F2 dan **tidak boleh** dipakai sebagai pengganti anggaran. |
| N2 | `src/components/style-guide/sections.tsx:136` | Contoh tipografi angka "Rp 1.250.000 — 0123456789" (halaman dev `/style-guide`) | Bukan data/fitur; **usul** ganti contoh dengan angka non-mata-uang di T3 agar tidak ada nominal rupiah di UI. Perlu persetujuan bersama rencana U4-12. |
| N3 | `src/data/mock.ts:170` | Deskripsi tugas "Pengadaan baja WF … sesuai RAB yang disetujui." | Teks naratif, bukan data anggaran. Akan terlihat di detail tugas (U4-9). **Usul** ubah teks netral (mis. "sesuai spesifikasi yang disetujui") dalam rencana U4-9; perubahan teks mock diajukan dulu (J8). |
| N4 | `src/data/mock.ts:266` + `scripts/check-responsive-lists.mjs:63` | Dokumen legacy "RAB Renovasi Gedung Kantor" (`.xlsx`) | Di luar scope F1 **dan** F2. Masih tampil di placeholder `/dokumen` sampai U5-B; U5-B menghentikan tampilan dokumen legacy (lihat `U5-PLAN.md` §5.3) dan memperbarui asersi uji. Data legacy tidak dihapus sekarang. |
| N5 | `docs/u4-evidence/U4-4-PROJECTS.md:26,75`; screenshot `docs/u2-evidence/dashboard-*.png`, `docs/u3-evidence/dashboard-*.png` | Catatan/bukti historis yang memuat anggaran sebagai keputusan tertunda / kolom dashboard | Evidence historis **tidak diubah**; status terbaru dicatat di `PROJECT-SUMMARY.md` dan dokumen ini. |
| N6 | Rencana backend (`docs/BACKEND-ROADMAP.md`) | Tidak menyebut anggaran | Saat skema database disusun, entitas proyek **tanpa** kolom anggaran (F2). Tidak ada perubahan dokumen sekarang. |

### 6.3 Urutan pembersihan terkontrol

| Tahap | Kapan | Isi | Bukti selesai |
|---|---|---|---|
| **T1** | U4-5 | Detail proyek tanpa anggaran; perbarui komentar B10; asersi tanpa anggaran di detail | Skrip uji detail lulus; `grep budget` di komponen detail = 0 |
| **T2** | U4-6 | Form tambah/ubah tanpa field anggaran; `Project.budget` jadi opsional + `@deprecated` (B4); `NewProjectInput` tidak lagi menuntut `budget`; B8, B9 | `typecheck` lulus; asersi form tanpa anggaran; `check:u4-foundation` lulus tanpa asersi dilonggarkan |
| **T3** | U4-12 | Hapus B1–B3; dashboard tanpa statistik keuangan; (usul) N2 | Asersi dashboard tanpa `Rp`/`IDR`/"anggaran" (Owner, Admin; 375/768/1280); screenshot dilihat |
| **T4** | Penutupan U4-12, **persetujuan Owner tersendiri** | Hapus B4 (tipe), B5 (seed), B6, B7. Pencarian ulang `budget|formatRupiah|anggaran` di `src` dan `scripts` hanya menyisakan asersi penjaga (B11) | `typecheck`, `lint`, `build`, `check:u4-foundation`, regresi penuh lulus; hasil pencarian dilampirkan di evidence |

Alasan bertahap: `Project.budget` saat ini wajib di tipe, sehingga menghapusnya sekaligus memaksa perubahan serentak pada seed, store, skrip uji, dan halaman uji sementara. Menjadikannya opsional di T2 memutus ketergantungan form/store lebih dulu; penghapusan permanen di T4 baru dilakukan setelah tidak ada pemakai yang tersisa dan diverifikasi dengan pengujian.
