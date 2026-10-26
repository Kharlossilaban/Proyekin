# U4-4 — Halaman Daftar Proyek `/proyek` (hasil: PASS)

Tanggal: 2026-10-26. Branch `feat/u4-core-ui`, di atas follow-up U4-3 (`20a36e7`). Commit U4-3 tidak diubah.
Semua yang dibahas adalah **representasi UI di atas data mock**: bukan otorisasi, bukan kontrol keamanan, dan **tidak production-ready**. Penegakan akses sesungguhnya ada di backend (U3-B1, U3-B2). U4-4 hanya DAFTAR proyek: tanpa detail final (U4-5), CRUD (U4-6), atau kelola anggota (U4-7). Tidak ada dependency baru, tidak ada backend baru, `SessionShell`, redirect, dan guard U4-3 tidak diubah, tidak ada role baru (lima role resmi; tidak ada Tukang), tidak ada Vendor.

## Housekeeping logo (sebelum U4-4)
- Logo aktif aplikasi tetap `proyekin/public/logo-proyekin.jpeg` (dipakai `components/layout/logo.tsx`). `logo-proyekin_1.svg` tidak punya referensi di kode (hanya disebut di dokumentasi sebagai aset yang tidak boleh dipakai, U3-L1).
- SVG dipindahkan (bukan dihapus) ke `C:\proyekin-assets-backup\logo-proyekin_1.svg` di luar repository. Tidak ada benturan nama. File JPEG dan UI tidak diubah.
- `deep-research-report.md` (root) diperiksa read-only: satu-satunya selisih adalah newline akhir file pada baris terakhir (isi teks identik). Tidak di-restore, tidak di-stage, tidak di-commit.

## Yang dikerjakan
| Berkas | Perubahan |
|---|---|
| `src/components/projects/project-list.tsx` (baru) | Komponen klien `ProjectList`: `useCurrentUser` + `useMockStore` → `getVisibleProjects(user, store)` (`access.ts`, G8). Tidak ada aturan role di komponen. |
| `src/app/(app)/proyek/page.tsx` | Halaman server tipis (metadata + `<ProjectList />`); menggantikan daftar lama yang memuat seluruh `MOCK_PROJECTS`. |
| `scripts/check-u4-projects.mjs` + `package.json` | Pemeriksaan browser baru `npm run check:u4-projects` (205 pemeriksaan). |
| `scripts/check-u4-foundation.mjs` | Satu entri ditambahkan ke daftar pemakai `access.ts` yang diizinkan (`components/projects/project-list.tsx`). Asersi tidak dilonggarkan: daftar tetap persis dan pemeriksaan "tidak ada salinan literal role di luar berkas sumber" tetap utuh. |

## Tampilan dan informasi
- **Header:** judul `Proyek` + ringkasan "N proyek dalam lingkup akses Anda." (`PageHeader`), lalu `DemoDataNotice` (menjelaskan perubahan hanya di memori tab, hilang saat reload, tidak ada data ke server).
- **Informasi per proyek (hanya yang ada di data mock):** kode, nama, klien, status (label + titik dari `labels.ts`, tidak hanya warna), periode (`formatDemoDate`, mulai–selesai), lokasi, progres (`ProgressBar`). Proyek Arsip diberi penanda **Hanya baca** (G7; teks `DENY_REASON_LABELS.ARCHIVED` sebagai tooltip).
- **Mobile (< lg, mobile-first):** kartu satu kolom (dua kolom di 768). Seluruh kartu adalah satu tautan ke `/proyek/[id]` (judul sebagai tautan + `after:absolute after:inset-0`); chevron tampil permanen, tidak ada aksi hover-only.
- **Desktop (>= lg):** tabel (Proyek, Klien, Status, Periode, Progres) dengan tautan pada nama proyek. Hanya satu dari dua tampilan yang terlihat pada satu waktu.
- **State kosong:** "Belum ada proyek yang dapat Anda akses" + penjelasan; tanpa kartu/baris/tautan detail, ringkasan "0 proyek".
- **Loading:** sebelum sesi diketahui, komponen tidak menghitung atau merender data proyek (skeleton). HTML prerender `/proyek` kini **tidak memuat nama proyek** (diuji); sebelumnya halaman ini memuat seluruh proyek di HTML.
- **Sengaja tidak ada:** tombol tambah/ubah/hapus, filter/pencarian (di luar lingkup dan belum ada fungsinya), dan **anggaran** (`budget`). Alasan anggaran: belum ada keputusan siapa boleh melihat angka keuangan proyek, dan membuat aturan role baru di halaman akan menduplikasi matriks `access.ts`. Keputusan itu dibawa ke U4-5.

## Matriks teruji (`results.json`, `check-u4-projects.log`)
Daftar yang tampil (1280, 768, dan 375 `mobile:true` + sentuhan memberi daftar identik). ✓ = tampil, – = tidak tampil.

| Persona | p-001 | p-002 | p-003 | p-004 | p-005 (Arsip) | Aturan |
|---|---|---|---|---|---|---|
| Budi (Owner) | ✓ | ✓ | ✓ | ✓ | ✓ Hanya baca | semua proyek |
| Siti (Admin Kantor) | ✓ | ✓ | – | – | – | Admin principal saja (G8) |
| Ahmad (Mandor) | ✓ | ✓ | – | – | – | anggota proyek |
| Eko (Mandor) | ✓ | ✓ | – | – | – | anggota proyek |
| Dewi (Anggota Tim) | ✓ | – | – | – | – | anggota proyek |
| Guest (akun uji sementara) | /proyek → `/akses-ditolak`; daftar/state kosong tidak pernah terlihat (MutationObserver); tanpa sidebar | | | | | tanpa App Shell |
| Tanpa sesi (mode pengembangan) | Owner demo: ✓ ✓ ✓ ✓ ✓ | | | | | perilaku U3 |

Proyek runtime (dibuat di memori lewat `/u4-spike`, tanpa `adminId` dan tanpa anggota), dibuka lewat navigasi klien tanpa muat ulang: **Budi melihat p-006** (baris memuat nama, klien, status Draf; klik → detail p-006); **Siti, Ahmad, dan Dewi tidak melihatnya** (daftar tetap sesuai lingkup).
State kosong (akun uji sementara di `mock.ts`, selalu dipulihkan): Admin Kantor, Mandor, dan Anggota Tim tanpa proyek di 1280 dan 375 mobile → state kosong, tanpa kartu/baris/tautan, axe 0, tanpa overflow.
Navigasi: klik baris (1280) dan ketuk kartu (375, sentuhan) membuka `/proyek/[id]` lewat navigasi klien tanpa muat ulang untuk seluruh persona.

## Bukti mobile-first Mandor (375px, `mobile:true` + emulasi sentuh)
- Alur penuh Ahmad: login (ketuk) → `/tugas` → drawer → Proyek → daftar (2 kartu) → ketuk kartu p-002 → detail, tanpa muat ulang dokumen (`ahmad-alur-proyek-375.png`).
- Satu kolom: semua kartu `left=16, width=343` (tidak melewati viewport 375).
- Setiap kartu 343×224 sampai 343×248 (>= 44px); lima titik uji di dalam kartu (empat sudut dan tengah) semuanya jatuh pada tautan kartu itu → seluruh kartu adalah target sentuh, bukan hanya teks judul; diketuk di area kartu (bukan judul) → membuka detail.
- Tautan utama permanen terlihat (opacity/visibility), tanpa tombol bisnis di daftar. Overflow horizontal 0 di 375, 768, dan 1280. Anggota Tim (Dewi), Admin, dan Owner juga diuji 375 `mobile:true`.

## Hasil pengujian aktual
| Pemeriksaan | Hasil |
|---|---|
| `npm run lint` | 0 error; 1 warning lama (`data/mock.ts` import `Role`, sudah tercatat) |
| `npm run typecheck` | lolos |
| `npm run build` | lolos (`/proyek` prerender statis; detail dinamis tidak berubah) |
| `check:contrast` | 57/57 |
| `check:tokens` | tidak ada warna mentah |
| `check:u4-foundation` | 213/213 (satu asersi pemakai `access.ts` diperbarui, lihat di atas) |
| `check:u4-components` | 62/62 |
| `check:u4-access` | 201/201 (dua kali berturut-turut; lihat catatan flaky) |
| `check:dynamic-routes` | 28/28 (7 HTTP build produksi + 21 browser) |
| `check:browser` | 54/54, axe 0 pada seluruh 42 titik ukur |
| `check:u4-projects` (baru) | 205/205: lingkup per role, runtime, state kosong, navigasi, prerender tanpa data, 1280/768/375, sentuhan, axe 0 |

Tidak ada asersi lama yang dihapus atau dilonggarkan. Screenshot: `docs/u4-evidence/u4-4/*.png` (indikator "N" di pojok adalah indikator dev server Next.js).

## Catatan jujur
- **Satu kegagalan sementara pada regresi pertama:** `check:u4-access` sekali berhenti di login ketuk Mandor 375px ("tidak ada: Buka navigasi", sebelum halaman `/proyek` tersentuh). Tidak terulang: dua kali jalan ulang `check:u4-access` setelahnya masing-masing 201/201. Dugaan: waktu kompilasi dev server saat login ketuk; **belum terbukti**. Pantau di U4-5.
- Kegagalan `check:u4-foundation` pada regresi pertama adalah asersi daftar pemakai `access.ts` yang belum mengenal komponen baru; sudah diperbarui (di atas) dan lolos.
- HTML/RSC halaman lain tetap memuat data seed untuk semua pengunjung (keterbatasan U3-B2); daftar `/proyek` kini tidak memuat data proyek di HTML awal, tetapi data seed tetap ada di bundel klien. Tetap bukan keamanan.
- `check:u4-projects` memakai halaman uji `/u4-spike` (sementara, dev-only) untuk membuat proyek runtime; ikut dihapus di U4-6/U4-10.

## Catatan untuk U4-5
1. **Anggaran:** perlu keputusan pemilik siapa boleh melihat `budget` sebelum ditampilkan di detail atau daftar.
2. Detail `/proyek/[id]` masih placeholder U4-3; tautan dari daftar sudah siap (`<Link>`). Mandor/Anggota hanya baca (J5).
3. Proyek Arsip hanya diberi penanda "Hanya baca"; aksi ubah/hapus baru ada di U4-6 dan harus memakai `canEditProject`/`canDeleteProject`.
4. Daftar `/tugas` masih memuat seluruh tugas (U4-8).
5. Filter/pencarian daftar proyek belum ada; ditambah hanya bila disetujui.
