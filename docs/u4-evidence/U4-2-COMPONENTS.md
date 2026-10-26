# U4-2 — Komponen UI bersama (hasil: PASS)

Tanggal: 2026-10-25. Branch `feat/u4-core-ui` (setelah U4-1, commit `7bd05f0`). Hanya komponen presentasi dan demonstrasi di `/style-guide` (halaman khusus development, 404 di produksi).
Tidak ada alur bisnis, CRUD, guard, redirect, atau perubahan navigasi/`SessionShell`; `access.ts` tidak dipakai komponen mana pun; tidak ada dependency baru.

## Prinsip platform yang diterapkan
- **Mandor mobile-first (375px)** dan alur tugas **Anggota Tim** nyaman di mobile: varian `touch` (≥44px, font input 16px), kartu tugas satu kolom, grup radio besar, tab bergulir di dalam komponen, dialog konfirmasi bertombol bertumpuk.
- **Owner/Admin desktop-first (1280px)**: ukuran bawaan (`default`) tidak berubah; komponen tetap responsif di 375px.
- Vendor tetap di luar U4 (kelas B). Lima role resmi; tidak ada Tukang.

## Komponen dan props utama

| Komponen (berkas) | Props utama | Catatan |
|---|---|---|
| `Input` (`ui/input.tsx`, diubah) | + `size?: "default" \| "touch"` | `size` kini string (bukan atribut HTML `size`; tidak ada pemakai lama). `default` = U1 persis. |
| `Textarea` (`ui/textarea.tsx`) | `size`, `invalid`, props `<textarea>` | `default`: min 80px, 14px. `touch`: min 112px, 16px. |
| `Select` (`ui/select.tsx`) | `size`, `invalid`, props `<select>`, children `<option>` | Select **native** + ikon panah; `default` 40px/14px, `touch` 44px/16px. |
| `Button` (`button-variants.ts`, diubah) | + `size="touch"` | `min-h-11 min-w-11 px-4 text-base`. Ukuran sm/md/lg/icon tidak berubah. |
| `control-variants.ts` | `controlVariants`, `textareaVariants`, `ControlSize` | Gaya bersama Input/Select/Textarea. |
| `Tabs`, `TabsList`, `TabsTab`, `TabsPanel` (`ui/tabs.tsx`) | props Base UI (`value`/`defaultValue`/`onValueChange`) | Base UI Tabs. Panah memindah + mengaktifkan, Home/End, loop. Daftar tab bergulir di dalam komponen; tab min 44px; indikator aktif `border-brand-700`. |
| `ProgressBar` (`ui/progress-bar.tsx`) | `value` (0–100), `label` (wajib), `showValue?` | Display-only, `role="progressbar"`, nilai dibatasi, tidak menghitung apa pun. |
| `ConfirmDialog` (`ui/confirm-dialog.tsx`) | `trigger?`, `title`, `description`, `confirmLabel`, `cancelLabel?`, `destructive?=true`, `onConfirm`, `open?`, `onOpenChange?`, `children?` | Di atas `Dialog` (focus trap/Esc/fokus kembali oleh Base UI). Destruktif: fokus awal di Batal, tombol merah. Selama `onConfirm` berjalan: tombol dikunci, Esc/X/Batal tidak menutup. Gagal → pesan galat, dialog tetap. **Tidak menghapus data.** |
| `PageHeader` (`ui/page-header.tsx`) | `title`, `description?`, `eyebrow?`, `actions?`, `as?: h1/h2/h3` | Bertumpuk di mobile, sejajar di `md+`. |
| `StatCard` (`ui/stat-card.tsx`) | `icon`, `label`, `value`, `description?`, `tone?: default/danger` | Display-only. Dashboard lama masih memakai kartu lokalnya sendiri (diganti di U4-12). |
| `DemoDataNotice` (`ui/demo-data-notice.tsx`) | `showDeadlineReference?` | Teks: perubahan hanya sementara di memori tab dan hilang saat reload, tidak dikirim ke server. Dengan `showDeadlineReference` menambahkan `DEMO_DATE_NOTICE` (tanggal acuan 21 Maret 2026, bukan hari ini). |
| `DeadlineBadge` (`ui/deadline-badge.tsx`) | `task`, `reference?`, `showDate?`, `showAll?` | Status dari `getDeadlineState` (demo-date.ts), label/nada dari `labels.ts`; **tidak ada logika tenggat kedua**. Tidak dirender untuk tugas selesai/tanpa tenggat kecuali `showAll`. |
| `RadioCardGroup` (`ui/radio-card-group.tsx`) | `legend`, `name`, `options`, `value`, `onValueChange`, `disabled?` | Pola grup radio status: `<fieldset>`+`<legend>`+radio native; seluruh kartu ≥48px adalah target; terpilih = titik + tepi + latar (bukan hanya warna). Presentasi saja. |
| `TaskCard` (`tasks/task-card.tsx`) | `task`, `projectLabel?`, `assigneeName?`, `href?`, `titleAs?` | Pola kartu satu kolom; status, prioritas, `DeadlineBadge`, `ProgressBar`. Dengan `href`, seluruh kartu menjadi satu target (stretched link). Tanpa aksi ubah/hapus/penugasan. |

Tambahan pendukung: `formatDemoDate()` di `lib/demo-date.ts` (format tanggal UTC deterministik, hanya tampilan); pasangan kontras baru di `check:contrast`; demo di `components/style-guide/u4-demos.tsx` (6 bagian baru di `/style-guide`: Kontrol sentuh, Tabs, Progres, Konfirmasi, Pola halaman, Pola mobile).

## Pengujian aktual

| Pemeriksaan | Hasil |
|---|---|
| lint | 0 error (1 warning lama `mock.ts`) |
| typecheck, build | lulus (build default: halaman uji `/u4-spike*` → 404) |
| check:contrast | **57/57** (7 pasangan baru untuk komponen U4-2) |
| check:tokens | 0 warna mentah |
| check:u4-foundation | 183 pemeriksaan lolos (termasuk `formatDemoDate`) |
| check:dynamic-routes | HTTP 7/7, browser 21/21 |
| check:browser (regresi U1–U3) | 0 kegagalan: 53/53 alur, axe 0 pelanggaran (18 auth + 24 app), style-guide axe 0/0/0 dan overflow tidak ada di 375/768/1280 |
| **check:u4-components (baru)** | **62 pemeriksaan lolos** (rincian di bawah; dijalankan 2× berturut-turut, stabil) |
| Regresi tampilan komponen lama | 40 dari 42 screenshot auth/landing/dashboard/proyek/anggota/laporan/dokumen/pengaturan/tugas **identik byte-per-byte** dengan evidence U3. Dua yang berbeda (`tugas-1280`, `tugas-768`) berasal dari perubahan seed TSK-005 di U4-1, bukan U4-2. |

### check:u4-components (`results.json`, `check-u4-components.log`)
- **Bawaan tidak berubah** (terukur): Input 40px/14px; Button sm/md/lg/icon 36/40/48/40px dengan font 14/14/16px; Select 40px/14px; Textarea 80px/14px.
- **Touch terukur**: Input/Select/Textarea ≥44px dan font 16px; Button touch 44px tinggi.
- **Keyboard**:
  - Tabs: ArrowRight (berpindah + mengaktifkan), End, Home, ArrowLeft dari tab pertama (berputar), Tab masuk ke panel.
  - Grup radio: ArrowDown/ArrowUp memilih dan memperbarui hasil; `fieldset`+`legend`+3 radio native.
  - Select native: ArrowDown/ArrowUp mengganti nilai; terhubung label.
  - ConfirmDialog: Enter membuka, fokus awal di "Batal" (destruktif); 8× Tab dan 4× Shift+Tab tetap di dalam dialog; Esc menutup dan fokus kembali ke pemicu; Batal menutup tanpa aksi dan fokus kembali; konfirmasi memunculkan loading (tombol dikunci, Esc tidak menutup), lalu menutup dengan hasil "(simulasi)… Tidak ada data yang berubah" dan fokus kembali; varian non-destruktif memakai tombol utama.
- **Mobile 375px** (`mobile:true`, emulasi sentuh aktif, `maxTouchPoints` 5):
  - Target sentuh ≥44×44px: 5 kontrol di kolom touch (terkecil 106,7×44), 6 tab (55,7×44), 2 pemicu dialog (128,6×44), 6 kontrol pola mobile (341×46; tautan kartu diukur pada kartu penuh).
  - Font input/select/textarea touch 16px. Jarak antar pilihan radio 8px, antar tombol touch 8px. Tidak ada `group-hover`/`peer-hover` pada kontrol penting.
  - 3 kartu tugas satu kolom (kiri dan lebar sama, bertumpuk, tidak melebihi viewport) dan memuat status, prioritas, tenggat (acuan demo), progres.
  - Tab: daftar 725px dalam kotak 343px (bergulir di dalam komponen); mengetuk tab terakhir mengaktifkannya dengan `window.scrollX = 0` dan tanpa overflow halaman.
  - Sentuhan: memilih kartu radio, memfokuskan Input/Select touch dan mengetik, membuka ConfirmDialog, mengetuk Batal dan konfirmasi.
  - Dialog 375px: di dalam viewport, tombol bertumpuk selebar penuh, tinggi 44px.
- **Overflow halaman** 0 di 375 (mobile), 768, 1280, juga setelah seluruh interaksi.
- **axe 0 pelanggaran**: 1280, 768, 375 mobile, 1280 dengan dialog terbuka, 375 dengan dialog terbuka.

Screenshot (`docs/u4-evidence/u4-2/`): `kontrol-sentuh`, `tabs`, `pola-halaman`, `pola-mobile` di 375 dan 1280, `pola-halaman-768`, `konfirmasi-375`, `confirm-dialog-375`, `confirm-dialog-1280`.

## Batasan dan risiko untuk U4-3 dan seterusnya
1. **Popup `<select>` native tidak teruji di headless**: pengujian menyentuh fokus dan keyboard; tampilan popup perangkat sebaiknya dicek manual di ponsel nyata sebelum U4-9.
2. **Fokus setelah ketukan:** setelah mengetuk "Batal" fokus kembali ke pemicu dan teks hasil tidak berubah (diuji; `focusAfterTouchCancel` di `results.json`).
3. **`TaskCard` dengan `href`** memakai stretched link; kontrol aksi di dalam kartu (U4-8/U4-9) harus diberi `relative z-10` agar tidak tertutup lapisan tautan.
4. `Input`/`Select` tidak lagi meneruskan atribut HTML `size` numerik (ditimpa tipe `"default" | "touch"`); belum ada pemakai.
5. `DeadlineBadge` memakai `data-slot="deadline-badge"` (menggantikan `badge`); selektor uji sebaiknya memakai keduanya.
6. Tabs memakai aktivasi otomatis saat fokus; bila panel U4-5 berat, pertimbangkan pemuatan malas per panel.
7. Halaman yang memakai `DeadlineBadge` wajib menampilkan `DemoDataNotice showDeadlineReference`; belum ditegakkan secara otomatis.
8. Komponen belum dipakai halaman bisnis mana pun; dashboard dan halaman lama tidak diubah (selain U4-1). Peta U4-3: navigasi/redirect J2/J5, penyesuaian menu Mandor (Tugas sebagai menu pertama), guard varian B, lalu pembersihan `components/spike`.

## Menjalankan ulang
```
npm run check:u4-components -- <folder-bukti>     # dev server + Chrome (CDP), mobile + sentuh
npm run check:u4-foundation
npm run check:contrast
```
