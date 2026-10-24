# U4-0 — Spike route dinamis (hasil: PASS)

Tanggal: 2026-10-25. Branch `feat/u4-core-ui`. Next.js 16.4.2 dengan `cacheComponents: true` dan `partialPrefetching: true` (konfigurasi tidak diubah).
Spike ini hanya membuktikan mekanisme. UI-nya minimal dan **bukan desain final U4**; tidak ada CRUD, tidak ada aturan akses U4, dan `SessionShell` tidak disentuh.

## Pertanyaan dan jawaban

| Pertanyaan | Jawaban | Bukti |
|---|---|---|
| ID seed (`p-001`, `t-001`, dst.) dapat dibuka? | **Ya.** Diprerender saat build lewat `generateStaticParams`; HTML sudah memuat isi halaman. | `results.json` (`http`, `browser`) dan `seed-proyek-p-001-1280.png` |
| ID yang dibuat saat runtime di memori klien dapat dibuka lewat navigasi klien? | **Ya**, lewat `router.push`, klik `<Link>`, dan tombol back/forward; tanpa muat ulang dokumen (penanda `window` bertahan). | `results.json` + `runtime-proyek-p-006-1280.png` |
| ID tidak dikenal menampilkan not-found yang benar? | **Ya**, lewat URL langsung maupun navigasi klien (komponen `not-found.tsx` di segmen). | `not-found-p-999-1280.png`, `not-found-after-reload-375.png` |
| Guard halaman dan prerender bekerja tanpa regresi d8cd209? | **Ya, dengan syarat**: pakai varian B (lihat bagian Guard). | `results.json` (`guardHtml`) |

Hasil pengujian aktual:
- Produksi (`next start` pada build `U4_SPIKE=1`): HTTP 7/7, browser 20/20.
- Mode dev (`--dev`, hanya bagian browser): 20/20 (`results-dev.json`).
- Regresi U1–U3 pada build default: lint (0 error, 1 warning lama), typecheck, build, check:contrast 50/50, check:tokens, check:browser 53/53 alur, axe 0 pelanggaran (18 tampilan auth + 24 tampilan app), 0 overflow.

## Pendekatan yang berhasil

1. **Halaman server tipis** `src/app/(app)/proyek/[projectId]/page.tsx` dan `tugas/[taskId]/page.tsx`:
   `generateStaticParams()` mengembalikan ID dari seed (`MOCK_*`), lalu `const { id } = await params` dan meneruskan `id` ke komponen klien. Tidak ada `Suspense` khusus karena `generateStaticParams` memberikan sampel param.
2. **Komponen klien** (`components/spike/entity-probe.tsx`) membaca store memori lewat `useSyncExternalStore`. Snapshot server selalu berisi seed (referensi stabil), sehingga HTML prerender dan hidrasi konsisten. Entitas tidak ada → `notFound()` dari `next/navigation` (boleh dipanggil di komponen klien), yang dirender oleh `not-found.tsx` segmen.
3. **Store memori** (`lib/u4-spike-store.ts`): `createSpikeProject()` dan `createSpikeTask()` menghasilkan ID berikutnya (`p-006`, `t-007`). Hanya hidup di tab; reset saat reload (keputusan J9).
4. **Halaman uji** `/u4-spike`, `/u4-spike/guard-gating`, `/u4-spike/guard-hidden` hanya aktif saat development atau build dengan `U4_SPIKE=1`; pada build biasa menghasilkan 404 (diverifikasi: status prerender 404).

Alasan tidak memakai opsi lain:
- Tanpa `generateStaticParams`, param bersifat runtime dan seluruh isi harus dibungkus `Suspense`; ID seed tidak ikut diprerender.
- `dynamicParams` **tidak tersedia** saat Cache Components aktif (dokumentasi Next), jadi "daftar ID tertutup" tidak bisa dipakai; ID tidak dikenal harus ditangani di komponen.
- `generateStaticParams` wajib mengembalikan minimal satu param di bawah Cache Components. Seed selalu berisi data, jadi aman.

## Perilaku yang perlu diketahui (keterbatasan)

1. **Direct URL dan reload untuk ID runtime selalu not-found.** Store ada di memori tab (J9). Mengetik URL, memuat ulang, atau membuka tab baru ke `/proyek/p-006` memberi state not-found. Teks not-found sudah menjelaskan hal ini. ID runtime hanya bisa dicapai lewat navigasi klien dalam sesi halaman yang sama.
2. **Server tidak pernah tahu ID runtime**, jadi `notFound()` tidak bisa dipanggil dari server untuk ID yang valid-tetapi-belum-ada. Not-found diputuskan di klien.
3. **Status HTTP ID tidak dikenal tidak konsisten:** permintaan pertama **200** (shell parsial dialirkan, `noindex` disisipkan Next), permintaan berulang **404** dengan `cache-control: s-maxage=31536000` (salinan tersimpan). Lokasi penyimpanan tidak saya telusuri (tidak ada file baru di `.next/server/app/proyek`). Untuk mock ini tidak berdampak; di backend, status harus ditentukan server dari data nyata dan jangan men-cache 404 setahun.
4. **UI not-found untuk ID tidak dikenal dirender di klien**, bukan di markup HTML (diukur: tidak ada teks "tidak ditemukan" di markup). Tanpa JavaScript, halaman kosong. Dapat diterima untuk aplikasi internal berbasis mock.
5. **Konten seed ada di HTML prerender** (termasuk nama proyek), sama untuk semua pengunjung. Ini konsekuensi U3-B2 yang sudah dicatat: bukan kontrol akses.
6. React `Activity` menyimpan halaman sebelumnya tersembunyi di DOM. Pemeriksaan visibilitas di uji memakai `checkVisibility()`, dan tes tidak boleh mengandalkan `querySelector` saja (hindari ID DOM ganda; lihat backlog U3-U1).
7. Halaman detail spike ini belum menegakkan lingkup per role. Bagian itu dikerjakan di U4-3 sampai U4-9. Semua yang tampil tetap data demo.

## Guard halaman dan prerender (pola d8cd209)

Dua varian diuji pada halaman statis dengan konten penanda; keduanya hanya mengizinkan Owner dan Admin Kantor (khusus uji guard, **bukan** matriks akses U4):

| | A. Menahan (`GatingGuard`) | B. Menyembunyikan (`HiddenGuard`) |
|---|---|---|
| Cara kerja | `children` tidak dirender sampai sesi diketahui dan diizinkan | `children` selalu dirender, dibungkus `hidden` + `inert` sampai diizinkan |
| Konten di markup HTML prerender | **Tidak ada** (hanya skeleton) | Ada (bertanda `hidden`) |
| Konten di payload RSC | Ada | Ada |
| Owner demo / Owner bersesi | Tampil | Tampil |
| Mandor (URL langsung dan navigasi klien) | Dialihkan ke `/akses-ditolak`, konten tidak pernah terlihat | Sama |

Reproduksi pola d8cd209 (eksperimen sementara, sudah dihapus dan tidak di-commit): layout yang menahan `children` memberi hasil prerender yang sama dengan varian A. Konten halaman tetap ada di payload RSC dan file `__PAGE__.segment.rsc` untuk ID seed, tetapi **hilang dari markup HTML** (tanpa `<h1>`). Gejala "segmen halaman terbuang" yang tertulis di commit d8cd209 tidak saya reproduksi secara harfiah di artefak build; yang terukur adalah hilangnya konten dari HTML prerender.

Kesimpulan: guard apa pun yang menahan `children` meniadakan konten dari HTML prerender, dan itulah pola yang dibatalkan di d8cd209. **Rekomendasi untuk U4-3: pakai varian B** (konten tetap dirender dan hanya disembunyikan) atau guard yang hanya mengalihkan tanpa menahan. Varian A tetap berfungsi secara fungsional di level halaman, tetapi menyalahi prinsip "children selalu dirender".

Semua guard di sini **bukan kontrol keamanan**: sesi hanya `sessionStorage`, dan HTML prerender sama untuk semua pengunjung. Penegakan akses sesungguhnya ada di server (backlog U3-B1 dan U3-B2).

## Implikasi untuk U4-1 sampai U4-12

- **U4-1:** ganti `u4-spike-store.ts` dengan `mock-store.ts` (model data lengkap, fungsi async). Pertahankan pola: snapshot server = seed dengan referensi stabil, mutasi hanya di klien. ID runtime: nomor berikutnya dari isi store (sudah terbukti di spike).
- **U4-3:** pindahkan varian B ke komponen guard nyata, lalu hapus `components/spike/route-guard.tsx` dan halaman `/u4-spike/guard-*`. Guard hanya untuk merapikan tampilan, dengan komentar "bukan keamanan".
- **U4-4, U4-5, U4-8, U4-9:** ikuti pola halaman server tipis + komponen klien + `generateStaticParams` dari seed + `not-found.tsx` segmen. Ganti teks not-found sesuai bahasa produk dan tambahkan aksi kembali sesuai role. Tautan ke detail dari daftar harus memakai `<Link>` agar navigasi klien terjadi.
- **U4-6, U4-10:** setelah membuat entitas, arahkan ke detail lewat `router.push` (bukan `redirect` server). Pesan sukses menyebut "(simulasi)"; teks `DemoDataNotice` menjelaskan bahwa reload menghapus data (J9).
- **U4-12:** tes browser U4 harus memakai navigasi klien untuk ID runtime; tes yang membuka ID runtime lewat URL langsung selalu mengharapkan not-found. Pertimbangkan merapikan helper CDP yang kini terduplikasi di `browser-check.mjs` dan `check-dynamic-routes.mjs`.
- **Backlog:** validasi bentuk ID di server (mis. `^p-\d+$` lalu `notFound()` untuk bentuk yang salah) dapat memberi not-found server-side untuk ID tidak lazim. Belum diuji, jadi tidak dipakai di spike.
- **Spike artefak yang harus dibersihkan di U4-1/U4-3:** `lib/u4-spike-store.ts`, `lib/u4-spike-gate.ts`, `components/spike/*`, halaman `app/(app)/u4-spike/*`, dan `check:dynamic-routes` bila tidak lagi relevan. Dua halaman dinamis dan `not-found.tsx` adalah rute nyata yang akan dikembangkan.

## Menjalankan ulang

```
npm run check:dynamic-routes -- <folder-bukti>          # build U4_SPIKE=1 + next start + Chrome (produksi)
node scripts/check-dynamic-routes.mjs <folder> --dev    # hanya bagian browser, next dev
npm run build                                           # setelahnya, agar build lokal tidak memuat halaman uji
```
