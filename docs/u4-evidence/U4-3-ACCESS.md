# U4-3 — Navigasi, redirect login per role, dan guard URL (hasil: PASS)

Tanggal: 2026-10-25. Branch `feat/u4-core-ui` (setelah U4-2, `555648d`).
Semua yang dibahas di sini adalah **representasi UI di atas data mock**: bukan autentikasi, bukan otorisasi, bukan kontrol keamanan. Penegakan akses sesungguhnya wajib ada di server/backend (backlog U3-B1, U3-B2). Tidak ada dependency baru, tidak ada halaman bisnis baru (U4-4 sampai U4-12 belum dimulai), dan `SessionShell` **tidak diubah** (dibuktikan oleh pemeriksaan `git diff` terhadap `d3d9516`).

## Yang dikerjakan

| Area | Perubahan |
|---|---|
| Satu sumber aturan | `lib/access.ts`: `canAccessSection(actor, section)` untuk 7 bagian aplikasi, `getPostLoginPath(role)`, dan tipe `AppSection`. Aturan Laporan/Pengaturan/Proyek/Tugas/Dokumen **dipindahkan tanpa perubahan nilai** dari `navigation.ts` (U2); Dashboard dan Anggota mengikuti J2/J4/J5/G2. |
| Navigasi | `lib/navigation.ts`: `NavItem` kini memuat `section` (bukan daftar role). `getNavForUser(user)` memfilter lewat `canAccessSection` dan menempatkan halaman awal role sebagai menu pertama. `getSectionForPath(path)` memetakan URL ke bagian. `getNavForRole` dihapus (satu pemakai: `app-shell.tsx`). |
| Redirect login | `login-form.tsx` memakai `getPostLoginPath(role)`: Owner/Admin → `/dashboard`, Mandor/Anggota Tim → `/tugas`, Guest → `/akses-ditolak`. |
| Guard URL | `components/auth/path-guard.tsx` (bungkus `children` di `(app)/layout.tsx`, bagian ditentukan dari path) memakai `AccessGuard`. |
| Guard detail | `components/auth/access-guard.tsx`: pola "menyembunyikan" dari U4-0 (`children` selalu dirender; `hidden` + `inert` sampai sesi diketahui dan aturan terpenuhi; tidak berhak → `router.replace("/akses-ditolak")`). Detail proyek/tugas memanggil `canViewProject`/`canViewTask` dengan data store (termasuk ID runtime). |
| Detail dinamis | `components/spike/entity-probe.tsx` → `components/detail/entity-detail-placeholders.tsx` (isi sementara + guard; atribut `data-detail`), `spike-not-found.tsx` → `components/detail/detail-not-found.tsx`. ID tidak ada → `not-found`; ID ada tetapi di luar lingkup → `/akses-ditolak`. |
| Cacat U2 diperbaiki | (1) `z-sticky` dan `z-modal` tidak pernah didefinisikan sehingga tidak menghasilkan `z-index`: tabel ber-`relative` menimpa drawer mobile di `/tugas` (halaman awal Mandor/Anggota). Kini didefinisikan sebagai `@utility` di `globals.css` (30 dan 50). (2) `<aside role="dialog">` pada drawer melanggar axe `aria-allowed-role` saat drawer terbuka; kini `<div>` (tanpa efek visual). |

Tidak ada salinan matriks role di komponen/halaman: pemeriksaan `check:u4-foundation` memindai `src` dan memastikan literal role hanya ada di `access.ts`, `roles.ts`, `labels.ts`, `data/mock.ts`, `types/index.ts`, dan `session-shell.tsx` (U3, tidak diubah).

## Matriks yang benar-benar teruji (`results.json`, 171 pemeriksaan `check:u4-access`)

Hasil: ✓ = halaman tampil, ✗ = dialihkan ke `/akses-ditolak` dan konten terlindung **tidak pernah terlihat** (diamati dengan MutationObserver, bukan hanya status akhir), "nf" = state not-found.

### Redirect login dan menu (desktop 1280 dan mobile 375 untuk Mandor/Anggota)
| Persona | Login → | Menu (urutan) |
|---|---|---|
| Budi (Owner) | `/dashboard` | Dashboard, Proyek, Tugas, Laporan, Dokumen, Anggota, Pengaturan |
| Siti (Admin Kantor) | `/dashboard` | sama seperti Owner |
| Ahmad (Mandor) | `/tugas` | **Tugas**, Proyek, Laporan, Dokumen |
| Dewi (Anggota Tim) | `/tugas` | **Tugas**, Proyek, Dokumen |
| Guest (akun uji sementara) | `/akses-ditolak` | tanpa App Shell; tidak ada sidebar di DOM; landing publik tanpa sidebar |
| Mode pengembangan (tanpa sesi) | tetap Owner demo (U3) | menu lengkap Owner |

### URL langsung dan navigasi klien ke bagian aplikasi
| Bagian | Budi | Siti | Ahmad | Dewi |
|---|---|---|---|---|
| `/dashboard` | ✓ | ✓ | ✗ | ✗ |
| `/anggota` | ✓ | ✓ | ✗ | ✗ |
| `/laporan` | ✓ | ✓ | ✓ | ✗ |
| `/pengaturan` | ✓ | ✓ | ✗ | ✗ |
| `/proyek`, `/tugas`, `/dokumen` | ✓ | ✓ | ✓ | ✓ |

Hasil URL langsung (dokumen baru) dan navigasi klien (tanpa muat ulang dokumen, penanda `window` bertahan) identik. Guest ditolak di `/dashboard`, `/anggota`, `/proyek/p-001`, `/tugas/t-001`.

### Detail proyek (URL langsung)
| ID | Budi | Siti | Ahmad | Dewi |
|---|---|---|---|---|
| p-001, p-002 | ✓ | ✓ | ✓ | p-001 ✓; p-002 ✗ |
| p-003, p-004, p-005 | ✓ | ✗ | ✗ | ✗ |
| p-999 (tidak dikenal) | nf | nf | nf | nf |

### Detail tugas (URL langsung)
| ID | Budi | Siti | Ahmad | Dewi |
|---|---|---|---|---|
| t-001 … t-006 | semua ✓ | semua ✓ (Admin principal PRJ-001/002) | semua ✓ (G5: Mandor melihat semua tugas proyek tempatnya menjadi anggota) | hanya t-002 dan t-006 ✓ (J5: miliknya); sisanya ✗ |
| t-999 (tidak dikenal) | nf | nf | nf | nf |

### ID runtime (dibuat di memori lewat halaman uji, dibuka dengan navigasi klien)
| Kasus | Hasil |
|---|---|
| Budi: proyek runtime `p-006`, tugas runtime `t-007` | ✓ |
| Siti: proyek runtime (belum ada Admin principal) | ✗ |
| Siti: tugas runtime di p-001 (Admin principal p-001) | ✓ |
| Ahmad: proyek runtime (bukan anggota) | ✗ |
| Ahmad: tugas runtime di p-001 (anggota p-001, G5) | ✓ |
| Dewi: tugas runtime tanpa penanggung jawab | ✗ |
| Budi: reload pada ID runtime | not-found (store memori ter-reset, J9) |

Navigasi klien ke detail untuk Dewi (p-001 ✓, p-002 ✗, t-002 ✓, t-001 ✗, p-999 nf), Siti (p-001 ✓, p-003 ✗), dan Ahmad (p-002 ✓, p-004 ✗, t-003 ✓) juga teruji.

### Mobile 375px (`mobile:true`, emulasi sentuh) untuk Ahmad dan Dewi
- Login dengan ketukan diarahkan ke `/tugas`; drawer dibuka dengan ketukan dan berisi menu persis seperti tabel di atas (Tugas pertama; tanpa Dashboard/Anggota/Pengaturan); ketuk menu Proyek menavigasi tanpa muat ulang dan menutup drawer.
- URL langsung `/dashboard` → akses ditolak (konten tidak pernah terlihat); detail milik sendiri tampil; tanpa overflow; axe 0 (halaman awal, drawer terbuka, detail).
- Susunan lapisan: drawer di atas tabel halaman (3 titik uji `true`) dan header sticky tetap di atas konten saat digulir. Tanpa perbaikan z-index, uji drawer gagal (`[false,false,false]`), jadi uji ini memang menangkap cacatnya.
- 768px: `/tugas` (Ahmad) dan `/dashboard` (Budi) tanpa overflow dan axe 0.

## Perubahan ekspektasi pengujian U3 (disengaja, J2)
`scripts/browser-check.mjs`:
1. `loginUi(email, password, landing)` menerima tujuan login; alur Mandor kini mengharapkan `/tugas` (sebelumnya `/dashboard`).
2. Asersi menu Mandor ditambah: menu **persis** Tugas, Proyek, Laporan, Dokumen. Asersi lama (Laporan ada, Pengaturan tidak ada) tetap, tidak dilonggarkan.
3. Jumlah alur 53 → **54**.

`scripts/check-dynamic-routes.mjs` (dimigrasikan, tidak dilonggarkan):
- Selektor `data-spike="found"/"not-found"` → `data-detail="found"/"not-found"` mengikuti perpindahan komponen.
- Bagian guard dipindahkan dari halaman eksperimen `/u4-spike/guard-*` ke route nyata `/dashboard` dan `/anggota`: tanpa sesi (Owner demo) tampil; Mandor URL langsung dialihkan dan konten tidak pernah terlihat; navigasi klien Mandor dialihkan; Owner navigasi klien diizinkan. Ditambah dua asersi HTTP baru (lihat keterbatasan). Asersi "Guard A (menahan)" dihapus karena varian itu tidak lagi ada (dibandingkan dan ditolak di U4-0).
- Seluruh pembuktian seed ID, ID runtime, not-found, URL langsung, reload tetap ada: HTTP 7/7, browser 21/21.

`scripts/check-u4-foundation.mjs`: asersi U4-1 "access.ts belum diimpor siapa pun" diganti asersi yang lebih ketat (daftar pemakai yang diizinkan dan tidak ada salinan literal role); ditambah matriks 7 bagian × 7 persona, urutan menu, tujuan login, pemetaan path, dan pemeriksaan `SessionShell` tidak berubah (201 pemeriksaan).

## Status cleanup artefak spike
| Artefak | Status |
|---|---|
| `components/spike/route-guard.tsx`, `app/(app)/u4-spike/guard-gating`, `guard-hidden` | **Dihapus** (eksperimen selesai; pola B menjadi `AccessGuard`) |
| `components/spike/entity-probe.tsx`, `spike-not-found.tsx` | **Dimigrasikan** ke `components/detail/` (menjadi isi detail sementara + guard) |
| `components/spike/spike-controls.tsx`, `app/(app)/u4-spike/page.tsx`, `lib/u4-spike-gate.ts` | **Dipertahankan sementara**: satu-satunya cara membuat ID runtime dan menguji navigasi klien (dipakai `check:dynamic-routes` dan `check:u4-access`). Hanya ada di development atau build `U4_SPIKE=1`; build biasa menghasilkan 404 (diverifikasi). Dihapus saat alur buat proyek/tugas sungguhan ada (U4-6/U4-10) dan pengujian dipindahkan. |

## Keterbatasan guard mock dan risiko kebocoran (WAJIB dipahami)
1. **HTML dan payload RSC tetap memuat data seed untuk semua pengunjung.** `hidden`/`inert` hanya menyembunyikan secara visual. Terukur: HTML prerender `/dashboard` dan `/anggota` memuat teks halaman di markup, dibungkus `data-guard-status="pending" hidden` dengan placeholder (asersi HTTP di `check:dynamic-routes`). Data terbaca lewat inspeksi HTML, tab Network, atau saat JavaScript dimatikan. **Jangan menyebut ini aman.**
2. **Sesi hanya `sessionStorage`** yang dapat diubah siapa saja; semua keputusan akses berjalan di klien.
3. **Daftar `/proyek`, `/tugas` (dan Dashboard) belum dibatasi per lingkup**: Mandor/Anggota yang membuka `/tugas` masih melihat seluruh 6 tugas seed. Pembatasan lingkup daftar dikerjakan di U4-4 (proyek) dan U4-8 (tugas). Detail sudah dibatasi (di atas).
4. **Kilasan konten** dicegah sejauh arsitektur mock mengizinkan: konten tersembunyi sejak HTML awal (status `pending`) dan tidak pernah terlihat sebelum aturan terpenuhi (diamati pada URL langsung dan navigasi klien). Sebelum JavaScript aktif pengunjung melihat placeholder, bukan konten.
5. Tidak ada solusi keamanan semu yang ditambahkan; rute tetap diprerender (`○`/`◐`), dan pola `children` selalu dirender dipertahankan (pelajaran d8cd209).
6. Backlog backend: pemeriksaan sesi di server untuk route aplikasi (U3-B2), otorisasi per endpoint (U3-B1), dan pembatasan data per lingkup di API, sehingga data yang tidak berhak tidak pernah dikirim.

## Temuan lain untuk audit
- **Target sentuh drawer (bawaan U2) di bawah 44px:** tautan menu 264×36px dan tombol tutup/keluar 40px. Tidak diubah di U4-3 karena akan mengubah ukuran komponen U2; dicatat sebagai catatan di `results.json`. Disarankan keputusan pemilik: tambahkan `min-h-11` hanya pada drawer mobile (prinsip Mandor mobile-first) sebagai langkah terpisah.
- **Screenshot lama:** perbaikan z-index mengubah anti-aliasing teks pada beberapa screenshot U3: 375px ±50 piksel (selisih ≤2/255), `dashboard-768` pada tepi huruf tabel (delta ≤89/255, layout identik). `tugas-*` berubah karena seed TSK-005 (U4-1). 35 dari 42 screenshot tetap identik byte-per-byte.
- Pengujian 2 dari 5 persona memakai email demo U3 yang ada; Guest memakai akun uji sementara di `mock.ts` yang selalu dipulihkan (status Git `mock.ts` bersih setelah uji).

## Pengujian aktual
| Pemeriksaan | Hasil |
|---|---|
| lint | 0 error (1 warning lama `mock.ts`) |
| typecheck, build | lulus (31 halaman; `/u4-spike` 404 di build biasa) |
| check:contrast / check:tokens | 57/57 / 0 warna mentah |
| check:u4-foundation | 201 pemeriksaan lolos (+ uji mutasi: perluasan hak Mandor dan salinan role di navigasi terdeteksi) |
| check:u4-components | 62 lolos |
| check:dynamic-routes (produksi) | HTTP 7/7, browser 21/21 |
| **check:u4-access** (baru) | **171 lolos** (+ uji mutasi: `PathGuard` "izinkan semua" → 16 kegagalan; tanpa perbaikan z-index → uji drawer gagal) |
| check:browser (regresi U1–U3) | 0 kegagalan: 54/54 alur, axe 0 (18 auth + 24 app + style-guide 0/0/0), 0 overflow |
| Ukuran default U1–U3 | tidak diubah (uji ukuran di `check:u4-components` lulus; ukuran drawer U2 tidak diubah) |

## Menjalankan ulang
```
npm run check:u4-access -- <folder-bukti>     # dev server + Chrome (CDP); persona, 375 mobile + sentuh
npm run check:u4-foundation
npm run check:dynamic-routes -- <folder>      # build produksi U4_SPIKE=1
npm run build                                 # setelahnya, build biasa
```
Catatan lingkungan: setelah route dihapus/dipindah, folder `.next` (ter-ignore) dapat menyimpan tipe hasil generate lama sehingga `typecheck` gagal; hapus `.next` lalu build ulang.
