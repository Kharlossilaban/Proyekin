# U4-6 — CRUD proyek (`/proyek`, `/proyek/[projectId]`)

Tanggal: 2026-11-04 (implementasi) · verifikasi final 2026-11-06 · Branch `feat/u4-core-ui` (dari U4-5 `9b5e8b5`) · Bukti, log, dan tangkapan layar: `docs/u4-evidence/u4-6/`.
Representasi UI di atas data mock, **bukan** otorisasi/keamanan dan **tidak production-ready**. Tanpa kelola anggota atau
penetapan Admin principal (U4-7), tanpa daftar/detail/ubah/buat tugas (U4-8..U4-10), tanpa anggaran (F2), tanpa dependency atau role baru.

## 1. Hasil singkat
- **Tambah proyek** (Owner saja): tombol "Tambah proyek" di daftar → dialog form → kode otomatis berurutan (`PRJ-006`, `PRJ-007`, …),
  progres awal 0, tanpa Admin Kantor penanggung jawab → `router.push` ke detail dengan pesan sukses "(simulasi)".
- **Ubah proyek** (Owner, atau Admin principal proyek itu): tombol di header detail → dialog terisi data awal → simpan → pesan sukses;
  kode, Admin principal, anggota, tugas, dan progres tidak berubah. Hasil langsung terlihat di detail dan daftar.
- **Hapus proyek** (Owner saja): **ATURAN MUTLAK** — ditolak dengan alasan per keterkaitan bila proyek masih memiliki Task,
  ProjectMember, atau Admin principal (`adminId`); tanpa kaskade. Proyek tanpa keterkaitan dihapus lewat konfirmasi, lalu halaman
  menampilkan keadaan "dihapus (simulasi)".
- **Arsip** (`p-005`): tidak ada aksi ubah/hapus untuk siapa pun; store juga menolak mutasi Arsip.
- Data tetap di memori: muat ulang halaman mengembalikan seed (J9); setiap dialog menampilkan `DemoDataNotice`.

## 2. Aturan (satu sumber: `src/lib/access.ts`)
| Fungsi | Aturan |
|---|---|
| `canCreateProject` (ada sejak U4-1) | Owner (J3) |
| `canEditProject` (ada sejak U4-1) | Owner atau Admin principal proyek itu; bukan Arsip (J3, G7) |
| `canDeleteProject` (ada sejak U4-1) | Owner; bukan Arsip |
| `getProjectDeleteBlockers` (**baru**) | Daftar keterkaitan berurutan: `HAS_TASKS` (jumlah tugas), `HAS_MEMBERSHIPS` (jumlah anggota), `IS_ADMIN_PRINCIPAL` |
| `decideDeleteProject` (**baru**) | `ROLE` bila bukan Owner → `ARCHIVED` → penghalang pertama → `ALLOW` |
| `isProjectReadOnly` (**baru**) | Arsip; dipakai tampilan dan store agar tidak ada salinan aturan |

Store (`src/lib/mock-store.ts`) tidak memeriksa role, tetapi menjaga integritas data lewat helper di atas:
`updateProject` mengembalikan `null` untuk Arsip/ID tidak dikenal; `deleteProject` mengembalikan `false` untuk Arsip, ID tidak dikenal,
atau proyek yang masih terkait. Tidak ada penghapusan tugas atau keanggotaan di mana pun.

### Matriks hasil per role (diuji di browser dan `check:u4-foundation`)
| Aksi | Owner (Budi) | Admin Kantor (Siti) | Mandor (Ahmad, Eko) | Anggota Tim (Dewi) | Guest |
|---|---|---|---|---|---|
| Tombol Tambah proyek di daftar | ✓ | ✗ | ✗ | ✗ | tanpa App Shell |
| Ubah proyek | ✓ p-001..p-004 (dan runtime) | ✓ p-001, p-002 (principal) | ✗ | ✗ | ✗ |
| Hapus proyek | ✓ bila tanpa keterkaitan | ✗ | ✗ | ✗ | ✗ |
| Proyek Arsip p-005 | tanpa aksi | (tidak terlihat, G8) | (tidak terlihat) | (tidak terlihat) | ✗ |

Keputusan hapus pada seed (Owner): p-001 `HAS_TASKS` (4 tugas, 3 anggota, Admin Siti), p-002 `HAS_TASKS` (2, 2, Admin Siti),
p-003 `ALLOW`, p-004 `ALLOW`, p-005 `ARCHIVED`. Role lain selalu `ROLE`.

## 3. Validasi form (`src/lib/project-validation.ts`)
Wajib: **Nama proyek** (3–120 karakter) dan **Klien** (≤120). Opsional, boleh kosong (J7): Lokasi (≤160), Tanggal mulai, Tanggal selesai
(tanggal kalender valid; selesai tidak boleh sebelum mulai), Deskripsi (≤1.000). Status hanya Draf, Berjalan, Tertunda, Selesai —
**Arsip tidak dapat dipilih** (J7); bawaan Draf. Teks dirapikan (trim). Galat tertaut lewat `aria-describedby` + `aria-invalid`, fokus
pindah ke galat pertama sesuai urutan tampilan, kontrol dikunci selama menyimpan, kirim ganda dicegah.

## 4. File berubah
**Baru:** `src/components/projects/project-form.tsx`, `project-form-dialog.tsx`, `project-delete-dialog.tsx`, `src/lib/project-validation.ts`,
`src/lib/simulate-latency.ts` (latensi simulasi 300 ms untuk dialog simpan/hapus; bukan jaringan),
`scripts/check-u4-project-crud.mjs`, evidence ini dan `docs/u4-evidence/u4-6/`.
**Diubah:** `src/lib/access.ts` (3 fungsi + 2 tipe baru), `src/lib/mock-store.ts` (`updateProject`, `deleteProject`, `ProjectEditInput`),
`src/lib/labels.ts` (`getProjectDeleteBlockerText`), `src/components/projects/project-detail.tsx` (aksi, pesan sukses, keadaan dihapus),
`src/components/projects/project-list.tsx` (tombol Tambah proyek; `isProjectReadOnly`), `src/components/ui/dialog.tsx` (tombol X 44px di
bawah `lg`, judul diberi ruang), `scripts/check-u4-foundation.mjs`, `scripts/check-u4-project-detail.mjs`, `scripts/check-u4-projects.mjs`,
`package.json` (skrip `check:u4-project-crud`). **Tidak disentuh:** `src/components/layout/logo.tsx` (perubahan milik Owner, belum di-commit),
`SessionShell`, guard, navigasi, `data/mock.ts`, tipe `Project`.

## 5. Hasil pengujian aktual
Semua angka dibaca dari log run final **2026-11-06** (output + `EXIT=` di baris terakhir setiap log di `docs/u4-evidence/u4-6/`).
Dijalankan di **tree utama** (`C:\proyekin_project`, berisi juga `logo.tsx` Owner yang belum di-commit), satu per satu, kecuali disebut lain.

**Statis**
| Pemeriksaan | Hasil | Log |
|---|---|---|
| `lint` | EXIT 0 — 0 error, 1 warning lama (`'Role' is defined but never used` di `src/data/mock.ts`, file tidak diubah U4-6) | `lint.log` |
| `typecheck` | EXIT 0 | `typecheck.log` |
| `build` | EXIT 0 (31 halaman; hanya peringatan multi-lockfile Turbopack yang dibiarkan, CLAUDE.md §6) | `build.log` |
| `check:contrast` | EXIT 0 — 57/57 pasangan lolos | `check-contrast.log` |
| `check:tokens` | EXIT 0 — tidak ada warna mentah | `check-tokens.log` |
| `check:u4-foundation` | EXIT 0 — 328/328 | `check-u4-foundation.log` |
| `check:no-budget` | EXIT 0 — 22/22 | `check-no-budget.log` |

**Browser (dev server + Chrome headless via CDP)**
| Pemeriksaan | Hasil | Log |
|---|---|---|
| `check:u4-project-crud` (uji fitur U4-6) | EXIT 0 — 129/129; 18 tangkapan final ditulis ulang di `u4-6/` | `check-u4-project-crud.log`, `results.json` |
| `check:u4-components` | EXIT 0 — 62/62 | `check-u4-components.log` |
| `check:u4-access` | EXIT 0 — 201/201 pada run ke-3 (run ke-1: 40 gagal, run ke-2: 45 gagal; akar masalah di harness, lihat di bawah) | `check-u4-access.log` |
| `check:u4-projects` | EXIT 0 — 261/261 | `check-u4-projects.log` |
| `check:u4-project-detail` | EXIT 0 — 642/642 | `check-u4-project-detail.log` |
| `check:responsive-lists` | EXIT 0 — 449/449 | `check-responsive-lists.log` |
| `check:dynamic-routes` | EXIT 0 — semua lolos | `check-dynamic-routes.log` |
| `check:browser` | EXIT 0 — `failures: []`, "Semua pemeriksaan lolos" (`mock.ts` dipulihkan; hash SHA-256 sama sebelum/sesudah) | `check-browser.log` |
| `check:login-touch` — **tree utama** dengan `logo.tsx` Owner | **EXIT 1 — 240/244.** 4 gagal, semuanya "ukuran desktop tidak berubah 92x40 (bawaan 91x40)" untuk tautan logo di `/masuk`, `/daftar`, `/lupa-sandi`, `/reset-sandi` 1280 | `check-login-touch-TREE-UTAMA-dengan-logo-owner.log` |
| `check:login-touch` — **worktree `u46wt`** (isi commit U4-6, `logo.tsx` = HEAD) | EXIT 0 — 244/244, logo 91x40 | `check-login-touch-WORKTREE-tanpa-logo-owner.log` |

**Atribusi kegagalan `check:login-touch` di tree utama.** Satu-satunya perbedaan kedua tree adalah `src/components/layout/logo.tsx` milik Owner
(`style={{ height, width: "auto" }}` → `style={{ height, width }}`): lebar tampil berubah dari 91,67px (dibulatkan 91) ke atribut bulat 92.
File itu **tidak ikut commit U4-6**. Asersi tidak dilonggarkan dan baseline tidak diubah — rebaseline 91→92 menunggu keputusan Owner saat
`logo.tsx` di-commit. Catatan: di HEAD, perubahan Owner itu menghilangkan peringatan konsol Next.js "Image … has either width or height
modified, but not the other" (terekam 107× pada satu run `check:u4-project-detail` di HEAD).

**Akar masalah kegagalan `check:u4-access` (run ke-1 dan ke-2) — terbukti, di harness uji, bukan di aplikasi.**
Gejala: login lewat form untuk Siti/Ahmad/Dewi tetap di `/masuk`, lalu semua pemeriksaan sesudahnya berjalan dengan sesi lama.
Bukti: (1) diagnostik terisolasi budi → siti → ahmad berhasil; (2) salinan skrip asli yang diberi instrumen lolos di port 3710 maupun port asli
3500/9666; (3) dengan CPU Chrome diperlambat 6× (CDP `Emulation.setCPUThrottlingRate`), gejala terulang persis: sebelum `fill` tercatat
`hydrated:false`, setelah submit `email:""` dan form menampilkan "Alamat email wajib diisi." — validasi aplikasi bekerja benar.
Akar: `navigate()` di `scripts/check-u4-access.mjs` hanya menunggu `document.readyState === "complete"`, bukan hidrasi React, lalu
`fill()` mengisi DOM sebelum React terhidrasi sehingga nilainya hilang. Run gagal berlangsung 253–270 detik (mesin sedang lambat) vs 87 detik
pada run lolos. Skrip itu tidak diubah U4-6 dan tidak diperbaiki di sini (di luar scope; lihat §9). Kegagalan sementara serupa yang tercatat
di U4-4 ("penyebab belum terbukti") kemungkinan besar berasal dari race yang sama.

Log run gagal disimpan di scratchpad sesi dan tidak dimasukkan ke evidence; log final di atas menggantikan log 2026-11-04.
Log `check-login-touch.log` (2026-11-04, tree utama) usang dan digantikan log TREE-UTAMA di atas.

## 6. Cacat nyata yang ditemukan uji baru dan diperbaiki akarnya
1. **Kirim ganda lolos.** Dua klik dalam satu tick membuat dua proyek (`check:u4-project-crud` → "Timeout: navigasi ke detail proyek baru",
   log `check-u4-project-crud-RED-kirim-ganda.log`). Akar: state `submitting` baru terlihat setelah render. Perbaikan: penjaga `useRef`
   di `project-form-dialog.tsx`.
2. **Label tertaut ke kontrol yang salah** (axe `label-title-only`, log `check-u4-project-crud-RED-id-ganda.log`). Akar: Next.js 16 menyimpan
   halaman sebelumnya tersembunyi di DOM, sehingga dialog tambah di daftar dan dialog ubah di detail memakai `id` yang sama. Perbaikan:
   id per instans form lewat `React.useId()`; fokus galat memakai atribut `name` di dalam form itu sendiri.
3. **Isi tab terdorong ke bawah layar pertama 375px untuk Owner** (`check:u4-project-detail`: kartu tugas pertama 564px > 560px, log
   `check-u4-project-detail-RED-tombol-membungkus.log`). Akar: tombol "Ubah proyek"/"Hapus proyek" membungkus ke baris kedua header.
   Perbaikan: di bawah `sm` label tampil "Ubah"/"Hapus" (nama aksesibel tetap lengkap lewat `sr-only`); kini 512px. Asersi tidak dilonggarkan.
4. **Tombol X `Dialog` 36px** di bawah aturan target sentuh 44px (mobile). Perbaikan di komponen bersama (`design:design-system`):
   44px di bawah `lg`, 36px di `lg` ke atas (ukuran desktop U1 tidak berubah).
5. **Cincin fokus kotak tebal pada judul keadaan "dihapus"** (terlihat di tangkapan 1280). Judul menerima fokus programatik hanya untuk
   pembaca layar; cincin fokus global disembunyikan pada elemen itu saja.
6. **Tangkapan `detail-ahmad-375.png` berisi tampilan Dewi** (ditemukan saat evaluasi visual 2026-11-06: tab "Ringkasan, Tugas (2)" tanpa
   Tim, berbeda dari evidence U4-5 untuk Ahmad). Akar: `shot("detail-ahmad-375")` dipanggil **setelah** loop `[ahmad, dewi]` di
   `check-u4-project-crud.mjs`. Bukan perubahan hak akses (`access.ts` hanya menambah aturan hapus; ekspektasi tab/tugas Ahmad tetap
   diuji dan lolos di `check:u4-project-detail`). Perbaikan: tangkapan diambil di dalam loop saat `key === "ahmad"`; kini menampilkan
   Ahmad: Tugas (4) + tab Tim, tanpa tombol aksi.

## 7. Perubahan asersi uji lama (disengaja, terbatas pada role berhak — bukan dilonggarkan)
- `check-u4-project-detail`: "tanpa tombol di luar tab" → tombol di luar tab **persis** daftar literal per role: Owner = Ubah proyek + Hapus
  proyek (kecuali Arsip), Admin principal = Ubah proyek, Mandor/Anggota Tim = tidak ada. Form/input tetap harus 0 saat dialog tertutup.
- `check-u4-projects`: "tidak ada tombol bisnis di daftar" → **persis** `["Tambah proyek"]` untuk Owner, kosong untuk role lain.
- `check-u4-foundation`: daftar pemakai `access.ts` ditambah dua dialog proyek dan `mock-store.ts`; asersi detail "hanya baca" dipersempit:
  tag kontrol mentah tetap dilarang (kini peka huruf, karena komponen `<Button>` design system dipakai), penulisan store langsung tetap
  dilarang, dan satu-satunya `onClick` adalah dua tombol tutup pesan (daftar literal). 47 pemeriksaan U4-6 baru ditambahkan (281 di U4-5 →
328 pada run final; log RED mutasi dibuat saat versi skrip masih 326 pemeriksaan).

## 8. Evaluasi visual (tangkapan benar-benar dilihat)
**Cakupan yang benar-benar dilihat (2026-11-06):** ke-18 tangkapan dari run `check:u4-project-crud` pukul 20:58 — 1280px (7):
`tambah-dialog`, `tambah-dialog-galat`, `tambah-hasil-detail`, `ubah-dialog`, `hapus-konfirmasi`, `hapus-ditolak`, `hapus-berhasil`;
768px (2): `tambah-dialog`, `hapus-ditolak`; 375px dengan emulasi mobile + sentuh (9): `daftar-owner`, `tambah-dialog-375-atas`/`-bawah`,
`detail-owner`, `ubah-dialog`, `hapus-konfirmasi`, `hapus-ditolak`, `detail-siti`, `detail-ahmad`. Setelah perbaikan cacat §6.6 skrip
dijalankan ulang (21:38) dan menulis ulang ke-18 file; dari set final itu yang dilihat ulang: `detail-ahmad-375`, `hapus-berhasil-1280`,
`ubah-dialog-375` (isi sama dengan run sebelumnya; alur lain deterministik dan tidak berubah). Pembanding: `u4-5/screenshots/`.

**Yang bekerja baik**
- Hierarki dialog jelas: judul → deskripsi singkat → `DemoDataNotice` → field. Wajib ditandai `*`, opsional ditulis "(opsional)", petunjuk
  status ("Status Arsip tidak dapat dipilih") dan batas deskripsi tampil di bawah field. Tombol utama oranye dengan teks charcoal, Batal outline.
- Pesan sukses terlihat dan jujur: "Proyek PRJ-006 berhasil ditambahkan (simulasi)." dan "Perubahan proyek disimpan (simulasi)." (ikon
  centang + tombol tutup) di detail; keadaan setelah hapus: judul "Proyek PRJ-007 dihapus (simulasi)" + penjelasan bahwa proyek kembali
  setelah muat ulang + tautan "Kembali ke daftar proyek"; cincin fokus kotak di judul sudah tidak tampak (§6.5).
- Fokus keyboard terlihat: cincin ganda gelap pada "Nama proyek" saat dialog ubah terbuka (1280, 375) dan pada "Batal" saat konfirmasi
  hapus terbuka (1280) — default aman untuk aksi destruktif; "Mengerti" pada 768.
- Penolakan hapus menyebut tiga penghalang per baris (4 tugas, 3 anggota tim, Admin Kantor: Siti Aminah), menegaskan "Tidak ada data yang
  dihapus", dan syarat agar bisa dihapus; satu tombol "Mengerti".
- Galat validasi: border merah + ikon + teks ("Nama proyek wajib diisi.", "Nama klien wajib diisi.") di bawah field — tidak hanya warna.
- 375px: kontrol dan tombol ≥ 44px, font input 16px, tombol aksi dialog menumpuk selebar penuh; header detail Owner memakai label pendek
  "Ubah"/"Hapus" sehingga tab tetap di layar pertama; Admin principal hanya melihat "Ubah"; Mandor (Ahmad) dan Anggota Tim tanpa tombol aksi.
- 768px: dialog dua kolom muat dengan margin wajar; header detail tidak bertumpuk.

**Kelemahan yang terlihat (dilaporkan apa adanya, belum diubah)**
1. `hapus-berhasil-1280`: setelah judul dan satu paragraf, sisa halaman kosong; langkah berikutnya hanya tautan teks. Fungsional, tetapi
   terasa sepi untuk keadaan akhir sebuah aksi penting.
2. `tambah-dialog-galat-1280` (tinggi 900px): setelah galat muncul, footer Batal/Simpan terpotong di tepi bawah dialog — perlu menggulir di
   dalam dialog. Pada 375px tombol Simpan/Batal berada di akhir form panjang (`tambah-dialog-375-bawah`); footer tidak menempel (sticky).
3. Urutan tombol berbeda per breakpoint: desktop Batal kiri / aksi kanan, mobile aksi di atas / Batal di bawah. Pola umum, tetapi pada
   `hapus-konfirmasi-375` tombol merah "Ya, hapus proyek" berada di posisi paling mudah dijangkau; fokus awal di Batal tidak tampak pada
   mode sentuh. Risiko salah ketuk rendah karena ada konfirmasi terpisah, tetapi layak ditinjau.
4. Field Status sendirian di kolom kiri (1280/768) sehingga kolom kanan kosong — sedikit tidak seimbang.
5. Cincin fokus "Mengerti" tampak di 768 tetapi tidak di 1280 — kemungkinan beda cara membuka dialog dalam skrip (keyboard vs klik);
   belum diverifikasi.
6. Indikator dev Next.js di kiri bawah menutupi sebagian konten di semua tangkapan (hanya mode dev). Pada `ubah-dialog-375` dan
   `hapus-konfirmasi-375` tampil "1 Issue" (merah), pada `detail-siti-375` "1 Insight" — sumbernya peringatan route detail yang sudah ada
   sejak U4-5 (§9).

## 9. Keterbatasan dan risiko
1. **Mock, bukan production.** Semua mutasi di memori tab; tidak ada backend, otorisasi server, atau persistensi. Navigasi/aksi berbasis role
   hanya representasi UI.
2. **`check:login-touch` gagal di tree utama (4/244)** selama `logo.tsx` Owner belum di-commit. Butuh keputusan Owner: commit perubahan
   logo + rebaseline ukuran desktop 91x40 → 92x40, atau pertahankan `width: "auto"`. Tidak dirombak di U4-6.
3. **Harness `check:u4-access` rawan gagal saat mesin lambat** (race hidrasi, §5). Usulan perbaikan terpisah, perlu persetujuan: `navigate()`
   menunggu hidrasi (mis. kunci `__react*` pada `#email` atau atribut penanda) sebelum `fill`. Skrip lain dengan pola `navigate` + `fill`
   yang sama perlu diperiksa.
4. **Peringatan dev Next.js pada `/proyek/[projectId]`** — "Next.js encountered URL data during prerendering or a navigation" (`params`
   diakses di luar `<Suspense>`, `cacheComponents: true`) dan kadang "Could not validate `instant`…". Terbukti **sudah ada di HEAD U4-5**:
   perekaman konsol `check:u4-project-detail` di worktree sementara pada HEAD menghasilkan pesan yang sama (2 run; "Could not validate"
   muncul pada run ke-2, bergantung timing). `page.tsx` tidak diubah U4-6. Tidak menggagalkan uji apa pun; dampaknya navigasi ke detail
   mungkin tidak instan. Perbaikan (`<Suspense>` atau `export const instant = false`) mengubah perilaku route → ajukan terpisah.
5. `/u4-spike` masih dipakai pengujian; penghapusan tuntas direncanakan di U4-10.
6. Warning lint lama di `src/data/mock.ts` (`Role` tidak dipakai) — tidak diubah U4-6 (`data/mock.ts` sengaja tidak disentuh).
7. **Temuan `code-review` medium final (2026-11-06), belum diperbaiki — tidak terjangkau atau tidak memblokir pada alur saat ini:**
   a. `project-delete-dialog.tsx`: bila hapus ditolak di jalur konfirmasi, alasan spesifik (mis. `HAS_TASKS`) dibuang dan pengguna melihat
      "Aksi gagal diproses. Coba lagi." Hanya terjadi bila store berubah selama latensi 300 ms (tidak mungkin di mock satu tab); relevan saat backend.
   b. `project-delete-dialog.tsx`: dialog konfirmasi vs ditolak ditentukan ulang setiap render; perubahan store saat dialog terbuka menukar
      dialog dan membuang state sibuk. Tidak terjangkau sekarang; relevan untuk U4-7/U4-9.
   c. `project-detail.tsx`: keadaan "dihapus" diturunkan dari `lastSeen` (bukan dari `onDeleted`, yang belum disambungkan). Salah tampil hanya
      bila proyek hilang dari store bukan karena hapus atau instance dipakai ulang untuk ID lain — tidak ada jalur UI seperti itu sekarang.
   d. `project-form.tsx`: petunjuk "Proyek baru dimulai dari Draf." ambigu — Draf hanya bawaan, status lain (kecuali Arsip) boleh dipilih dan
      disimpan (§3). Usulan copy: "Bawaan Draf. Status Arsip tidak dapat dipilih."
   e. `project-detail.tsx`: banner "berhasil ditambahkan" dipicu `?dibuat=1` di URL apa pun dan tampil lagi saat tombol Back.
   f. Kebersihan: `decideDeleteProject` mengulang aturan Owner + bukan Arsip dari `canDeleteProject` (keduanya di `access.ts`); dialog hapus
      membaca store/aktor sendiri padahal induk sudah punya; cabang mati Arsip→Draf di `toValues`; dua salinan workaround fokus
      `outline: none` inline.
8. Sengaja tidak ikut commit U4-6: `src/components/layout/logo.tsx` dan dua PNG desain di `Proyekin (1)/` (milik Owner), serta
   `docs/PROMPT-HISTORY-VERBATIM.md` dan `docs/PROYEKIN-MASTER-DEVELOPMENT-PLAN.md` (dokumentasi di luar scope U4-6).

## 10. Skill yang dipanggil
- **Sesi implementasi 2026-11-04 (menurut catatan sesi itu; tidak dapat diverifikasi ulang dari sesi ini):** `design:ux-copy`,
  `design:accessibility-review`, `design:design-system` (audit tombol X `Dialog`), `code-review` (medium, tanpa `--fix`/`--comment`),
  `verification-before-completion`.
- **Sesi verifikasi final 2026-11-06 (dipanggil lewat tool `Skill` di sesi ini):** `verification-before-completion` (seluruh suite dijalankan
  ulang; klaim hanya dari output + exit code), `systematic-debugging` (akar masalah `check:u4-access`, atribusi "1 Issue" ke U4-5, cacat
  tangkapan §6.6), `code-review` medium tanpa `--fix`/`--comment` (9 temuan, §9.7).

## 11. Status
**PASS WITH NOTES.** Semua uji wajib lolos pada isi commit (tree utama untuk semua uji; `check:login-touch` lolos 244/244 di worktree tanpa
`logo.tsx` Owner). Catatan: §5 (login-touch tree utama 4/244 karena file Owner; `check:u4-access` lolos pada run ke-3 setelah akar race
harness dibuktikan), §8 (kelemahan visual), §9 (risiko dan temuan review).
