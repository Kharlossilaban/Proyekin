# U4-7 — Kelola anggota proyek dan Admin penanggung jawab (`/proyek/[projectId]`, tab Tim)

Status: **PASS WITH NOTES** (verifikasi final M7 2026-11-13). Catatan: `check:login-touch` gagal 4/244 di tree utama karena
perubahan lokal `logo.tsx` milik Owner yang belum di-commit; lolos 244/244 pada isi commit (§14).

> **Representasi UI di atas mock, BUKAN otorisasi dan TIDAK production-ready.** Tidak ada backend, database, atau otorisasi
> server. Semua perubahan tim hanya di memori tab (hilang saat muat ulang); sesi hanya `sessionStorage`. Penegakan
> sesungguhnya direncanakan di backend (U3-B1, U3-B2; `docs/BACKEND-ROADMAP.md`).

## 1. Tujuan

Memberi Owner dan Admin penanggung jawab cara mengelola susunan tim proyek dari tab **Tim** di detail proyek, sesuai rencana
`docs/U4-PLAN.md` (U4-7) dan keputusan pemilik §7A–§7B `CLAUDE.md`: menambah Mandor/Anggota Tim, mengeluarkan anggota, serta
menetapkan, mengganti, dan mencabut Admin Kantor penanggung jawab (Admin principal). Panel tim read-only dari U4-5 menjadi dapat
diubah oleh yang berhak, tanpa mengubah kontrak U4-5/U4-6.

## 2. Scope

**Masuk:** tambah anggota, keluarkan anggota, tetapkan/ganti/cabut Admin penanggung jawab, pesan sukses/galat/blokir/stale,
seed Admin Kantor kedua (Rina Wulandari), slot `actions` di `RecordCard`, `errorMessage` di `ConfirmDialog`, suite browser
`check:u4-project-members`, hook uji khusus development, dan perbaikan race hidrasi di harness `check:u4-access` (M7).

**Tidak masuk:** penugasan ulang tugas (U4-9), daftar tugas per lingkup (U4-8), perubahan role global atau keanggotaan
organisasi (U4-11), undangan pengguna (klasifikasi C), anggaran (F2), role baru. **Dashboard Access Correction** adalah pekerjaan
terpisah setelah U4-7 (lihat §18) dan tidak ada di commit U4-7.

## 3. Business rules (satu sumber: `proyekin/src/lib/access.ts`)

| Aturan | Sumber |
|---|---|
| Anggota proyek (`ProjectMember`) hanya role global Mandor atau Anggota Tim. | `isEligibleProjectMember` |
| Admin penanggung jawab (`Project.adminId`) hanya role global Admin Kantor; **satu per proyek**. | §7A, `isEligibleAdminPrincipal` |
| Tambah anggota: Owner atau Admin principal proyek itu. Mandor tidak (J1). Tanpa duplikat. | `decideAddProjectMember` |
| Keluarkan anggota: **Owner saja** (G9, fail-closed). | `canRemoveProjectMembers`, `decideRemoveProjectMember` |
| Keluarkan diblokir selama anggota masih penanggung jawab tugas **apa pun** di proyek itu, **termasuk tugas Selesai** (G3; keputusan pemilik U4-7). | `countMemberTasks`, alasan `HAS_TASKS` |
| Tetapkan/ganti Admin: Owner saja (§7A). Kandidat pengganti tidak memuat Admin yang sedang menjabat. | `decideAssignAdminPrincipal`, `getAdminReplacementCandidates` |
| Cabut Admin: Owner saja (keputusan pemilik **U4-O10**). Hanya relasi yang dihapus. | `decideRevokeAdminPrincipal` |
| Proyek **Arsip** hanya baca: tidak ada aksi tim. Proyek **Selesai** tetap dapat diubah. | `isArchived` |
| **Tanpa kaskade**: keluarkan hanya menghapus keanggotaan; cabut hanya menghapus `adminId`. Akun, role global, tugas, dan anggota lain tidak tersentuh. | `mock-store.ts` |
| Admin lama kehilangan akses ke proyek setelah diganti/dicabut; Admin baru mendapat akses (§7A, `getVisibleProjects`). | `access.ts` |

Store (`mock-store.ts`: `addProjectMember`, `removeProjectMember`, `setProjectAdmin`) hanya menjaga integritas data dan **tidak**
memeriksa role pelaku; semua aturan role tetap di `access.ts`.

## 4. Authorization (representasi UI)

| Persona | Tab Tim p-001 | Aksi |
|---|---|---|
| Budi (Owner) | tabel + kolom Aksi | Tambah anggota, Ganti Admin, Cabut Admin, Keluarkan dari proyek, Tetapkan Admin (bila kosong) |
| Siti (Admin principal p-001, p-002) | tabel tanpa kolom Aksi | **Tambah anggota saja** |
| Rina (Admin Kantor tanpa proyek) | tidak dapat membuka proyek; daftar proyek kosong | — |
| Ahmad, Eko (Mandor) | read-only, tanpa email | tidak ada |
| Dewi (Anggota Tim) | tanpa tab Tim | tidak ada |
| Guest | tanpa App Shell (§7D) | tidak ada |

Setiap aksi memanggil fungsi `decide*` **dua kali**: saat dialog dibuka (menampilkan keadaan) dan **saat menyimpan** terhadap
snapshot store terbaru. Ini tetap **bukan otorisasi**: HTML/RSC halaman memuat data seed untuk semua pengunjung dan sesi dapat
diubah lewat DevTools.

## 5. Tambah anggota

Dialog "Tambah anggota proyek" menyebut kode dan nama proyek, menampilkan `DemoDataNotice`, dan kandidat dikelompokkan
Mandor / Anggota Tim (hanya nama, tanpa email, tanpa Owner/Admin). Validasi pilihan kosong: "Pilih satu Mandor atau Anggota Tim."
Saat menyimpan tombol memuat (`aria-busy`), pilihan dan Batal nonaktif, kirim ganda tidak menggandakan keanggotaan. Sukses:
"<nama> ditambahkan ke tim proyek (simulasi)." diumumkan lewat `role="status"`; fokus kembali ke "Tambah anggota". Bila kandidat
habis, dialog menyatakannya.

## 6. Keluarkan anggota

Owner saja. Bila anggota masih penanggung jawab tugas, dialog blokir (satu tombol "Mengerti") menyebut jumlah aktual, misalnya
"Dewi Lestari tidak dapat dikeluarkan karena masih tercatat sebagai penanggung jawab 2 tugas di proyek ini. Tidak ada data yang
diubah." Tugas Selesai tetap memblokir dan disebut "(tugas tersebut sudah selesai)". Dialog **tidak** menawarkan penugasan ulang
(fitur U4-9). Bila tidak diblokir: konfirmasi destruktif dengan fokus awal di **Batal**, akibat dijelaskan (akses hilang;
akun, tugas, dan data lain tetap; simulasi). Setelah sukses fokus pindah ke judul "Tim proyek" dan pengguna kembali menjadi
kandidat (akun global tidak dihapus).

## 7–9. Tetapkan, ganti, cabut Admin penanggung jawab

- **Tetapkan** (slot kosong bergaris putus-putus "Admin Kantor penanggung jawab belum ditetapkan." + "Tetapkan Admin"): kandidat
  hanya Admin Kantor (Siti, Rina); akibat disebut sesuai pilihan. Setelah sukses Admin menjadi baris pertama berlatar Warm
  Highlight dengan teks "Penanggung jawab" (tidak hanya warna); fokus ke "Ganti Admin"; Ringkasan ikut diperbarui.
- **Ganti**: "Admin saat ini: Siti Aminah."; kandidat tanpa Admin aktif. Akibat: Admin lama tidak lagi dapat membuka proyek,
  role keduanya tidak berubah. Teruji: setelah diganti Siti tidak lagi melihat p-001 (p-002 tetap), Rina melihat p-001 dan hanya
  mendapat "Tambah anggota".
- **Cabut** (U4-O10): konfirmasi destruktif, fokus awal di Batal, menyebut nama dan akibat; akun/role/anggota/tugas tetap. Setelah
  sukses slot kosong kembali, Ringkasan "Belum ditetapkan", fokus ke "Tetapkan Admin".

Istilah internal "Admin principal" tidak muncul di UI; pengguna melihat "Admin penanggung jawab" (`labels.ts`).

## 10. Keadaan (states)

| Keadaan | Perilaku |
|---|---|
| Sukses | Pesan "(simulasi)" via `role="status"`; fokus berpindah ke target yang masuk akal. |
| Galat validasi | Pesan di bawah pilihan, `aria-invalid`, fokus ke kontrol. |
| Galat aksi | Spesifik per alasan (`getTeamActionFailureText`); generik "Perubahan belum tersimpan. Coba lagi." hanya untuk sebab tak dikenal. Setiap pesan menyebut "Tidak ada data yang diubah." |
| Kosong | p-003: "Belum ada tim di proyek ini" mengarah ke tombol yang tersedia; Arsip memakai state kosong lama + catatan Arsip; tim berisi Admin tanpa anggota menampilkan keterangan. |
| Memuat | Tombol simpan/konfirmasi `loading` + `aria-busy`; kontrol dialog nonaktif. Sebelum sesi diketahui, `AccessGuard` menampilkan skeleton. |
| Diblokir | Dialog blokir `HAS_TASKS` dengan jumlah tugas aktual. |
| Stale | Data berubah saat dialog terbuka (E1–E8, §15): pilihan yang hilang dikosongkan dengan "Pilih lagi"; `ALREADY_MEMBER`, `NOT_MEMBER`, `ADMIN_CHANGED` ("sudah berubah menjadi Rina Wulandari"), `NO_ADMIN`, `ARCHIVED`; dialog tetap terbuka walau barisnya hilang; Admin yang diganti saat dialog terbuka dialihkan ke Akses Ditolak. Tidak ada perubahan data pada semua kasus stale. |

## 11. `RecordCard` — kompatibilitas mundur (M4, `4ea5127`)

Prop opsional `actions` dirender di area bawah terpisah (`data-slot="record-card-actions"`, border-top, `mt-auto`). **Tanpa prop,
DOM tidak berubah** dan kartu tetap tidak dapat diklik. Bukti: `check:responsive-lists` 467/467 (konsumen lama tanpa area aksi),
`check:u4-components` 72/72.

## 12. `ConfirmDialog` — kompatibilitas mundur (M4)

Prop opsional `errorMessage` (string atau fungsi dari galat). Bawaan tetap "Aksi gagal diproses. Coba lagi." bila prop tidak ada
atau menghasilkan teks kosong. Ditambah penjaga `ref` sehingga dua klik dalam satu tick tidak menjalankan `onConfirm` dua kali.
Dialog hapus proyek U4-6 tidak memakai `errorMessage` sehingga perilakunya tetap (`check:u4-project-crud` 129/129).

## 13. Seed Rina Wulandari (M1, `c7d6b8d`)

Keputusan pemilik **U4-O9**: `u-006` Rina Wulandari, `rina@proyekin.id`, Admin Kantor, ditambahkan ke `MOCK_USERS` untuk menguji
tetapkan/ganti/cabut. Rina **bukan** Admin principal atau anggota proyek mana pun; proyek dan tugas seed tidak berubah.
`check:u4-foundation` menegaskan pengguna lama tidak berubah dan lingkup Rina kosong (G8); `/anggota` kini 6 pengguna. Tidak ada
role baru dan tidak ada "Tukang".

## 14. Isolasi harness uji

- `check:u4-access` menulis akun Guest uji sementara ke `src/data/mock.ts` dan **selalu memulihkannya** (`finally` + handler
  `exit`). Diverifikasi: `git diff` dan `git diff --cached` pada `mock.ts` kosong sebelum M7 dan setelah setiap run.
- Skrip browser memakai port dev server dan CDP masing-masing; dijalankan **satu per satu**, tidak paralel.
- `check:u4-project-members` mengganti persona dengan satu login UI per muat ulang dokumen (lihat §18 butir 4).
- **Perbaikan race hidrasi `check:u4-access` (M7, `5670102`).** Gejala run 1/2 (18/201 dan 31/201 gagal, log
  `u4-7/m7/u4-access.log`, `u4-access-run2.log`): login tertahan di `/masuk`, lalu semua pemeriksaan persona itu berjalan dengan
  fallback Owner demo (perilaku dev `useCurrentUser` tanpa sesi), sehingga kegagalan berantai. Akar (sudah dibuktikan di U4-6 §5
  dan dibuktikan ulang): `fill()` dijalankan setelah `readyState === "complete"` tetapi **sebelum React menghidrasi** form,
  sehingga email hilang dan validasi aplikasi benar menampilkan "Alamat email wajib diisi.". Diagnostik CPU Chrome 6×
  (`m7-final/diagnostic/`): pola lama 1/4 login berhasil, ketiga kegagalan tepat saat `hydratedAtFill=false`; pola baru 4/4.
  Perbaikan: `fillLogin()` menunggu kedua input memiliki props React, mengisi, lalu menunggu prop `value` terkendali React sama
  dengan isian sebelum submit. Tanpa delay statis, tanpa asersi dihapus/diubah, tetap 201 pemeriksaan, login tidak dilewati;
  bila nilai tidak diterima submit tetap dijalankan sehingga asersi login yang ada yang gagal. Tidak ada kode aplikasi yang diubah.

## 15. Verifikasi hook uji production

`window.__PROYEKIN_TEST__` (M6, `b9c1abc`) hanya untuk menguji keadaan stale. `lib/dev-test-hooks.ts` dimuat lewat dynamic import
di dalam cabang `process.env.NODE_ENV === "development"` (`use-mock-store.ts`) dan memeriksa ulang `NODE_ENV`. Tidak ada route,
halaman debug, atau flag `NEXT_PUBLIC`. Bagian G `check:u4-project-members` pada run final M7: build production berhasil;
**387 berkas** `.next/static` + `.next/server` tanpa penanda hook; pada `next start` `window.__PROYEKIN_TEST__` tidak terdefinisi;
`/u4-spike` 404.

## 16. Hasil pengujian M7 (2026-11-13, kode final = `5670102`; output + exit code dibaca)

Log di `docs/u4-evidence/u4-7/m7-final/`. Kode aplikasi pada `5670102` identik dengan `b9c1abc` (M7 hanya mengubah harness).

| Pemeriksaan | Hasil |
|---|---|
| `check:u4-access` | **201/201** pada 3 run berturut-turut (124 s, 93 s, 134 s); `notes` kosong |
| `check:u4-projects` | 261/261 |
| `check:u4-project-detail` | 642/642 |
| `check:u4-project-crud` | 129/129 |
| `check:u4-project-members` | 114/114 (termasuk bagian G production) |
| `check:responsive-lists` | 467/467 |
| `check:u4-components` | 72/72 |
| `check:dynamic-routes` | 28 ok, `failures: []`, EXIT 0 |
| `check:browser` | EXIT 0, `failures: []` |
| `check:login-touch` | tree utama **240/244, 4 gagal (baseline Owner, §17)**; worktree isi commit **244/244** |
| `check:u4-foundation` | 412/412 |
| `check:no-budget` | 22/22 |
| `check:contrast` | 57/57 |
| `check:tokens` | tidak ada warna mentah |
| lint | 0 error, 1 warning lama (`Role` tidak dipakai di `src/data/mock.ts`, sejak sebelum U4-7) |
| typecheck | EXIT 0 |
| build production | EXIT 0 |

Belum dijalankan / tidak berlaku: tidak ada pemeriksaan wajib yang tertinggal.

## 17. Baseline exception

`check:login-touch` gagal 4/244 di tree utama: tautan logo "Proyekin — kembali ke beranda" ukuran desktop **92x40 vs bawaan
91x40** pada `/masuk`, `/daftar`, `/lupa-sandi`, `/reset-sandi` (1280). Bukti:
1. Keempat FAIL identik baris per baris dengan run M7 sebelumnya dan baseline U4-6 (`u4-6/check-login-touch-TREE-UTAMA-dengan-logo-owner.log`).
2. Sumber: perubahan lokal `proyekin/src/components/layout/logo.tsx` milik Owner (`width: "auto"` → `width`), belum di-commit.
3. Kontrol: worktree sementara pada HEAD (logo versi commit) lolos **244/244** (`m7-final/login-touch-WORKTREE-tanpa-logo-owner.log`).
4. U4-7 tidak mengubah `components/layout`, `components/auth`, maupun `app/(auth)` (`git diff 0f970d8 HEAD --stat` kosong).

`logo.tsx` tidak disentuh dan asersi tidak di-rebaseline; rebaseline 91→92 menunggu keputusan Owner saat `logo.tsx` di-commit.

## 18. Keterbatasan yang diketahui (mock/client-side)

1. **Mock, bukan production.** Perubahan tim hanya di memori tab; muat ulang mengembalikan seed. Tidak ada backend, database,
   persistensi, atau otorisasi server.
2. **Guard di klien.** Aturan `access.ts` berjalan di browser; HTML/RSC memuat data seed untuk semua pengunjung; sesi
   `sessionStorage` dapat diubah. Tanpa sesi, mode pengembangan memakai fallback Owner demo.
3. **Dashboard belum mengikuti lingkup proyek** — pekerjaan terpisah *Dashboard Access Correction* (disetujui Owner) setelah
   push U4-7 dan sebelum U4-8; tidak dicampur ke commit U4-7.
4. **Login UI kedua tanpa muat ulang** tertahan di `/masuk` pada `next dev` (terbukti juga untuk Budi tanpa jalur kode U4-7);
   dilaporkan terpisah di M6, belum diselidiki tuntas. Suite memakai satu login UI per muat ulang.
5. Dialog Tetapkan/Ganti setelah `ADMIN_CHANGED` tetap terbuka dengan tombol utama aktif dan teks bantuan pilihan lama; pengguna
   harus menutup dan membuka ulang untuk melihat data terbaru (aman: setiap simpan ditolak ulang, tidak ada perubahan data).
6. `/u4-spike` masih dipakai pengujian (penghapusan tuntas U4-10). Peringatan dev Next.js pada `/proyek/[projectId]` sudah ada
   sejak U4-5.

## 19. Evaluasi visual (tangkapan aktual dari `next dev` saat `check:u4-project-members`, run final M7)

Disimpan di `docs/u4-evidence/u4-7/screens/`. Dilihat langsung: `tim-owner-p001-1280`, `-768`, `-375`, `tim-mandor-p001-375`,
`tim-owner-p003-kosong-1280`, `dialog-tambah-anggota-375`, `dialog-keluarkan-blokir-375`, `dialog-cabut-admin-1280`,
`dialog-tetapkan-stale-1280`. Tangkapan lain di folder disertakan sebagai bukti alur dan tidak dinilai satu per satu.

**Kuat:** baris Admin pertama berlatar Warm Highlight + lencana teks "Penanggung jawab" (status tidak hanya warna); tombol aksi
baris netral (outline) dan penekanan destruktif hanya di dialog konfirmasi (Cabut Admin merah); di 375 tim menjadi kartu dengan
tombol lebar penuh 44px, aksi selalu terlihat (tanpa hover), "Tambah anggota" penuh lebar di atas daftar; 768 dua kolom kartu
tanpa overflow; slot Admin kosong bergaris putus-putus jelas berbeda dari state kosong; dialog blokir menyebut nama, jumlah
tugas, dan "Tidak ada data yang diubah."; Mandor 375 bersih tanpa email dan tanpa kontrol.

**Lemah:** di 375 kartu Admin dengan dua tombol bertumpuk cukup tinggi dan tab Tim p-001 membutuhkan gulir panjang (±2 layar 375×800);
lencana "Penanggung jawab" abu-abu kurang menonjol dibanding lencana role berwarna; di 1280 kolom Peran terlalu lebar sehingga
Aksi terdorong ke kanan; dialog tambah 375 menaruh `DemoDataNotice` sebelum pilihan sehingga kontrol utama berada di tengah
layar; dialog stale (butir 18.5) masih menampilkan teks bantuan pilihan lama. Indikator dev Next.js ("N"/"1 Insight") menutupi
sebagian konten di tangkapan — artefak `next dev`, tidak ada di build production.

## 20. Commit

| Milestone | Commit | Isi |
|---|---|---|
| M0 | — | Baseline (evidence lokal `u4-7/baseline/`, tidak di-commit) |
| M1 | `c7d6b8d` | Seed Admin Kantor kedua Rina Wulandari (U4-O9) |
| M2+M3 | `f4a95b6` | Logika keanggotaan dan Admin principal (`access.ts`, `mock-store.ts`, `labels.ts`) |
| M4 | `4ea5127` | `RecordCard` slot `actions`, `ConfirmDialog` `errorMessage` |
| M5 | `0597723` | UI tab Tim: anggota dan Admin penanggung jawab |
| M6 | `b9c1abc` | Suite `check:u4-project-members` + hook uji khusus development |
| M7 | `5670102` | Harness `check:u4-access` menunggu hidrasi React sebelum mengisi login |
| M8 | commit yang memuat dokumen ini | Evidence dan dokumentasi |

Remote `origin/feat/u4-core-ui` sebelum U4-7: `0f970d8`. Push U4-7 dilakukan Owner lewat `push-proyekin-v3.ps1`.

## 21. Skill yang dipanggil

- Sesi M7–M8 (2026-11-13): `verification-before-completion` dipanggil lewat tool `Skill` sebelum klaim M7; diterapkan dengan
  membaca ulang EXIT dan ringkasan setiap log, meninjau diff harness baris demi baris, memastikan `mock.ts` bersih, dan tidak ada
  file Owner atau Dashboard di commit.
- `code-review` tidak dipanggil untuk perubahan harness M7 (25 baris, hanya skrip uji); fallback: tinjauan `git diff` manual.
- Pemanggilan skill pada sesi M0–M6 tidak dapat diverifikasi dari sesi ini; pesan commit M5 menyebut perbaikan dari code-review.
