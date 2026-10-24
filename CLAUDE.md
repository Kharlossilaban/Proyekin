# PROYEKIN — Project Instructions (UI/UX & Brand)

Dokumen ini melengkapi `AGENTS.md`. Tidak ada aturan di `AGENTS.md` yang dihapus atau ditimpa.
Komunikasi dengan user dalam Bahasa Indonesia. UI aplikasi dalam Bahasa Indonesia.

## 1. Status Desain Figma

Desain Figma adalah **REFERENSI VISUAL DAN FUNGSIONAL, bukan desain final** yang wajib diikuti 100%. Jangan menyalin pixel-perfect. Perubahan UI besar tetap diajukan lewat rencana implementasi sebelum dikerjakan.

Boleh diubah (hanya aspek presentasi dan pengalaman visual):
- Layout dan komposisi halaman.
- Navigasi dan struktur visual.
- Komponen UI agar lebih modern dan profesional.
- Spacing, typography, hierarchy, responsiveness, usability.
- Pengalaman di desktop, tablet, dan mobile.
- Pendekatan desain alternatif bila lebih efektif.

## 2. Business Logic TIDAK BOLEH Berubah

Kebebasan di atas **hanya berlaku untuk presentasi**. Business logic, business rules, workflow, role, permission, validasi, status transaksi, dan ketentuan operasional harus tetap mengikuti dokumentasi yang telah ditetapkan.

Dilarang tanpa persetujuan user:
- Mengubah alur bisnis demi menyesuaikan desain.
- Menghapus fitur atau tahapan proses yang diwajibkan.
- Mengubah hak akses pengguna.
- Mengubah API contract, database schema, atau aturan transaksi.
- Menghilangkan validasi penting.
- Membuat asumsi bisnis baru tanpa dasar dokumentasi.

Prioritas bila terjadi konflik:
1. Business rules yang telah disepakati menang atas Figma.
2. Jika dokumentasi saling bertentangan atau aturan bisnis belum jelas: **laporkan dulu ke user, jangan putuskan sendiri.**

## 3. Brand Color System

Terinspirasi dari logo resmi PROYEKIN:

| Token | Nilai | Peran |
|---|---|---|
| Primary Orange | `#E68D1F` | Identitas utama: elemen interaktif, highlight, branding |
| Secondary Charcoal | `#293036` | Navigasi, heading, elemen yang butuh kesan profesional |
| Supporting Gray | `#484C50` | Teks sekunder, elemen pendukung |
| Background | `#F8F9FA` | Latar halaman |
| Warm Highlight | `#FFF3E2` | Highlight lembut, state terpilih |

Aturan:
- Warna semantic (success, warning, error, info) boleh punya warna sendiri agar maknanya jelas.
- Hindari penggunaan warna berlebihan; utamakan keseimbangan, konsistensi, keterbacaan.
- Semua kombinasi teks/background wajib memenuhi **WCAG AA**. Jangan memaksakan teks putih di atas oranye jika kontras tidak cukup (gunakan teks Charcoal atau variasi oranye lebih gelap).
- Semua warna dikelola terpusat lewat **design tokens / theme variables**. Jangan hardcode hex di komponen.

## 4. Arah Desain UI/UX

- Modern dan profesional.
- Clean dan minimalis, tetapi tidak terasa kosong.
- Visual hierarchy jelas dan konsisten di seluruh halaman.
- Responsif di berbagai ukuran perangkat.
- Mudah dipahami pengguna baru.
- Feedback interaksi yang jelas.
- Mengutamakan accessibility dan usability.

Hindari: desain terlalu ramai, warna berlebihan, animasi tidak perlu, komponen tidak konsisten.

## 5. Aturan Implementasi

Sebelum mengubah apa pun:
- Pelajari struktur project dan baca dokumentasi/aturan bisnis yang ada.
- Identifikasi design system dan komponen reusable yang sudah dipakai.
- Gunakan Graphify jika tersedia untuk memahami hubungan kode.
- Pertahankan arsitektur yang berjalan; jangan membangun ulang dari nol.

**Tampilkan rencana perubahan UI/UX terlebih dahulu** (file yang dimodifikasi + potensi dampak) dan **tunggu persetujuan user sebelum mengubah kode.**

## 6. Keputusan Pemilik (2026-10-23)

**Warna dan tema**
- Orange + Charcoal adalah identitas resmi dan **menggantikan** tema hijau lama. Hijau hanya boleh sebagai warna semantic (success).
- Skala Orange 50–900 diturunkan dari `#E68D1F` (500). Teks dan elemen interaktif oranye memakai varian tua (700/800) karena `#E68D1F` sendiri hanya 2,3–2,6:1 di atas putih. Nilai dan rasio kontras tercatat di `src/app/globals.css` dan diverifikasi dengan `npm run check:contrast`.
- Hanya **light mode**. Dark mode ditunda.
- Warna hanya didefinisikan di design tokens (`globals.css`); `src/lib/tokens.ts` hanya merujuk token tersebut. Dilarang hardcode hex di komponen.

**Tipografi:** Geist sebagai font utama (Geist Mono untuk kode/angka tabular). Gunakan skala tipografi di `src/lib/tokens.ts` (heading, body, label, caption, UI).

**Scope fitur dari Figma** (klasifikasi A = MVP, B = pasca-MVP, C = butuh keputusan; rincian di `docs/PROJECT-SUMMARY.md`)
- Kanban hanya boleh sebagai alternatif visualisasi tugas yang ada; jika butuh perubahan workflow, minta persetujuan.
- WBS, multi-company, document versioning/archive/restore/publication settings, dan undangan pengguna: **C**. Untuk MVP ikuti mekanisme penambahan pengguna di spesifikasi resmi.
- Verifikasi email: dipertimbangkan sebagai keamanan auth, tetapi detail dan scope harus diajukan dulu.
- Vendor: **B** (pasca-MVP). Tetap dipertahankan di perencanaan jangka panjang, jangan diimplementasikan sekarang.
- `MOCK_PRICING` belum disetujui sebagai model bisnis.
- Role hanya lima: Owner, Admin Kantor, Mandor, Anggota Tim, Guest. Dilarang menambah role (mis. Project Manager) tanpa persetujuan.
- **ATURAN MUTLAK:** PROYEKIN TIDAK memiliki role, persona, fitur, atau kategori "Tukang". Jangan menambahkannya di UI, mock data, tipe, dokumentasi, maupun kode. Anggota Tim tidak boleh disamakan dengan Tukang. Lima role resmi tetap: Owner, Admin Kantor, Mandor, Anggota Tim, Guest.
- Jangan menghapus mock data berisi konsep di luar scope sebelum dievaluasi.
- Halaman Tentang Kami dan Kontak adalah kandidat landing publik; urutan implementasi mengikuti prioritas MVP.
- UI yang memakai mock data tidak boleh dinyatakan production-ready.

**Git dan dependency**
- Gunakan npm (lockfile `proyekin/package-lock.json`). Periksa dependency yang sudah ada sebelum menambah; jangan memasang duplikat atau yang tidak dibutuhkan.
- Dilarang menghapus riwayat Git, force push, mengubah remote, atau perubahan destruktif lain.
- `package.json` dan `package-lock.json` di root repo milik ECC — jangan dihapus, dipindahkan, atau diubah.
- `proyekin/AGENTS.md` (auto-generated oleh `next dev`) ditambahkan ke `.gitignore` — jangan di-commit.
- Peringatan multi-lockfile Turbopack dibiarkan; jangan ubah `turbopack.root` hanya demi menghilangkan warning selama build berhasil.

## 7. Keputusan Pemilik — Hak Akses MVP (2026-10-23)

Keputusan baru yang melengkapi aturan bisnis di spesifikasi:

**A. Penugasan Admin Kantor ke proyek**
Owner menetapkan Admin Kantor sebagai penanggung jawab proyek. Untuk MVP, satu Admin utama per proyek.

**B. Wewenang Mandor dalam proyek**
Mandor boleh mengatur penugasan anggota dalam tim/proyek yang ditugaskan kepadanya. Mandor **tidak boleh** mengubah role global, keanggotaan organisasi, atau akses lintas proyek.

**C. Batas Pengaturan Admin Kantor**
Pengaturan Admin Kantor dibatasi pada preferensi operasional yang relevan. Admin **tidak boleh** mengubah kepemilikan, role global, pengaturan keamanan organisasi, atau konfigurasi sensitif milik Owner.

**D. Guest tanpa App Shell**
Guest hanya mengakses halaman publik, tanpa sidebar atau navigasi internal. Guest tidak melihat App Shell.

**Catatan:** Navigasi berbasis role di frontend hanya representasi UI menggunakan mock. Ini bukan authorization yang aman — penegakan sesungguhnya ada di server (direncanakan di backend).

## Prinsip Utama

- Figma memberikan inspirasi desain.
- Brand Guidelines menentukan identitas visual.
- Business Rules menentukan cara aplikasi bekerja.
- Scope MVP menentukan fitur yang boleh dikerjakan sekarang.

Figma adalah referensi, bukan batasan kreativitas. Business logic dan aturan bisnis adalah batasan utama yang tidak boleh dilanggar tanpa persetujuan user.
