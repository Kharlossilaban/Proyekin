# U4-5 — Detail proyek `/proyek/[projectId]` (READ-ONLY): PASS

Tanggal: 2026-10-28 · Branch `feat/u4-core-ui` (baseline `69100ef`) · Bukti, log, dan screenshot: `docs/u4-evidence/u4-5/`.

Representasi UI di atas data mock: **bukan** otorisasi atau kontrol keamanan dan **tidak production-ready** (HTML/RSC halaman tetap memuat data seed untuk semua pengunjung; sesi hanya `sessionStorage`; penegakan sesungguhnya di backend, U3-B1/B2). Halaman ini **hanya baca**: tanpa CRUD proyek (U4-6), tanpa tambah/keluarkan anggota (U4-7), tanpa daftar tugas global (U4-8), tanpa detail/ubah/buat tugas (U4-9/U4-10), tanpa Dokumen (U5). Tanpa dependency, role, atau backend baru. Tanpa field, nominal, atau statistik anggaran (F2).

## 1. Hasil singkat

Halaman placeholder diganti halaman detail yang membaca `mock-store`, relasi data, dan `access.ts`. Isi:

- **Header:** tautan "Daftar proyek" (target sentuh ≥ 44px), kode, nama, klien, status (label + titik), dan penanda "Hanya baca" untuk proyek Arsip (dengan catatan "Proyek berstatus Arsip bersifat hanya baca.").
- **Tab Ringkasan:** informasi proyek (kode, status, klien, lokasi, periode, Admin Kantor penanggung jawab, deskripsi, progres) dan ringkasan tugas **dalam lingkup pengguna** (total, dalam progres, selesai, terlambat terhadap tanggal acuan demo).
- **Tab Tugas (n):** tugas proyek dalam lingkup; di bawah `lg` kartu (`TaskCard`, satu kolom di 375, dua kolom di 768), mulai `lg` tabel. Nama penanggung jawab dari **relasi `User`**, bukan salinan `Task.assigneeName`. Tenggat memakai `DeadlineBadge` terhadap **21 Maret 2026** dengan keterangan langsung di tab dan `DemoDataNotice` sebagai catatan kaki.
- **Tab Tim (Owner, Admin principal, Mandor):** Admin principal lalu anggota; peran dengan label terpusat; kolom/baris **email hanya untuk Owner dan Admin** (Mandor: nama dan peran saja).
- **State:** loading (skeleton, sebelum sesi diketahui), tugas/tim kosong, not-found (`h1` "Proyek tidak ditemukan"), dan denied (dialihkan ke `/akses-ditolak` oleh `AccessGuard`, tanpa konten sempat terlihat).

## 2. Aturan akses (satu sumber: `access.ts`)

Fungsi baru (komponen tidak menulis aturan role): `canViewProjectTeam` (tab Tim: Owner, Admin principal, Mandor anggota; **Anggota Tim tidak**, J5), `getVisibleProjectTasks` (tugas per proyek dalam lingkup, G5/J5/G8), `seesOnlyOwnTasks` (penjelasan lingkup di UI). Akses halaman tetap `canViewProject` via `AccessGuard`; email memakai `canViewOrgUsers` (J4). Tidak ada hak yang diperluas dan tidak ada perubahan pada fungsi izin yang sudah ada.

### Matriks hasil per role (diuji URL langsung dan navigasi klien)
| Persona | Proyek yang terbuka | Di luar lingkup | Tab | Tugas yang tampil | Tim |
|---|---|---|---|---|---|
| Owner (Budi) | p-001 s.d. p-005 (termasuk Arsip p-005, hanya baca) | — | Ringkasan, Tugas, Tim | semua tugas proyek | nama, peran, **email** |
| Admin Kantor (Siti) | p-001, p-002 (Admin principal, G8) | p-003, p-004, p-005 → ditolak | Ringkasan, Tugas, Tim | semua tugas proyek | nama, peran, **email** |
| Mandor (Ahmad, Eko) | p-001, p-002 (anggota) | p-003, p-004, p-005 → ditolak | Ringkasan, Tugas, Tim | semua tugas proyek (G5) | nama dan peran, **tanpa email** |
| Anggota Tim (Dewi) | p-001 (anggota) | p-002 s.d. p-005 → ditolak | Ringkasan, Tugas (**tanpa Tim**; panel Tim tidak ada di DOM) | **hanya miliknya** (TSK-002, TSK-006) | tidak ada |
| Guest (akun uji sementara) | tidak ada | semua → ditolak, tanpa App Shell | — | — | — |

Tanpa sesi (mode pengembangan) memakai Owner demo. Proyek runtime (`p-006`) dan tugas runtime muncul lewat navigasi klien (mock-store); URL langsung ke ID runtime tetap not-found (keterbatasan U4-0, didokumentasikan).

## 3. File berubah
Baru: `src/components/projects/project-detail.tsx`, `src/lib/project-relations.ts` (tim, nama dari relasi `User`, periode; tanpa aturan izin), `scripts/check-u4-project-detail.mjs`.
Diubah: `src/lib/access.ts` (+16 baris, 3 fungsi baru), `src/app/(app)/proyek/[projectId]/page.tsx`, `src/components/detail/entity-detail-placeholders.tsx` (placeholder proyek dihapus; placeholder tugas U4-9 tidak diubah), `src/components/detail/detail-not-found.tsx` dan `src/components/ui/empty-state.tsx` (prop `titleAs`, default `h3`; not-found memakai `h1`), `src/components/projects/project-list.tsx` (memakai `formatProjectPeriod` bersama), `scripts/check-u4-foundation.mjs`, `package.json` (`check:u4-project-detail`).
Tidak disentuh: logo, Dashboard, `/tugas`, `/anggota`, `SessionShell`, guard, mock data, label.

## 4. Hasil pengujian aktual
Setiap perintah dijalankan sendiri (foreground, satu per satu), output dan exit code dibaca; log di `docs/u4-evidence/u4-5/`.

| Pemeriksaan | Hasil |
|---|---|
| `lint` | exit 0; 0 error, 1 warning lama (`Role` tak terpakai di `mock.ts`) |
| `typecheck` | exit 0 |
| `build` (normal; diulang sesudah `dynamic-routes`) | exit 0 |
| `check:contrast` / `check:tokens` | 57/57 / tidak ada warna mentah |
| `check:no-budget` | **22/22** (tidak diperlonggar) |
| `check:u4-foundation` | **281/281** (213 lama + 68 baru; satu entri ditambahkan pada daftar pemakai `access.ts`: `components/projects/project-detail.tsx`; tidak ada asersi dihapus atau dilonggarkan) |
| `check:u4-project-detail` (baru) | **642/642** (59 axe 0 di tiap tab/viewport, 58 overflow 0, 52 pemeriksaan mobile 375, 33 pemeriksaan 768) |
| `check:u4-projects` | 261/261 |
| `check:u4-components` | 62/62 |
| `check:u4-access` | 201/201 |
| `check:responsive-lists` | 449/449 |
| `check:login-touch` | 244/244 |
| `check:browser` | 54 flow, 0 gagal; axe 0 di 42 titik ukur; 0 overflow |
| `check:dynamic-routes` | 28/28 |

Tidak ada proses sisa setelah suite selesai (diverifikasi); `mock.ts` tidak berubah setelah pengujian (akun uji sementara dipulihkan).

### Uji merah-hijau (regresi dimasukkan, harus gagal, lalu dipulihkan dengan bukti hash)
| Mutasi | Hasil |
|---|---|
| Anggota Tim melihat tab Tim (`access.ts`) | `check:u4-foundation` gagal (1) |
| Tugas proyek tanpa pemeriksaan lingkup (`access.ts`) | gagal (9) |
| Nama assignee dari salinan legacy `Task.assigneeName` (komponen) | gagal (1) |
| Tombol aksi ditambahkan di detail (komponen) | gagal (1) |
| Email selalu tampil dan tab Tim untuk semua role (komponen) | `check:u4-project-detail` **gagal 21 dari 642** (`check-u4-project-detail-RED-mutasi.log`) |

### Cacat nyata yang ditemukan uji baru dan diperbaiki akarnya
1. **Not-found tanpa `h1`** (axe `page-has-heading-one`, cacat lama dari U4-0): `EmptyState` kini punya prop `titleAs` (default `h3`, pemakai lain tidak berubah) dan not-found memakainya sebagai `h1` (berlaku juga untuk not-found tugas).
2. **Tabel Tugas 1280 terpotong** di kanan (persen progres tak terlihat): lebar kolom disesuaikan; kini muat penuh (scroll = client = 974px). Dijaga asersi baru untuk tabel tugas dan tim.
3. **Catatan "Data demo" di atas mendorong isi tab ke bawah layar pertama di 375px**: dipindah menjadi catatan kaki (tetap selalu tampil) dengan keterangan acuan tenggat singkat di tab Tugas. Dijaga asersi: kartu tugas pertama mulai di atas 560px dari 800px (terukur 490px) dan notice berada setelah tab.
Tiga kegagalan lain pada run pertama adalah asersi uji yang salah (kolom Email diharapkan pada state tim kosong); diperbaiki di uji dengan syarat yang benar, bukan dengan melonggarkan.

## 5. Evaluasi visual (screenshot benar-benar dilihat)
Berkas: `docs/u4-evidence/u4-5/screenshots/`. **Dilihat:** Owner 1280 (Ringkasan, Tugas, Tim, setelah perbaikan untuk Tugas), Mandor 375 (Ringkasan, Tugas, Tim), Anggota Tim 375 (Tugas, Ringkasan), Owner 768 (Tugas), Arsip 1280 dan 375, tim kosong 1280, not-found 1280. **Tidak dilihat satu per satu:** Admin 1280 (lainnya sama komponen; DOM, overflow, dan axe-nya diuji), Anggota Tim 1280, Owner 375 selain yang disebut, guest.

- **Baik:** hierarki jelas (tautan kembali, kode/nama/klien, tab, panel); status label + titik; Terlambat/Mendatang berlabel teks; tab 44px; kartu satu kolom di 375 dan dua kolom di 768 sejajar; tabel 1280 muat penuh; state Arsip, tim kosong, dan not-found jelas; tanpa hover-only.
- **Kelemahan (tidak diperbaiki, dicatat):**
  - Ringkasan di 375px adalah satu kolom panjang; **Kode dan Status diulang** karena sudah ada di header.
  - Ringkasan tugas di desktop berada di bawah lipatan layar (perlu gulir).
  - Catatan kaki "Data demo" pada Ringkasan desktop juga di bawah lipatan; konteks acuan tenggat tetap tampil di tab Tugas.
  - Pilihan tab tidak tersimpan di URL (kembali ke Ringkasan saat berpindah halaman).
  - Indikator "N" Next.js di sudut kiri bawah pada screenshot adalah indikator dev server.

## 6. Keputusan implementasi (celah spesifikasi; mohon dikoreksi bila keliru)
- Admin principal tampil di tab Tim untuk semua role yang melihat tab itu, dengan lencana "Penanggung jawab".
- Mandor melihat **semua** tugas proyeknya, termasuk milik Mandor lain (G5 yang sudah ada di `access.ts`), sedangkan Anggota Tim hanya miliknya.
- Tidak ada tautan ke detail tugas (halaman detail tugas masih placeholder; ditambah di U4-8/U4-9).
- Ringkasan tugas selalu dihitung dari tugas dalam lingkup pengguna (Anggota Tim: "Ringkasan tugas Anda").
- Catatan "Data demo" dipindah ke bawah isi halaman (berbeda dari `/proyek` yang menaruhnya di atas); konsistensi penempatan dapat diseragamkan di U4-12.

## 7. Backlog U4-12 (dicatat sesuai instruksi; tidak diubah)
- Dashboard Admin Kantor menampilkan semua proyek (belum dilingkup per role, G8).
- Tabel Dashboard di 375px tergulir horizontal tanpa petunjuk (kolom Status dan Progres tersembunyi); gunakan kartu responsif di bawah `lg`.

## 8. Risiko untuk U4-6 (CRUD proyek)
1. **Detail akan menerima aksi ubah/hapus** (via slot `actions` `PageHeader` + `canEditProject`/`canDeleteProject`, `ConfirmDialog`). Asersi "tanpa tombol di luar tab" di `check-u4-project-detail` dan di foundation (read-only) harus diubah **sengaja dan terbatas pada role berhak**, bukan dilonggarkan.
2. **`/u4-spike` masih dipakai** `check-u4-project-detail` (membuat proyek/tugas runtime dan navigasi klien ke proyek di luar lingkup), `check-u4-access`, `check-u4-projects`, dan `check:dynamic-routes`. Penghapusannya menuntut memindahkan seluruh uji ini ke alur nyata tanpa melonggarkan asersi.
3. **Hapus proyek yang masih punya tugas/anggota** belum punya aturan (U4-O2, OPEN); detail dan daftar harus konsisten setelah proyek terhapus (ID jadi not-found, runtime hanya di memori).
4. **Penempatan penetapan Admin principal** (U4-6 atau U4-7, U4-O3) memengaruhi header dan tab Tim.
5. Daftar pemakai `access.ts` di `check-u4-foundation` perlu satu entri lagi bila form proyek memakai fungsi izin.
6. Form harus tetap tanpa field anggaran (`check:no-budget`).

## 9. Skill yang dipanggil pada tahap ini
`verification-before-completion` (sebelum klaim selesai dan commit). `code-review` tidak dipanggil ulang pada tahap ini karena panggilan sebelumnya (cleanup anggaran) berhenti tanpa keluaran; sebagai gantinya `git diff` ditinjau manual dan perubahan dibuktikan lewat uji merah-hijau (§4). Skill `design:*` tidak dipanggil: komponen yang dipakai sudah ada (U4-2), tidak ada token atau komponen bersama baru kecuali prop opsional `titleAs`; pemeriksaan manual `CLAUDE.md` §8C dijalankan (token, kontras, axe 0, target sentuh, evaluasi visual 375/768/1280).
