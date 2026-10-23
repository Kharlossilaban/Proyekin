# PROYEKIN — Project Instructions (UI/UX & Brand)

Dokumen ini melengkapi `AGENTS.md`. Tidak ada aturan di `AGENTS.md` yang dihapus atau ditimpa.
Komunikasi dengan user dalam Bahasa Indonesia. UI aplikasi dalam Bahasa Indonesia.

## 1. Status Desain Figma

Desain Figma adalah **REFERENSI VISUAL, bukan desain final** yang wajib diikuti 100%. Jangan menyalin pixel-perfect.

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

## Prinsip Utama

Figma adalah referensi visual, bukan batasan kreativitas. Business logic dan aturan bisnis adalah batasan utama yang tidak boleh dilanggar tanpa persetujuan user.
