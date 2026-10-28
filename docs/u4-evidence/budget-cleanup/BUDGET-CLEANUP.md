# Evidence: penghapusan fitur anggaran (F2) — 2026-10-28

Keputusan final Owner: fitur anggaran proyek **dihapus total** dari PROYEKIN untuk **semua role** (bukan disembunyikan per role). Dokumen ini mencatat hasil pembersihan kode dan pengujiannya. Rencana dan daftar rujukan lengkap: `docs/U4-PLAN.md` §6. Semua angka di bawah berasal dari eksekusi aktual pada sesi ini (log di folder ini).

Representasi UI di atas data mock; bukan otorisasi; tidak production-ready. Tidak ada perubahan `access.ts`, permission role, guard, API contract, atau dependency. Lima role resmi tetap; tidak ada role baru; menu Dokumen tetap; U5 tidak diimplementasikan.

## 1. Yang dihapus (27 baris di `src/`, 2 argumen di skrip uji)

| Berkas | Perubahan |
|---|---|
| `src/types/index.ts` | `Project.budget` dihapus (`NewProjectInput = Omit<Project, "id" \| "code">` otomatis ikut) |
| `src/data/mock.ts` | `budget` pada 5 proyek seed; `MOCK_STATS.budgetTotal` dan `budgetSpent` |
| `src/lib/utils.ts` | `formatRupiah` (pemakai tunggal: Dashboard) |
| `src/app/(app)/dashboard/page.tsx` | impor `formatRupiah`, kolom "Anggaran", sel nominal |
| `src/components/spike/spike-controls.tsx` | argumen `budget: 0` |
| `src/components/projects/project-list.tsx` | komentar usang "anggaran sengaja tidak ditampilkan…" |
| `scripts/check-u4-foundation.mjs` | argumen `budget: 0` pada dua pemanggilan `createProject` (213 pemeriksaan tetap, tidak ada asersi dilonggarkan) |

Tidak ada fitur keuangan pengganti.

## 2. Dipertahankan dengan sengaja

| Item | Alasan |
|---|---|
| `MOCK_PRICING` (harga langganan SaaS) | Konteks berbeda; instruksi Owner. Dijaga `check:no-budget` agar tidak ikut terhapus. Tidak ada fitur pricing baru. |
| Data legacy `Document` / "RAB Renovasi Gedung Kantor" (`d-002`) dan asersi `check-responsive-lists.mjs:63` | Data legacy dan di luar scope F1; berhenti tampil di UI pada U5-B; tidak dihapus sekarang (keputusan Owner). |
| Teks mock tugas t-005 "…sesuai RAB yang disetujui." | Narasi mock, bukan data/fitur anggaran; mock konsep di luar scope dievaluasi dulu (J8). **Menunggu keputusan Owner.** |
| Contoh angka "Rp 1.250.000" di `/style-guide` (halaman dev) | Contoh format angka tabular, bukan anggaran. **Menunggu keputusan Owner** bila ingin dihapus juga. |
| Evidence historis (`docs/u2-evidence`, `docs/u3-evidence`, `U4-4-PROJECTS.md`) | Catatan hasil pengujian masa lalu; tidak diubah. |

## 3. Penjaga yang ditambahkan atau diperketat

- **`npm run check:no-budget`** (baru, `scripts/check-no-budget.mjs` + `scripts/lib/no-budget.mjs`), 22 pemeriksaan: nol token `budget` / `anggaran` / `formatRupiah` di seluruh `src/` (komentar ikut); kunci setiap `Project` seed dan hasil `createProject` hanya himpunan yang diizinkan; tidak ada kunci/teks anggaran di semua ekspor `mock.ts` (penelusuran dalam) dan `MOCK_STATS`; `formatRupiah` tidak diekspor; `MOCK_PRICING` dan `d-002` masih ada; tidak ada ekspor keuangan pengganti. Pola memakai lookbehind agar kata "pelanggaran" (laporan axe) tidak memicu.
- **`check:u4-projects` bagian G** (diperluas dari 205 menjadi 261 pemeriksaan): HTML prerender 8 route (`/dashboard`, `/proyek`, `/proyek/p-001`, `/tugas`, `/laporan`, `/dokumen`, `/anggota`, `/pengaturan`); DOM Dashboard untuk Owner dan Admin Kantor di 1280/768/375 mobile (tanpa kata anggaran atau nominal Rp/IDR, kolom tabel **persis** Kode, Nama Proyek, Status, Progres, 5 baris × 4 sel, 4 kartu statistik, overflow, axe 0); detail proyek untuk 5 persona (+ Owner pada Arsip p-005); DOM 6 bagian aplikasi lain untuk Owner. Asersi lama "anggaran tidak ditampilkan" di daftar proyek diperketat memakai pola bersama.

### Uji merah-hijau
| Mutasi (berkas dipulihkan, hash dibuktikan sama) | Hasil penjaga |
|---|---|
| M1 komentar `budget` di `types/index.ts` | `check:no-budget` exit 1 |
| M2 `budget: 1` di seed p-001 | exit 1 (dua pemeriksaan: sumber dan kunci model) |
| M3 `formatRupiah` kembali di `utils.ts` | exit 1 (dua pemeriksaan) |
| M4 kata "Anggaran" di komponen | exit 1 |
| M5 `MOCK_STATS.budgetTotal` kembali | exit 1 (dua pemeriksaan) |
| K1 kontrol negatif: komentar "0 pelanggaran" | exit 0 (tidak memicu) |
| Dashboard diberi kembali kolom "Anggaran" dan sel "Rp 1.000" | `check:u4-projects` exit 1, **19 dari 261 pemeriksaan gagal** (HTML dan DOM, Owner dan Admin, 3 viewport): `check-u4-projects-RED-mutasi.log` |

## 4. Hasil regresi aktual (setiap perintah dijalankan sendiri; exit code dan output dibaca)

| Pemeriksaan | Hasil | Berkas |
|---|---|---|
| `lint` | exit 0; 0 error, 1 warning lama (`Role` tak terpakai di `mock.ts`) | `lint.log` |
| `typecheck` | exit 0 | `typecheck.log` |
| `build` (normal) | exit 0 (dijalankan sebelum dan sesudah `check:dynamic-routes`) | `build.log`, `build-final.log` |
| `check:contrast` | exit 0; 57/57 | `check-contrast.log` |
| `check:tokens` | exit 0; tidak ada warna mentah | `check-tokens.log` |
| `check:no-budget` (baru) | exit 0; 22/22 | `check-no-budget.log` |
| `check:u4-foundation` | exit 0; 213/213 | `check-u4-foundation.log` |
| `check:u4-projects` | exit 0; **261/261** (205 lama + 56 baru) | `check-u4-projects.log`, `…-results.json` |
| `check:u4-components` | exit 0; 62/62 | `check-u4-components.log` |
| `check:u4-access` | exit 0; 201/201 | `check-u4-access.log` |
| `check:responsive-lists` | exit 0; 449/449 | `check-responsive-lists.log` |
| `check:login-touch` | exit 0; 244/244 | `check-login-touch.log` |
| `check:browser` | exit 0; 54 flow, 0 gagal, axe 0 di 42 titik ukur (24 app + 18 auth), 0 overflow horizontal | `check-browser.log`, `…-results.json` |
| `check:dynamic-routes` | exit 0; 28/28 | `check-dynamic-routes.log` |

Suite browser dijalankan **satu per satu** (satu rantai berurutan, berhenti di kegagalan pertama); ringkasan waktu dan exit code: `suites-summary.txt`. Tidak ada proses sisa setelah selesai (diverifikasi). `check:dynamic-routes` membangun dengan `U4_SPIKE=1`, karena itu `build` normal dijalankan ulang sesudahnya.

Catatan: `check:u4-projects` mengubah `src/data/mock.ts` sementara untuk akun uji dan selalu memulihkannya; diverifikasi bahwa diff kode akhir tetap persis 27 baris terhapus tanpa akun uji tertinggal.

## 5. Evaluasi visual (screenshot benar-benar dilihat)

Berkas: `dashboard-shots/` (`budi-` dan `siti-dashboard-{1280,768,375-mobile}.png`, ditambah `budi-dashboard-tabel-375-mobile.png`).

- **1280 (Owner dan Admin):** tabel empat kolom rapi; hierarki jelas (judul, empat kartu statistik, tabel); tidak ada ruang kosong janggal setelah kolom kanan dihapus; status berlabel + titik; bilah progres terbaca. Kartu statistik lebih tinggi dari kebutuhan isinya (kelemahan lama).
- **768:** kartu dua kolom, tabel muat penuh tanpa gulir; baik.
- **375 mobile:** bagian atas rapi, tetapi empat kartu satu kolom sangat tinggi sehingga tabel baru terlihat setelah banyak menggulir. **Kelemahan:** tabel selebar 544px di kontainer 299px; kolom **Status dan Progres tergulir keluar tanpa petunjuk geser** (halaman tidak overflow: `scrollWidth` 375). Kelemahan lama (sebelumnya tabel lebih lebar karena kolom anggaran), bukan akibat pembersihan; Dashboard bukan halaman utama Mandor/Anggota Tim. Dibawa ke U4-12 (kartu responsif di bawah `lg`, pola `RecordCard`).
- **Kelemahan lama lain (tidak diubah):** Dashboard Admin Kantor menampilkan **kelima** proyek (termasuk yang bukan tanggung jawabnya; G8) karena Dashboard belum dilingkup per role; dan `StatCard` U4-2 belum dipakai. Keduanya cakupan U4-12.

## 6. Skill yang benar-benar dipanggil pada tugas ini
- `code-review` (argumen `low`, tanpa `--fix`/`--comment`) dipanggil sebelum commit, tetapi agen yang dijalankan **berhenti setelah 16 detik dan 1 tool call tanpa keluaran apa pun** (tidak ada temuan dan tidak ada laporan). Hasil itu **tidak dihitung sebagai review selesai**. Fallback `CLAUDE.md` §8C dijalankan: `git diff` ditinjau baris demi baris (murni penghapusan: 27 baris di `src/` ditambah 2 argumen skrip uji; tidak ada perubahan di luar rujukan anggaran; tidak ada duplikasi aturan role; tidak ada hardcode hex; tidak ada perubahan `access.ts` atau guard), dan skrip uji baru dibuktikan lewat uji merah-hijau (§3).
- `verification-before-completion` (dipanggil sebelum klaim selesai dan sebelum commit).
- Skill `design:*` tidak dipanggil: perubahan UI hanya penghapusan satu kolom tanpa teks atau komponen baru; pemeriksaan manual `CLAUDE.md` §8C dipakai (token via `check:tokens`, kontras via `check:contrast`, axe 0, fokus/target sentuh tidak berubah, evaluasi visual 375/768/1280 di atas).
