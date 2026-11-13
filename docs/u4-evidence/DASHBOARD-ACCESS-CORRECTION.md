# Dashboard Access Correction (`/dashboard`)

Status: **PASS WITH NOTES** (verifikasi final 2026-11-13). Catatan: `check:login-touch` 4/244 karena `logo.tsx` Owner
(identik dengan baseline); satu kegagalan timing `check:u4-components` di run final yang lolos 3/3 saat diulang (§7).

> **Representasi UI di atas mock, BUKAN otorisasi dan TIDAK production-ready.** Tidak ada backend, database, atau otorisasi
> server. Seed mock tetap ada di bundel JavaScript; penyaringan berjalan di browser. Penegakan sesungguhnya wajib di backend.

## 1. Masalah

`src/app/(app)/dashboard/page.tsx` (sebelum perbaikan) membaca `MOCK_PROJECTS`, `MOCK_TASKS`, `MOCK_REPORTS`, dan `MOCK_USERS`
langsung, tanpa lingkup pengguna. Akibatnya:
- Admin Kantor (Siti) melihat **kelima** proyek di tabel dan statistik seluruh organisasi.
- Rina Wulandari (`u-006`, Admin Kantor tanpa proyek) melihat nama, kode, status, dan progres semua proyek.
- "Anggota Tim" menghitung **semua pengguna** (6), bukan orang di proyek.
- HTML prerender `/dashboard` memuat tabel proyek lengkap untuk semua pengunjung.
- Dashboard membaca seed, bukan store, sehingga perubahan U4-7 (penetapan Admin) tidak tercermin.

Bukti RED: test baru dijalankan terhadap kode lama (`561d113`) → 37 FAIL, termasuk "HTML /dashboard tanpa nama proyek"
(HTML memuat nama proyek) dan "rina: nama/kode proyek tidak pernah terlihat" (`dashboard-access/m1/dashboard-access-RED-kode-lama.log`).

## 2. Aturan (keputusan Owner 2026-11-13)

1. Owner melihat data seluruh proyek sesuai kewenangannya.
2. Admin Kantor hanya melihat proyek yang Admin principal-nya dirinya sendiri.
3. Rina tanpa penugasan tidak melihat data proyek apa pun.
4. Setelah ditetapkan, Rina hanya melihat proyek yang menjadi kewenangannya.
5. Lingkup berlaku untuk **seluruh** informasi turunan, bukan hanya tabel.
6. **Anggota Tim** = pengguna unik dari semua proyek dalam lingkup; satu orang dihitung sekali. **Admin principal ikut
   dihitung** (jawaban Owner atas pertanyaan klarifikasi, mengikuti definisi tim U4-7 `getProjectTeam`).

## 3. Implementasi

| Berkas | Perubahan |
|---|---|
| `src/lib/dashboard-summary.ts` (baru) | `getDashboardSummary(actor, data, reports)`: fungsi murni. Proyek dari `getVisibleProjects`, tugas dari `getVisibleTasks`, laporan disaring ke proyek dalam lingkup, orang unik dari `getProjectTeam`. Tanpa akses Dashboard (`canViewDashboard`) → ringkasan kosong (fail-closed). Tidak memeriksa role sendiri. |
| `src/lib/access.ts` | `seesAllProjects(actor)` (Owner) untuk kalimat lingkup; sejalan dengan `canViewProject`. Tidak ada aturan akses yang berubah. |
| `src/components/dashboard/dashboard-overview.tsx` (baru) | Komponen klien: `useCurrentUser` + `useMockStore` → ringkasan. Memakai komponen bersama `PageHeader`, `StatCard`, `ProgressBar`, `EmptyState`, `Skeleton`, `Table`. Selama sesi belum diketahui hanya skeleton yang dirender, sehingga HTML prerender tidak memuat data proyek. |
| `src/app/(app)/dashboard/page.tsx` | Hanya merender `DashboardOverview`. `StatCard` lokal dan bar progres buatan sendiri dihapus. |
| `src/lib/labels.ts` | Copy Dashboard: `DASHBOARD_TEXT`, `getDashboardScopeText`, `getDashboardEmptyText`. |

Informasi Dashboard yang diaudit: 4 kartu statistik (Proyek Aktif, Tugas Tertunda, Laporan Menunggu, Anggota Tim), tabel
proyek (kode, nama, status, progres), dan deskripsi halaman. Dashboard tidak memiliki grafik, daftar perhatian, atau daftar tenggat.

| Persona (seed) | Proyek di tabel | Proyek Aktif / Tugas Tertunda / Laporan Menunggu / Anggota Tim |
|---|---|---|
| Budi (Owner) | PRJ-001 s.d. PRJ-005 | 3 / 5 / 2 / 4 (sebelumnya Anggota Tim 6) |
| Siti (Admin principal p-001, p-002) | PRJ-001, PRJ-002 | 2 / 5 / 2 / 4 (sebelumnya melihat 5 proyek, Proyek Aktif 3) |
| Rina tanpa penugasan | — (state kosong) | 0 / 0 / 0 / 0 |
| Rina setelah ditetapkan di p-001 | PRJ-001 | 1 / 3 / 1 / 4 (Siti lalu: PRJ-002, 1 / 2 / 1 / 3) |
| Mandor, Anggota Tim, Guest | tidak dapat membuka Dashboard | ringkasan kosong |

## 4. Copy (design:ux-copy)

- Lingkup: Owner "Ringkasan seluruh N proyek organisasi." (0 proyek: "Belum ada proyek di organisasi."); Admin "Ringkasan N
  proyek yang Anda tangani sebagai Admin penanggung jawab."; Admin tanpa proyek "Belum ada proyek yang Anda tangani sebagai
  Admin penanggung jawab."
- State kosong Admin: "Belum ada proyek yang Anda tangani" + "Proyek dan ringkasannya muncul di sini setelah Owner menetapkan
  Anda sebagai Admin penanggung jawab sebuah proyek." Owner tanpa proyek: "Belum ada proyek" + arahan ke menu Proyek.
- Keterangan kartu memakai label status resmi: "Berjalan atau Tertunda", "Belum Selesai", "Berstatus Terkirim", "Dihitung
  sekali per orang".

## 5. Skill yang dipanggil (tool `Skill`, sesi 2026-11-13)

| Skill | Kapan | Diterapkan |
|---|---|---|
| `frontend-design:frontend-design` | Sebelum membangun | Arah visual tetap identitas PROYEKIN; satu elemen informatif yang menonjol (kalimat lingkup); tanpa gradient, label kapital, atau angka dekoratif baru. |
| `design:design-system` (audit) | Sebelum membangun | `StatCard` lokal duplikat diganti komponen bersama; bar progres `bg-primary` (2,56:1) diganti `ProgressBar` (`brand-700` 4,22:1, `role="progressbar"`); header memakai `PageHeader`. |
| `design:ux-copy` | Sebelum membangun | Seluruh copy §4 (istilah "Admin penanggung jawab", label status resmi). |
| `design:accessibility-review` | Setelah build, dengan axe 0 | 0 kritis/mayor; 1 minor (`aria-busy="false"` berlebihan) diperbaiki. Kontras dan struktur heading diverifikasi. |
| `code-review` (medium, tanpa `--fix`/`--comment`) | Sebelum commit | 10 temuan. Diperbaiki: copy kosong Owner, `.gitignore` folder bukti, asersi tugas runtime diperkuat, tipe `DashboardScope` dipakai ulang, filter tugas ganda dihapus. Ditolak dengan alasan: definisi Anggota Tim (keputusan Owner). Tidak disentuh: `logo.tsx` (file Owner). Dicatat: §8. |
| `verification-before-completion` | Sebelum klaim PASS | Checklist kebutuhan §2 dipetakan ke asersi; tidak ada berkas berubah setelah suite final dimulai; diff hanya berkas Dashboard. |

## 6. Perubahan asersi uji lama (disengaja, berdasarkan keputusan Owner)

1. `check-u4-projects.mjs`: Dashboard Siti diharapkan PRJ-001, PRJ-002 (sebelumnya kelima proyek, yaitu kebocoran yang
   dikoreksi); Owner tetap 5. Ditambah penantian `data-state="ready"` karena Dashboard kini dirender di klien.
2. `check-dynamic-routes.mjs`: penanda teks guard `/dashboard` diganti dari deskripsi lama ("Ringkasan proyek dan aktivitas
   tim", sudah tidak ada) ke "Memuat ringkasan dashboard". Ketiga syarat (konten di markup, dibungkus `hidden`, placeholder) tetap.
3. `check-u4-foundation.mjs`: daftar literal pemakai `access.ts` ditambah `lib/dashboard-summary.ts`.

Tidak ada asersi yang dihapus dan tidak ada jumlah pemeriksaan yang berkurang.

## 7. Hasil pengujian (output + exit code dibaca; log di `docs/u4-evidence/dashboard-access/`)

| Pemeriksaan | Baseline M0 (`561d113`) | Final M1 |
|---|---|---|
| `check:dashboard-access` (baru) | — (RED 37 FAIL pada kode lama) | **95/95** |
| `check:u4-foundation` | 412/412 | 412/412 |
| `check:u4-access` | 201/201 | 201/201 |
| `check:u4-projects` | 261/261 | 261/261 |
| `check:u4-project-detail` | 642/642 | 642/642 |
| `check:u4-project-crud` | 129/129 | 129/129 |
| `check:u4-project-members` (U4-7) | 114/114 | 114/114 |
| `check:responsive-lists` | 467/467 | 467/467 |
| `check:u4-components` | 72/72 | 71/72 di run suite (timing, lihat bawah); **72/72 pada 3 run ulang** |
| `check:dynamic-routes`, `check:browser` | lolos | lolos |
| `check:login-touch` | 240/244 (baseline Owner) | 240/244, 4 FAIL **identik** dengan baseline |
| `check:no-budget`, `check:contrast`, `check:tokens` | 22/22, 57/57, lolos | 22/22, 57/57, lolos |
| lint / typecheck / build | 0 error (1 warning lama) / EXIT 0 / EXIT 0 | sama |

Kegagalan `check:u4-components` "tabs: ArrowRight memindah dan mengaktifkan tab berikutnya": seleksi tab sudah "Tugas", tetapi
panel dibaca tanpa menunggu setelah `pressKey`. Ini race timing harness (tidak ada perubahan di `components/ui` atau style
guide; lolos 3/3 saat diulang). Perbaikan harness di luar scope Dashboard dan diajukan terpisah.

Run pertama suite M1 (sebelum perbaikan code-review) disimpan di `m1/final-run1-sebelum-review/`: menemukan daftar pemakai
`access.ts` (foundation) dan penanda guard (dynamic-routes), keduanya ditangani di §6.

## 8. Keterbatasan

1. **Bukan otorisasi.** Seed tetap ada di bundel klien; HTML prerender kini tanpa data proyek, tetapi data masih terbaca lewat
   JavaScript/DevTools. Sesi `sessionStorage`; tanpa sesi, mode pengembangan memakai fallback Owner demo.
2. **Laporan harian belum ada di store** (scope U5): "Laporan Menunggu" dihitung dari seed yang disaring per lingkup; perubahan
   laporan runtime (U5) belum tercermin.
3. Di 375px, Admin tanpa proyek melihat empat kartu bernilai 0 sebelum state kosong (±1,5 layar); kalimat lingkup di atas
   sudah menjelaskan penyebabnya di layar pertama.
4. Tabel proyek Dashboard di 375px tetap tabel yang dapat digulir dalam kartunya (pola U2, tanpa overflow halaman).
5. Cek kata anggaran pada HTML `/dashboard` (`check:u4-projects`) kini selalu lolos karena HTML tanpa data; penjaga anggaran
   pada DOM Owner/Admin tetap berjalan.

## 9. Evaluasi visual (tangkapan aktual, `dashboard-access/screens/`)

Dilihat: Siti 1280, Rina 375, Owner 768, Rina setelah ditetapkan 1280. Kuat: kalimat lingkup menjelaskan cakupan angka; keterangan
kartu menghapus ambiguitas; progres memakai `brand-700` yang lebih kontras; state kosong menyebut siapa yang dapat mengubah
keadaan. Lemah: butir 8.3; indikator dev Next.js "N" muncul di tangkapan (artefak `next dev`).
