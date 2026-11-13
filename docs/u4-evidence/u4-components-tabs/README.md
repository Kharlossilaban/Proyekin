# Stabilisasi tes Tabs di `check:u4-components` (commit khusus tes)

Status: **PASS** (2026-11-13). Hanya `proyekin/scripts/check-u4-components.mjs` yang berubah; tidak ada kode aplikasi.

## Temuan

Saat suite final Dashboard Access Correction (`dashboard-access/m1/final/u4-components.log`), satu pemeriksaan gagal sekali:
`tabs: ArrowRight memindah dan mengaktifkan tab berikutnya` (detail `Tugas`); lolos 3/3 saat diulang.

## Penyebab (terbukti dengan diagnostik)

`pressKey` kembali saat event CDP terkirim, bukan saat DOM selesai berubah. ArrowRight memindahkan fokus, lalu `activateOnFocus`
(`components/ui/tabs.tsx`) mengubah tab terpilih lewat state React. **Panel berganti setelah tab**: sesaat tab sudah `Tugas`,
tetapi dua panel masih terlihat dan `panel()[0]` adalah panel lama ("Ringkasan"). Asersi membaca `sel()` lalu `panel()[0]`
segera setelah tombol, sehingga kadang menangkap keadaan peralihan itu.

Bukti (`diagnostic/`, skrip `diag-tabs-race.mjs` dan `diag-tabs-pattern.mjs`, `next dev` + Chrome CDP):

| Pengukuran | Hasil |
|---|---|
| Pembacaan langsung setelah ArrowRight, throttle CPU 1×, 20 percobaan | 10 menangkap keadaan lama (`sel` = Tugas, 2 panel terlihat, `panel()[0]` tidak memuat "Tugas") |
| Waktu sampai tab + panel konsisten | paling lama 26 ms (1×), 55 ms (6×) |
| Pola LAMA dengan urutan round-trip harness, 1×, 40 percobaan | **11 gagal dari 40** |
| Pola BARU (tunggu keadaan lalu asersi yang sama), 1×, 40 percobaan | **0 gagal dari 40** |
| Ulang dengan penantian atomik final (`diag-tabs-pattern-atomik.log`), 1×, 2 × 40 | lama **13/40** dan **13/40** gagal; baru **0/40** dan **0/40** |
| Throttle 4× dan 6× | 0 untuk kedua pola: balapan ini **tidak monoton** terhadap beban CPU (round-trip CDP ikut melambat) |

## Perbaikan

Blok A3 ("keyboard Tabs"): setelah tiap `pressKey` (ArrowRight, End, Home, ArrowLeft) harness memanggil
`settleTab(expected)`, yaitu `waitFor` berbasis kondisi (maks. 5 detik, polling 150 ms) sampai **tab terpilih = tab tujuan DAN tepat
satu panel terlihat**, dibaca dalam **satu evaluasi atomik** (`tabState()`). Aturan:
- Penantian tidak pernah melempar dan tidak pernah meloloskan asersi; asersi aslinya tetap dievaluasi dan gagal bila keadaan
  tidak tercapai. Bila timeout, keadaan terakhir dicatat ke log (`CATATAN: ...`) dan `results.measurements.tabsSettleTimeouts`.
  **Mutation test** (`diagnostic/mutation-test-harness.log`): pada salinan harness dengan ekspektasi tab yang tidak pernah ada,
  keluar `CATATAN` (`selected: Tugas`, 1 panel) dan `FAIL: tabs: ArrowRight ...`, "1 masalah dari 72". Bug nyata tetap tertangkap.
- Dua panel sesaat adalah perilaku rancangan Base UI (`TabsPanel` memakai `useTransitionStatus`; panel yang keluar tetap ter-mount
  selama transisi keluar), bukan bug komponen kita. Tes sengaja menoleransinya dan tidak pernah menguji ketiadaannya.
- Langkah `Tab` terakhir sengaja **tidak** diberi penantian: probe `diagnostic/diag-tabs-tabkey.mjs` menunjukkan 0 dari 40 gagal
  pada throttle 1× dan 4× walau fokus dibaca segera (pemindahan fokus adalah aksi bawaan tombol, selesai saat perintah CDP kembali).
- Tidak ada delay statis; tidak ada asersi dihapus atau diubah syaratnya. Satu perubahan kecil: `panel()[0].includes(...)` menjadi
  `panel()[0]?.includes(...) === true` agar panel kosong menghasilkan FAIL, bukan crash `TypeError` pada seluruh skrip.
- Jumlah pemeriksaan tetap 72 dan daftar nama pemeriksaan identik dengan baseline.

## Hasil (output + exit code dibaca, kode final)

| Pemeriksaan | Hasil |
|---|---|
| `check:u4-components` (suite penuh) × 5 | 72/72 pada kelimanya (`u4-components-run1..5.log`) |
| `check:responsive-lists` | 467/467 |
| `check:browser` (termasuk axe) | lolos, `failures: []` |
| `check:u4-project-detail` (memakai Tabs juga) | **run pertama crash**, lalu 642/642 pada dua run ulang (lihat catatan) |
| lint / typecheck | 0 error (1 warning lama di `mock.ts`) / EXIT 0 |

Urutan: `responsive-lists`, `browser`, dan `u4-project-detail` dijalankan pada kode aplikasi yang sama dengan commit akhir (tidak ada
kode aplikasi yang berubah); setelah itu hanya `check-u4-components.mjs` yang disempurnakan (temuan review), lalu suite penuhnya
diulang 5× pada versi final (tabel di atas).

Aksesibilitas: axe berjalan di `check:u4-components` (termasuk dialog terbuka), `check:browser`, dan `check:u4-project-detail`; semuanya 0 pelanggaran.

**Catatan jujur:** run pertama `check:u4-project-detail` pada sesi ini berhenti dengan `Timeout: mock termutasi termuat`
(`u4-project-detail-GAGAL-timeout-mock-termutasi.log`, 175 detik, 634 pemeriksaan sudah lolos sebelum crash). Itu timeout menunggu
dev server memuat `mock.ts` yang dimutasi sementara (bagian F), bukan kegagalan asersi dan bukan area yang disentuh perubahan ini.
`mock.ts` ternyata sudah dipulihkan dan tidak ada proses sisa. Dua run ulang lolos 642/642 dalam ±60 detik. Penyebab pastinya
**tidak terbukti** (dugaan: dev server lambat mengompilasi ulang); dicatat sebagai keterbatasan lingkungan harness yang sama jenisnya
dengan race hidrasi U4-7.

## Hasil `code-review` (medium, tanpa `--fix`/`--comment`)

8 temuan. Diterapkan: log saat timeout (#2) dan satu evaluasi atomik (#6). Ditolak dengan bukti: penantian di langkah `Tab` (#5,
0/40 gagal tanpa penantian). Dijelaskan: toleransi dua panel (#1, perilaku Base UI). Dicatat sebagai keterbatasan, bukan diubah:
asersi ArrowRight berbasis substring dan End/Home/ArrowLeft yang hanya memeriksa tab terpilih (#3, #4) adalah cakupan lama; menambah
asersi mengubah jumlah pemeriksaan (72) dan di luar scope commit khusus stabilisasi ini. Dua temuan `logo.tsx` (#7, #8) mengenai file
milik Owner yang tidak disentuh.

## Keterbatasan

- Cakupan tab lama tidak diperluas: End, Home, dan ArrowLeft hanya memeriksa tab terpilih (bukan panelnya), dan ArrowRight mencocokkan
  teks panel secara substring.
- Pola "tekan tombol lalu baca DOM segera" yang sama ada di blok radio, select, dan ConfirmDialog (`check-u4-components.mjs`,
  A4–A6) dan di `check-u4-project-detail.mjs` (memakai `sleep(200)`). Tidak ada kegagalan yang teramati di sana, jadi tidak diubah
  di sini; bila muncul, polanya sama dengan `settleTab`.
