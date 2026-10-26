# U4-1 — Fondasi data dan matriks akses UI (hasil: PASS)

Tanggal: 2026-10-25. Branch `feat/u4-core-ui` (setelah U4-0, commit `2d8f705`). Tidak ada UI bisnis final, CRUD, guard, atau redirect di tahap ini.
Semua yang tertulis di sini adalah **representasi UI di atas data mock**, bukan otorisasi dan bukan kontrol keamanan.

## 1. Tiga lapisan

| Lapisan | Isi | Data | Pemeriksa izin (`lib/access.ts`) |
|---|---|---|---|
| **L1** pengguna organisasi + role global | akun dan 5 role resmi | `MOCK_USERS` → `store.users` | `canViewOrgUsers`, `getAddableOrgRoles`, `canAddOrgUser`, `decideChangeOrgUserRole`, `decideDeleteOrgUser` |
| **L2** keanggotaan proyek + Admin principal | satu `Project.adminId` per proyek; `ProjectMember {projectId, userId}` hanya Mandor/Anggota | `MOCK_PROJECTS`, `MOCK_PROJECT_MEMBERS` | `canAssignAdminPrincipal`, `canAddProjectMember`, `decideRemoveProjectMember`, `getProjectMemberCandidates`, `getAdminPrincipalCandidates` |
| **L3** penugasan dan status tugas | `Task.assigneeId`, `Task.status` | `MOCK_TASKS` | `canViewTask`, `canCreateTask`, `canEditTask`, `canChangeTaskStatus`, `canReassignTask`, `canDeleteTask`, `isValidAssignee`, `getAssigneeCandidates` |

Hak di satu lapisan tidak berlaku otomatis di lapisan lain (J1): Mandor boleh menugaskan ulang tugas (L3), tetapi tidak menambah/mengeluarkan anggota proyek (L2) dan tidak melihat pengguna organisasi (L1).

## 2. Konstanta role (`lib/roles.ts`, `lib/labels.ts`)

Lima role resmi, tidak ada tambahan: Owner, Admin Kantor, Mandor, Anggota Tim, Guest. Daftar pilihan sengaja terpisah dari label:

| Konstanta | Isi | Dipakai untuk |
|---|---|---|
| `ROLE_LABELS` (labels.ts) | kelima role | hanya label tampilan |
| `ALL_ROLES` | kelima role | iterasi/validasi, bukan pilihan form |
| `ADMIN_PRINCIPAL_ROLE` | Admin Kantor | satu-satunya role yang boleh menjadi Admin principal |
| `PROJECT_MEMBER_ROLES` | Mandor, Anggota Tim | anggota proyek (L2) |
| `TASK_ASSIGNEE_ROLES` | Mandor, Anggota Tim | calon penanggung jawab (L3), ditambah syarat "anggota proyek itu" (J6) |
| `ORG_ROLE_OPTIONS[peran pelaku]` | Owner → Admin, Mandor, Anggota; Admin → Mandor, Anggota; lainnya kosong | role yang boleh ditambahkan pelaku (L1, J4) |

Owner dan Guest tidak pernah menjadi pilihan di daftar mana pun. Kata "Tukang" tidak ada di `src` (dipindai oleh `check:u4-foundation`).

## 3. Matriks fungsi `access.ts`

Aktor kosong dan Guest ditolak untuk semuanya. ✓ = boleh, ✗ = tidak, ◐ = bersyarat (lingkup/data). Nomor G = batas fail-closed dari rencana final (belum diputuskan pemilik; tidak ada hak yang diperluas).

| Fungsi | Owner | Admin Kantor | Mandor | Anggota Tim | Catatan |
|---|---|---|---|---|---|
| `canViewDashboard` | ✓ | ✓ | ✗ | ✗ | J2 |
| `getHomePath(role)` | `/dashboard` | `/dashboard` | `/tugas` | `/tugas` | J2; Guest → `/`. **Belum dipakai** (U4-3) |
| `canViewProject` | ✓ semua | ◐ hanya proyek yang ia principal-i (G8) | ◐ anggota | ◐ anggota | |
| `canCreateProject` | ✓ | ✗ | ✗ | ✗ | J3 |
| `canEditProject` (data + status) | ✓ | ◐ principal | ✗ | ✗ | J3; proyek Arsip hanya baca (G7) |
| `canDeleteProject` | ✓ | ✗ | ✗ | ✗ | J3; Arsip tidak dapat dihapus (G7) |
| `canAssignAdminPrincipal` | ✓ | ✗ | ✗ | ✗ | §7A; Arsip ✗ |
| `canAddProjectMember` | ✓ | ◐ principal | ✗ | ✗ | J1: penugasan ≠ keanggotaan |
| `decideRemoveProjectMember` | ◐ (ditahan bila masih memegang tugas: `HAS_TASKS`) | ✗ `ROLE` | ✗ | ✗ | G3, G9 |
| `canViewTask` | ✓ semua | ◐ proyek principal | ◐ semua tugas proyek anggota (G5) | ◐ hanya miliknya (J5) | |
| `canCreateTask` | ✓ | ◐ principal | ✗ | ✗ | Arsip ✗ |
| `canEditTask` (judul, deskripsi, tenggat, prioritas, tgl mulai) | ✓ | ◐ principal | ✗ | ✗ | |
| `canChangeTaskStatus` | ✓ | ◐ principal | ◐ tugas yang dipegang dirinya atau Anggota Tim (G1) | ◐ hanya miliknya (J5) | |
| `canReassignTask` | ✓ | ◐ principal | ◐ hanya tugas yang kini dipegang Anggota Tim, ke Anggota Tim (G1) | ✗ | tugas tanpa penanggung jawab ✗ untuk Mandor |
| `canDeleteTask` | ✗ | ✗ | ✗ | ✗ | J6 |
| `getAssigneeCandidates` | Mandor/Anggota anggota proyek | sama (principal) | hanya Anggota Tim, hanya untuk tugas yang boleh ia tugaskan ulang | kosong | J6, G1 |
| `canViewOrgUsers` | ✓ | ✓ | ✗ (G2) | ✗ (J5) | |
| `getAddableOrgRoles` / `canAddOrgUser` | Admin, Mandor, Anggota | Mandor, Anggota | kosong | kosong | J4 |
| `decideChangeOrgUserRole` / `decideDeleteOrgUser` | ◐ bukan akun Owner (G4); ditahan bila akun masih Admin principal, anggota proyek, atau memegang tugas (G3) | ✗ `ROLE` | ✗ | ✗ | J4: Admin hanya menambah |

Fungsi `decide*` mengembalikan `{allowed}` atau `{allowed:false, reason}`; alasan (`ROLE`, `ARCHIVED`, `HAS_TASKS`, `HAS_MEMBERSHIPS`, `IS_ADMIN_PRINCIPAL`, `PROTECTED_ACCOUNT`) memiliki teks di `DENY_REASON_LABELS`.

## 4. Perubahan seed dan alasannya

Tidak ada data historis yang dihapus.

| Perubahan | Alasan |
|---|---|
| `Project.adminId` baru: PRJ-001 dan PRJ-002 → Siti Aminah (`u-002`); PRJ-003..005 kosong | Admin principal (§7A, satu per proyek). Proyek tanpa Admin tampil "Belum ada Admin Kantor" nanti. |
| `Project.managerId` dipertahankan, diberi penanda `@deprecated` dan komentar LEGACY | Nilai lama mencampur Owner (PRJ-003..005) dan Admin sehingga tidak bermakna; tidak dihapus sesuai instruksi. |
| `ProjectMember` baru + `MOCK_PROJECT_MEMBERS` (5 baris): PRJ-001 = Ahmad, Dewi, Eko; PRJ-002 = Ahmad, Eko; PRJ-003..005 kosong | Disusun dari relasi yang sudah ada: penanggung jawab tugas dan penulis laporan. Setiap penanggung jawab dan penulis laporan kini anggota proyeknya. PRJ-003..005 kosong untuk menguji state kosong. |
| **TSK-005**: penanggung jawab Siti Aminah (Admin Kantor) → **Eko Prasetyo** (Mandor, anggota PRJ-002) | J6: penanggung jawab hanya Mandor/Anggota Tim anggota proyek. Eko juga yang menulis laporan PRJ-002 (r-003). Perubahan ini terlihat di halaman Tugas. |
| `MOCK_TEAM_MEMBERS` (memuat "Project Manager") tidak disentuh dan tidak dipakai | Menunggu evaluasi pemilik; tidak menjadi dasar role resmi. Dipastikan oleh pemeriksaan. |

## 5. Tanggal acuan demo dan tenggat (`lib/demo-date.ts`)

- `DEMO_REFERENCE_DATE = "2026-03-21"` (G10) adalah satu-satunya sumber. Label `DEMO_REFERENCE_DATE_LABEL` = "21 Maret 2026" (format UTC, sama di server dan klien) dan `DEMO_DATE_NOTICE` = "Status tenggat dihitung terhadap tanggal acuan demo 21 Maret 2026, bukan tanggal hari ini." Tahap UI berikutnya wajib menampilkannya di halaman yang memuat status tenggat. **U4-1 belum menampilkannya** (tidak ada halaman baru).
- Evaluasi hanya tanggal (`YYYY-MM-DD`); jam diabaikan; tidak memakai jam/tanggal sistem (diuji dengan memajukan `Date` ke 2030: hasil tetap).
- Hasil seed: **2 tugas terlambat** (TSK-002 tenggat 28 Feb, TSK-003 tenggat 5 Mar); TSK-004, TSK-005, TSK-006 mendatang; TSK-001 selesai; 0 jatuh tempo hari ini. Seluruh aktivitas seed (laporan, tanggal mulai tugas, unggahan dokumen) tidak melewati tanggal acuan.

## 6. Store memori (`lib/mock-store.ts`, `lib/use-mock-store.ts`)

Pola yang dibuktikan di U4-0: `useSyncExternalStore`, snapshot server = `SEED` (referensi stabil), perubahan hanya di memori, reset saat reload, tanpa localStorage/sessionStorage/jaringan.
State: `{users, projects, members, tasks}` (bentuknya langsung memenuhi `AccessData`). Primitif yang ada: `createProject` dan `createTask` (ID/kode otomatis `p-006`/`PRJ-006`, `t-007`/`TSK-007`) dan `resetMockStore`. Mutasi lain dan lapisan async/latensi simulasi ditambahkan bertahap bersama formnya (U4-5..U4-11). Store **tidak** memeriksa izin; pemanggil memakai `access.ts`.

`use-current-user.ts` memberi pengguna efektif (sesi demo U3, atau Owner demo saat mode pengembangan, dengan penanda `isDemoFallback`) dan konsisten dengan `SessionShell` yang tidak diubah.

## 7. Artefak spike U4-0: migrasi dan pembersihan

- `lib/u4-spike-store.ts` **dihapus**. `components/spike/entity-probe.tsx` dan `spike-controls.tsx` kini memakai `mock-store`. ID runtime tetap `p-006`/`t-007`, seperti di bukti U4-0.
- Skrip `check-dynamic-routes.mjs` tidak diubah selain satu pernyataan tambahan (store ter-reset saat dokumen baru). Hasil: HTTP 7/7, browser 21/21.
- Masih ada (dibersihkan di U4-3/U4-4): halaman `/u4-spike*`, `components/spike/route-guard.tsx`, `entity-probe`, `spike-controls`, `spike-not-found`, `lib/u4-spike-gate.ts`.

## 8. Pengurangan duplikasi label dan perbaikan `getStatusLabel`

- Peta label/varian dipusatkan di `lib/labels.ts`; `ROLE_LABELS` dipindahkan dari `navigation.ts` (visibilitas menu per role **tidak diubah**, penyesuaian J2/J5 di U4-3). Halaman Dashboard, Proyek, Tugas, dan Anggota kini memakai peta pusat; keluarannya sama persis (screenshot Dashboard, Proyek, Anggota, Laporan, Dokumen identik byte-per-byte dengan evidence U3; Tugas hanya berbeda pada TSK-005).
- Bug `getStatusLabel()` (selalu memakai label proyek untuk kunci apa pun, termasuk "TODO"→"TODO"; parameter `lang` tak dipakai) diperbaiki dengan fungsi per domain (`getProjectStatusLabel`, `getTaskStatusLabel`, `getTaskPriorityLabel`, `getReportStatusLabel`, `getDocumentStatusLabel`, `getRoleLabel`). Fungsi lama tidak punya pemanggil, jadi dihapus. Halaman Laporan dan Dokumen belum dimigrasikan (U5); peta lama dari `utils.ts` kini ada di `labels.ts` dan siap dipakai.

## 9. Pengujian

| Pemeriksaan | Hasil |
|---|---|
| lint | 0 error; 1 warning lama (`mock.ts` import `Role`) |
| typecheck, build | lulus (build default: halaman uji `/u4-spike*` → 404) |
| check:contrast / check:tokens | 50/50 / 0 warna mentah |
| **check:u4-foundation** (baru) | **182 pemeriksaan lolos**: lima role dan daftar pilihan, relasi seed, tenggat (2 terlambat, independen dari jam sistem), store (snapshot server stabil, reset, tanpa penyimpanan), matriks izin 7 persona, Guest/kosong ditolak, `access.ts` belum diimpor halaman/komponen |
| check:browser (regresi U1–U3) | 0 kegagalan: 53/53 alur, axe 0 pelanggaran (18 tampilan auth + 24 tampilan app), 0 overflow |
| check:dynamic-routes (produksi) | HTTP 7/7, browser 21/21 |
| Uji mutasi | dua mutasi pelanggaran G1/J1 pada `access.ts` terdeteksi, lalu file dipulihkan (hash sama) |

Reload mereset store dibuktikan di browser: ID runtime pertama di dokumen baru kembali `p-006`, dan ID runtime hilang setelah reload (not-found).

## 10. Catatan dan hal yang tidak diputuskan

- G1–G9 tetap fail-closed; tidak ada hak yang diperluas. Tidak ditemukan konflik aturan bisnis baru yang menghentikan pekerjaan.
- `assigneeName` pada `Task` masih menyalin nama pengguna (tetap dijaga konsisten oleh pemeriksaan); U4-8 sebaiknya mengambil nama dari `User`.
- Untuk perubahan role global (U4-11) rencana belum menyebut pilihan role tujuan; asumsi sementara sama dengan `ORG_ROLE_OPTIONS.OWNER`. Bila berbeda, minta keputusan pemilik sebelum U4-11.
- Skrip pemeriksaan memuat `.ts` lewat loader kecil (`scripts/lib/ts-alias-loader.mjs`) yang memakai `typescript` yang sudah terpasang; tidak ada dependency baru.
