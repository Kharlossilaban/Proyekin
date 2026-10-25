# U4-3 follow-up — target sentuh drawer mobile dan audit G8 akses detail tugas (hasil: PASS)

Tanggal: 2026-10-25. Branch `feat/u4-core-ui`, di atas U4-3 (`06fc2df`). Commit U4-3 tidak diubah. U4-4 belum dimulai.
Seperti U4-3, semua yang dibahas adalah representasi UI di atas data mock, bukan otorisasi.

## 1. Target sentuh drawer mobile (disetujui pemilik)

| Kontrol | Sebelum | Sesudah | Cara |
|---|---|---|---|
| Tautan menu drawer | 36px | 44px | `min-h-11` hanya saat dirender di drawer (`renderNav(true)`) |
| Tutup navigasi | 40x40 | 44x44 | `className="size-11"` pada instance; ukuran `icon` bawaan tidak diubah |
| Keluar (di drawer) | 36px | 44px | `size="touch"` (ukuran yang sudah ada sejak U4-2) hanya di drawer |
| Buka navigasi (header, `lg:hidden`) | 40x40 | 44x44 | `className="size-11 lg:hidden"` pada instance |

Tidak berubah: ukuran bawaan `Button` (`sm/md/lg/icon`), sidebar dan header desktop, perilaku U1-U3. Pengujian desktop membuktikan tautan 36px, Keluar 36px, dan tombol Buka navigasi tersembunyi untuk keempat persona.

Dicakup `check:u4-access` (Mandor dan Anggota Tim, 375px `mobile:true` + sentuh): ukuran seluruh kontrol drawer >= 44x44 (kini asersi, bukan catatan), tautan tidak saling menimpa, ketuk, keyboard (Enter membuka drawer, Tab melewati menu sesuai urutan lalu Keluar, fokus terlihat, Enter pada tautan menavigasi dan menutup drawer), axe 0 saat drawer terbuka, drawer di atas konten (z-index), dan tanpa overflow.

## 2. Audit G8: akses detail tugas oleh Admin Kantor

Temuan: **tidak ada bug.** `canViewTask` untuk `ADMIN` memanggil `isAdminPrincipal(actor, project)`, yaitu `role === ADMIN` DAN `project.adminId` terisi DAN sama dengan `actor.id`. `access.ts` tidak diubah.
Hasil "Siti melihat semua tugas seed" memang karena distribusi seed: seluruh enam tugas seed berada di p-001/p-002, dan keduanya punya `adminId = u-002` (kini dijaga asersi `check:u4-foundation`). p-003 sampai p-005 tidak punya tugas seed dan tidak punya Admin principal.

Pengujian baru:
- `check:u4-foundation` (murni, 12 asersi baru, total 213): tugas pada p-003/p-004/p-005, proyek runtime tanpa `adminId`, dan proyek dengan Admin principal lain. Siti hanya melihat tugas p-001; Admin lain hanya p-007; Owner semua; Mandor hanya proyek tempat ia menjadi anggota; Anggota Tim tidak. Siti juga tidak bisa mengubah/mengganti status/menugaskan ulang tugas di proyek yang bukan miliknya. Invarian: untuk Admin, `canViewTask === canViewProject`; proyek tanpa `adminId` tidak cocok dengan Admin berid kosong; tugas dengan proyek tidak dikenal ditolak untuk semua.
- `check:u4-access` (browser, navigasi klien, ID runtime): tugas runtime di p-003 dan di proyek runtime. Budi ✓; Siti, Ahmad, Dewi ✗ (konten tidak pernah terlihat).
- Hook uji: dua tombol di halaman sementara `u4-spike` (`create-task-p003-push`, `create-task-runtime-project-push`). Halaman itu tetap artefak uji yang dihapus di U4-6/U4-10.

## Hasil regression suite
lint (0 error; 1 warning lama di `data/mock.ts`), typecheck, build, check:contrast (57/57), check:tokens, check:u4-foundation (213), check:u4-components (62), check:u4-access (201), check:dynamic-routes, check:browser: semuanya lolos.
