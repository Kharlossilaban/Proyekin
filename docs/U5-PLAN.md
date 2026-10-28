# PROYEKIN — Rencana U5: Laporan Harian dan Dokumen

> ## STATUS: DRAFT / NOT APPROVED FOR IMPLEMENTATION
> Dokumen ini hanya perencanaan. **Tidak ada kode U5 yang boleh dikerjakan** sebelum (1) seluruh U4 (U4-5 s.d. U4-12) selesai dan (2) Owner menyetujui dokumen ini beserta keputusan OPEN di §9.
> Tanggal draf: 2026-10-28 · Revisi: 2026-10-28 (keputusan final F1 Dokumen dan F2 Anggaran) · Branch: `feat/u4-core-ui` · Rujukan baseline: `docs/U4-PLAN.md`.

## 0. Cara membaca

| Label | Arti |
|---|---|
| **[FINAL]** | Keputusan final Owner. Tidak dibuka ulang oleh implementor. |
| **[KEPUTUSAN]** | Keputusan Owner lain (instruksi 2026-10-28). Dicatat apa adanya. |
| **[USUL]** | Rekomendasi perencana. **Bukan keputusan**; menunggu persetujuan Owner. |
| **[OPEN]** | Butuh keputusan Owner. Implementor tidak boleh memilih sendiri. |
| **[FAKTA]** | Kondisi kode/dokumen saat ini, dengan rujukan. |

## 1. Keputusan Owner yang berlaku (2026-10-28)

1. **[FINAL] F1 — Dokumen tetap ada, scope sempit.** Menu `/dokumen` **dipertahankan**. Isinya hanya:
   - **A.** Gambar/render 3D proyek atau bangunan yang sedang dikerjakan.
   - **B.** Foto kegiatan/progres yang dilampirkan Mandor melalui Laporan Harian.

   Foto laporan punya **satu sumber data**: lampiran laporan harian. Dokumen menampilkannya sebagai **galeri/tampilan turunan**. **Tidak boleh** ada unggah foto kedua yang menduplikasi lampiran. Menu Dokumen dan fitur foto laporan Mandor **tidak boleh dihapus**.
2. **[FINAL] F2 — Anggaran dihapus total dari produk.** Tidak dibutuhkan role mana pun (termasuk Owner dan Admin Kantor); bukan aturan sembunyi per role. U5 tidak menampilkan, menghitung, memvalidasi, atau memberi izin apa pun terkait anggaran, dan **tidak** menggantinya dengan fitur keuangan lain (mis. biaya/harga material di laporan). Rincian di `docs/U4-PLAN.md` §6.
3. **[KEPUTUSAN]** U5 baru diimplementasikan **setelah U4 selesai**; urutan U4-5 → U4-12 dipertahankan.
4. **[KEPUTUSAN]** Tipe data media visual **baru, terpisah** dari tipe `Document` legacy. Data legacy **tidak dihapus** sekarang.
5. **[KEPUTUSAN]** Masalah file logo bukan blocker U5.

Dokumen internal developer (`AGENTS.md`, `CLAUDE.md`, roadmap, `PROJECT-SUMMARY.md`, evidence) **bukan** konten fitur Dokumen aplikasi.

## 2. Scope U5

| Bagian | Isi | Kelas scope |
|---|---|---|
| **U5-A** Laporan Harian | Mandor membuat laporan harian per proyek (catatan kemajuan, kondisi lapangan, **lampiran foto kegiatan/progres**). Owner/Admin melihat laporan sesuai lingkup. **Mandor mobile-first 375px.** | A (MVP) |
| **U5-B** Dokumen | Menu `/dokumen` tetap ada. Galeri visual proyek dengan **tepat dua jenis konten**: (A) gambar/render 3D proyek, (B) foto lampiran laporan harian (turunan, hanya-baca di Dokumen). | A, dipersempit oleh **F1** |

### Di luar scope (tidak boleh dikerjakan di U5) [FINAL F1/F2]
- Kontrak, RAB, surat, berita acara, administrasi umum.
- Blueprint/denah, spesifikasi material, repositori berkas serbaguna; unggah PDF/XLSX/berkas non-gambar di Dokumen.
- Versioning, riwayat/ganti versi, publikasi, arsip/restore, approval dokumen yang kompleks (juga kelas C).
- Viewer model 3D interaktif (render 3D ditampilkan sebagai **gambar diam**; berkas model 3D seperti `.glb`/`.obj` tidak diterima) tanpa keputusan baru.
- **Kategori berkas baru** di luar dua jenis konten di atas.
- Anggaran dan fitur keuangan apa pun (F2).
- Konsep Figma di luar scope (register gambar, revisi/approval gambar, WBS, work package, tinjauan komentar; layar "Gambar teknis", "Document version history", "Archived documents", "Access and publication settings", dll.). Figma hanya referensi (`CLAUDE.md` §1).
- Backend nyata, penyimpanan objek (S3), unggah sungguhan: hanya simulasi UI di atas mock (`docs/BACKEND-ROADMAP.md`).
- Dependency baru, role baru (lima role resmi; **tidak ada Tukang**), Vendor, notifikasi, Kanban.

## 3. Penyelarasan spesifikasi

**[FAKTA]** Pada 2026-10-28, `docs/deep-research-report.md` (kanonis) diselaraskan dengan F1 dan F2: teks lama ditandai inline (pola penanda "DIGANTI" yang sudah dipakai untuk tema warna) dan ditambah bagian "Catatan Keputusan Pemilik — Dokumen dan Anggaran (2026-10-28)". Cermin root disinkronkan. Teks yang disentuh: butir Manajemen Proyek (anggaran), butir Dokumen Proyek, butir A (MVP) pada klasifikasi scope.

**Tidak diubah (masih OPEN):** butir Laporan Harian ("lampiran foto **atau dokumen**") dan peran Mandor ("mengunggah foto/**dokumen** di lapangan"). F1 membatasi isi menu Dokumen, tetapi tidak menyatakan apakah laporan boleh membawa lampiran non-foto. Lihat U5-O1.

## 4. Kondisi saat ini (FAKTA)

| Item | Kondisi | Rujukan |
|---|---|---|
| `/laporan` | Placeholder: tabel + kartu responsif dari `MOCK_REPORTS` statis; label status hardcode lokal (belum `labels.ts`) | `app/(app)/laporan/page.tsx:17-28`, `88b0bb7` |
| `/dokumen` | Placeholder: tabel + kartu dari `MOCK_DOCUMENTS` legacy (Gambar Teknis PDF, RAB `.xlsx`, Kontrak, dst.) — **seluruhnya di luar F1** | `app/(app)/dokumen/page.tsx`, `data/mock.ts:249` |
| Tipe `DailyReport` | Terikat ke **proyek** (`projectId`, `projectCode`), penulis `foremanId`; **tidak punya `taskId`**; `photos?: string[]`, `attachments?: Document[]`, status `DRAFT/SUBMITTED/APPROVED/REJECTED`; field `materials` berupa teks (tanpa harga) | `types/index.ts:65-83` |
| Tipe `Document` legacy | `category` (5 nilai, termasuk `"SURAT menyurat"` tak konsisten), `version`, `status: PUBLIK/PRIVAT/ARKIP` | `types/index.ts:85-99` |
| Foto laporan seed | Path `/documents/photo1.jpg` dst.; **folder `public/documents` tidak ada**, sehingga tidak ada gambar nyata | `data/mock.ts:208,225,242` |
| Izin laporan/dokumen | **Tidak ada** fungsi izin laporan/media di `access.ts`; hanya `canAccessSection`: `laporan` = Owner/Admin/Mandor, `dokumen` = semua non-Guest, nilai warisan U2 dengan catatan "aturan final ditetapkan di fitur masing-masing" | `lib/access.ts:107-125` |
| Store | `MockStoreState` = users, projects, members, tasks; **belum ada reports/media** | `lib/mock-store.ts:17-25` |
| Dashboard | Menghitung laporan menunggu dari `MOCK_REPORTS` langsung | `dashboard/page.tsx:35` |
| Label | Peta label laporan/dokumen sudah ada di `lib/labels.ts` (`getReportStatusLabel`, `getDocumentStatusLabel`) tetapi halaman belum memakainya | `U4-1-FOUNDATION.md:93` |

## 5. Rekomendasi model data (USUL)

### 5.1 Prinsip [FINAL F1]
- **Satu sumber foto laporan:** foto progres **disimpan sebagai lampiran laporan**. Tidak ada penyimpanan kedua dan tidak ada alur unggah foto di Dokumen.
- **Dokumen = tampilan turunan:** galeri dihitung dari (a) render 3D proyek dan (b) lampiran foto laporan. Item galeri **tidak disimpan** sebagai entitas sendiri.
- **Tepat dua jenis konten.** Tidak ada `category`, versi, status publikasi, atau arsip.

### 5.2 Tipe baru, terpisah dari `Document` legacy (nama sementara)

```ts
/** Lampiran foto pada laporan harian — SATU-SATUNYA sumber foto laporan. */
interface ReportPhoto {
  id: string;
  reportId: string;            // DailyReport.id (wajib)
  projectId: string;           // salinan dari laporan, untuk penyaringan galeri
  src: string;                 // path mock / object URL (mock saja)
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  caption?: string;
  uploadedById: string;        // User.id (penulis laporan)
  uploadedAt: string;          // ISO
}

/** Gambar/render 3D proyek atau bangunan (gambar diam, bukan berkas model 3D). */
interface ProjectRender {
  id: string;
  projectId: string;
  title: string;
  caption?: string;
  src: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  uploadedById: string;
  uploadedAt: string;
}

/** Item galeri Dokumen — DITURUNKAN oleh selector, tidak disimpan. */
type DokumenGalleryItem =
  | { kind: "RENDER_3D"; render: ProjectRender }
  | { kind: "FOTO_LAPORAN"; photo: ReportPhoto; report: DailyReport };
```

Alasan: memisahkan media visual dari dokumen umum, tidak membawa field kelas C, dan memastikan foto laporan hanya punya satu sumber (lampiran laporan). `kind` hanya pembeda dua jenis konten yang disetujui F1; **bukan** sistem kategori yang dapat ditambah.

### 5.3 Hubungan dengan `DailyReport`
- **[USUL]** `DailyReport` mendapat `photoIds: string[]` (rujukan ke `ReportPhoto`) **atau** `ReportPhoto` dicari lewat `reportId`. Pilih satu saat U5-0; jangan keduanya (hindari dua sumber).
- **[USUL]** Field lama `photos?: string[]` dan `attachments?: Document[]` ditandai `@deprecated` LEGACY (pola `Project.managerId`), **tidak dihapus**, dan **tidak dibaca** UI atau selector mana pun. Path foto seed lama dikonversi menjadi seed `ReportPhoto`.
- **[USUL]** Foto hanya dapat ditambah, diganti, atau dihapus **dari alur laporan** (mengikuti aturan ubah laporan, U5-O4). Di Dokumen, foto laporan hanya-baca dan menautkan ke laporan asal.
- **[OPEN] U5-O1** Lampiran non-foto pada laporan.

### 5.4 Data legacy
- **[KEPUTUSAN]** `Document`, `DocumentCategory`, `DocumentStatus`, `MOCK_DOCUMENTS`, serta fungsi label dokumen **tetap ada**; tidak dihapus sekarang.
- **[FINAL F1]** Jenis dokumen lama di luar scope (Gambar Teknis PDF, Rencana Kerja/RAB, Kontrak, Surat Menyurat, Lainnya) **tidak boleh tampil** di UI U5. Setelah U5-B, `/dokumen` tidak lagi membaca `MOCK_DOCUMENTS`, dan `/laporan` tidak menampilkan `attachments: Document[]`.
- **[USUL]** Asersi uji yang kini mengharapkan isi `MOCK_DOCUMENTS` di `/dokumen` (`scripts/check-responsive-lists.mjs:63`, termasuk "RAB Renovasi Gedung Kantor") diganti dengan asersi galeri baru di U5-B, ditambah asersi bahwa nama dokumen legacy **tidak** muncul. Tidak ada asersi lain yang dilonggarkan.
- **[USUL]** Typo `"SURAT menyurat"`/`"ARKIP"` tidak diperbaiki di U5 (data tidak dipakai UI).
- **[USUL]** Seed baru: beberapa `ProjectRender` dan `ReportPhoto` placeholder yang jelas berlabel data demo. Gambar seed dari aset Owner atau placeholder netral buatan kode; **tidak boleh** memakai gambar hak cipta pihak lain (U5-O11).

## 6. Hak akses (USUL, semuanya wajib masuk ke `access.ts` sebagai satu-satunya sumber)

Fungsi baru yang diusulkan (nama sementara), mengikuti pola dan prinsip fail-closed U4-1:

| Fungsi | Usul aturan | Status |
|---|---|---|
| `canAccessSection("laporan")` | Tetap Owner/Admin/Mandor (nilai sekarang) | Final tidak ditetapkan U4; **[OPEN]** konfirmasi |
| `canAccessSection("dokumen")` | Tetap semua non-Guest (menu dipertahankan, F1) | Isi per role mengikuti baris di bawah |
| `canViewReport` / `getVisibleReports` | Owner: semua; Admin: proyek yang ia tangani (G8); Mandor: laporan miliknya di proyek tempatnya menjadi anggota. Anggota Tim: tidak (tanpa menu Laporan) | **[OPEN] U5-O3** |
| `canCreateReport` | Mandor yang menjadi anggota proyek dan proyek bukan Arsip (spesifikasi: Mandor membuat laporan harian) | Dasar: spesifikasi; detail **[OPEN]** |
| `canEditReport` / `canSubmitReport` (termasuk tambah/hapus lampiran foto) | Penulis, selagi `DRAFT` (dan `REJECTED`?) | **[OPEN] U5-O4** |
| `canReviewReport` (setujui/tolak) | Tidak ada dasar dokumentasi | **[OPEN] U5-O2** |
| `getDokumenGallery` | **[USUL]** Render: mengikuti `canViewProject`. Foto laporan: **hanya bila `canViewReport` atas laporan asalnya**, agar tampilan turunan tidak membuka foto dari laporan yang tidak boleh dilihat | **[OPEN] U5-O5** untuk Anggota Tim |
| `canUploadRender` | Owner dan Admin principal proyek itu | **[OPEN] U5-O6** |
| `canDeleteRender` | Tidak ada arsip (kelas C). Hapus, atau tanpa hapus? | **[OPEN] U5-O7** |

Prinsip yang tidak berubah: lima role; tidak ada Tukang; Guest tanpa App Shell; guard UI bukan keamanan; tidak ada hak diperluas diam-diam; **tidak ada izin terkait anggaran** (F2).

## 7. Dependensi U5 terhadap U4

Koreksi atas audit 2026-10-28: audit menyebut lingkup tugas (U4-8) sebagai dependensi terkeras Laporan. Setelah memeriksa tipe, **`DailyReport` terikat ke proyek, bukan ke tugas** (`types/index.ts:67-83`), sehingga U4-8 hanya menjadi dependensi **lunak** (menjadi keras hanya bila Owner meminta laporan merujuk tugas, U5-O8).

| Dependensi U4 | Tipe | Alasan | Bila belum selesai |
|---|---|---|---|
| **U4-1/U4-2/U4-3** (selesai) | Terpenuhi | `access.ts`, store, komponen (`Textarea`, `Select`, `Tabs`, `ConfirmDialog`, `RadioCardGroup`, `DemoDataNotice`, `PageHeader`, `RecordCard`), guard | — |
| **U4-5** detail proyek | **Kuat (usul)** untuk U5-B | Titik masuk alami galeri proyek ada di konteks proyek; tanpa detail proyek, `/dokumen` berdiri lepas lalu dirombak | U5-B hanya bisa sebagai daftar mandiri; risiko rombak |
| **U4-6** CRUD proyek + penghapusan `/u4-spike` | Lunak | Proyek baru = tanpa laporan/render, sehingga perlu state kosong; migrasi uji dari `/u4-spike` mengubah fondasi uji | U5 memakai proyek seed saja |
| **U4-7** kelola anggota | Lunak–sedang | Keanggotaan menentukan siapa boleh menulis/melihat laporan dan fotonya (`isMember`); menguji "anggota dikeluarkan kehilangan akses" butuh U4-7 | Uji terbatas pada seed `MOCK_PROJECT_MEMBERS` |
| **U4-8/U4-9** tugas | Lunak | Tidak ada `taskId` di laporan; menjadi keras hanya jika U5-O8 menambahnya | Tidak memblokir |
| **U4-10** buat tugas | Lunak | Menyelesaikan pembersihan `/u4-spike` | Tidak memblokir |
| **U4-11** manajemen pengguna | Lunak | `foremanId`/`uploadedById` merujuk `User`; U5 harus membaca `users` dari store, bukan `MOCK_USERS` | Gunakan seed |
| **U4-12** dashboard + perapian tes + pembersihan anggaran | **Kuat** | Dashboard memakai jumlah laporan menunggu (`MOCK_REPORTS`), jadi U5 harus menyambungkannya ke store laporan; perapian helper CDP memudahkan uji U5; pembersihan anggaran (T3/T4) selesai sebelum U5 menyentuh dashboard | Angka laporan tidak sinkron dengan store U5 |
| **F2 anggaran** | Batasan | U5 tidak menambah field biaya/harga (mis. di `materials`), statistik, atau tampilan keuangan | — |

**Tugas penyambung yang menjadi bagian U5 (bukan U4):**
1. Memperluas `MockStoreState`/`AccessData` dengan `reports`, `reportPhotos`, `renders` (perluasan, tanpa mengubah yang ada).
2. Menyambungkan hitungan "laporan menunggu" di dashboard ke store (tanpa metrik keuangan).
3. Memigrasikan `/laporan` dan `/dokumen` ke `labels.ts` dan `access.ts`.

## 8. Rencana langkah U5 (USUL; urutan setelah U4 selesai)

| Langkah | Isi | Catatan |
|---|---|---|
| U5-0 | Fondasi: tipe `ReportPhoto`, `ProjectRender`, selector galeri turunan, perluasan store, izin di `access.ts` + uji matriks (pola `check-u4-foundation`), label di `labels.ts`, seed demo | Tanpa UI bisnis |
| U5-1 | Daftar laporan `/laporan` per lingkup (kartu mobile-first 375px untuk Mandor, tabel desktop untuk Owner/Admin) | Pola U4-4 |
| U5-2 | Detail laporan dengan lampiran foto + (jika disetujui) alur tinjau | Bergantung U5-O2 |
| U5-3 | Form laporan harian Mandor, **375px mobile-first**, target sentuh ≥44px, pilih/ambil foto sebagai lampiran (pratinjau di memori, validasi tipe/ukuran), `router.push`, "(simulasi)" | Satu-satunya jalur foto laporan masuk; batas **[OPEN] U5-O9** |
| U5-4 | Dokumen `/dokumen` (menu dipertahankan): galeri dua jenis konten (render 3D + foto laporan turunan), saring per proyek dan per jenis, pratinjau gambar, tautan foto ke laporan asal, state kosong/error, unggah render (jika `canUploadRender`). Dokumen legacy tidak tampil | Foto laporan hanya-baca di sini |
| U5-5 | Penyambungan dashboard, regresi penuh, evidence, ringkasan | Mengikuti gerbang selesai `docs/U4-PLAN.md` §2 |

Setiap langkah mengikuti gerbang selesai yang sama dengan U4: rencana UI disetujui dulu, uji dalam kelompok, evaluasi visual 375/768/1280, skill dipanggil dan dilaporkan, lalu berhenti untuk persetujuan. Uji U5 menyertakan asersi penjaga **tanpa anggaran** (pola `check-u4-projects.mjs:179`).

## 9. Keputusan Owner untuk U5

**Ditutup:**

| ID | Keputusan | Status |
|---|---|---|
| — | Scope Dokumen | **FINAL F1** (§1). Menu tetap; dua jenis konten; foto laporan satu sumber. |
| — | Anggaran di U5 | **FINAL F2**: tidak ada. |
| U5-O10 | Catatan keputusan Dokumen di spesifikasi | **Selesai 2026-10-28**: ditambahkan ke `docs/deep-research-report.md` dan cermin root (§3). |
| (bagian U5-O12) | Dokumen legacy tampil di UI U5? | **FINAL F1**: tidak tampil. Penghapusan datanya tetap OPEN (U5-O12). |

**Masih OPEN:**

| ID | Keputusan | Usul perencana |
|---|---|---|
| U5-O0 | **Persetujuan draf ini** dan nama tipe (`ReportPhoto`, `ProjectRender`) | Setujui model §5 |
| U5-O1 | Lampiran **non-foto** pada laporan harian (spesifikasi: "foto atau dokumen") | Foto saja |
| U5-O2 | Siapa yang menyetujui/menolak laporan (status `APPROVED`/`REJECTED`), atau tahap tinjau ditunda | Tidak ada dasar; butuh keputusan |
| U5-O3 | Lingkup lihat laporan Mandor (hanya milik sendiri vs seluruh proyeknya) | Hanya milik sendiri (fail-closed) |
| U5-O4 | Aturan ubah laporan dan lampirannya (kapan terkunci, boleh ubah setelah ditolak?); satu laporan per proyek per hari? | Terkunci setelah dikirim |
| U5-O5 | Isi Dokumen untuk Anggota Tim (menu ada, tetapi tidak melihat Laporan) | Hanya render 3D |
| U5-O6 | Siapa boleh mengunggah render 3D | Owner + Admin principal |
| U5-O7 | Render boleh dihapus atau tidak (arsip = kelas C) | Tanpa hapus di U5 |
| U5-O8 | Laporan merujuk tugas (`taskId`)? Spesifikasi tidak menyebutnya | Tidak (perubahan model) |
| U5-O9 | Batas jumlah dan ukuran foto per laporan serta ukuran render; format diterima | JPEG/PNG/WebP; angka ditentukan Owner |
| U5-O11 | Sumber gambar seed (aset dari Owner atau placeholder netral) | Placeholder netral |
| U5-O12 | Kapan data legacy `Document`/`MOCK_DOCUMENTS` dihapus | Dievaluasi setelah U5 selesai |

Keputusan terbuka dari U4 dicatat di `docs/U4-PLAN.md` §5.
