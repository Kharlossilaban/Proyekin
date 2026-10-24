> **Dokumen resmi.** Ini adalah sumber spesifikasi resmi PROYEKIN (ditetapkan 2026-10-23). Salinan lama di root (`deep-research-report.md`) hanya arsip sementara dan tidak boleh diedit.

# Rencana Riset Mendalam Proyekin

## Desain UI dan Modul
Proyekin sudah memiliki *wireframe* dan prototipe desain di Figma untuk modul-modul utama (Manajemen Proyek, Manajemen Tugas, Jadwal/Gantt, Laporan Harian, Dokumen, Dashboard, Anggota, Pengaturan). Tema utama aplikasi adalah ~~hijau~~ **[DIGANTI 2026-10-23: identitas resmi kini Orange `#E68D1F` + Charcoal `#293036`, lihat `CLAUDE.md`; hijau hanya untuk warna semantic/success]** dengan antarmuka berbahasa Indonesia. Contoh data proyek awal adalah `PRJ-001 – Renovasi Gedung Kantor Batam`. Desain desktop fokus untuk Owner/Admin, sedangkan untuk Mandor difokuskan pada antarmuka mobile. (Note: modul *tender* dinyatakan tidak masuk MVP; kerja sama vendor diluar Proyekin.) Informasi detail desain akan dikumpulkan untuk memastikan implementasi sesuai spesifikasi visual.

## Arsitektur & Teknologi (Keputusan Teknis)
**Frontend:** Next.js (React) dengan TypeScript. Next.js adalah kerangka kerja React populer yang digunakan perusahaan besar untuk membangun aplikasi web berkinerja tinggi. Kelebihan Next.js antara lain *server-side rendering* (SSR) dan *static generation*. Next.js juga mendukung Tailwind CSS untuk styling langsung.  
**Backend/API:** NestJS (Node.js + TypeScript). NestJS adalah framework progresif untuk aplikasi backend yang efisien dan skalabel. NestJS bekerja di atas Express (atau Fastify) sehingga kita dapat menggunakan beragam modul Node.js.  
**Database:** PostgreSQL. Sebuah RDBMS open-source yang andal, sering disebut “world’s most advanced open source relational database”. PostgreSQL mendukung JSONB, transaksi ACID, *foreign key*, dan *materialized views*, cocok untuk data proyek yang kompleks.  
**ORM/Query:** Prisma. ORM TypeScript populer untuk Node.js. Dokumentasi Prisma bahkan menyediakan *scaffold* proyek NestJS dengan PostgreSQL, memudahkan setup awal dan query tipe-aman.  
**Autentikasi:** NextAuth.js (untuk Next.js). NextAuth menyediakan solusi autentikasi full-stack dengan dukungan OAuth (Google, Facebook, dsb.), email/passwordless, dan penyimpanan sesi di DB. NextAuth mudah diintegrasikan dan mendukung berbagai basis data (termasuk PostgreSQL).  
**Penyimpanan Berkas:** Layanan object storage seperti AWS S3 atau MinIO/Supabase Storage direkomendasikan. Banyak tutorial Full-stack (Next.js + PostgreSQL) menggunakan S3 untuk upload/download file. Dengan S3 kompatibel, kita bisa menyimpan dokumen proyek (gambar, PDF, laporan) dengan aman.  

> **Catatan:** Keputusan bahasa pemrograman (TypeScript di frontend dan backend) sudah tersirat dari stack di atas. Jika belum ada keputusan final, disarankan menggunakan stack di atas sebagai rekomendasi sesuai praktik industri (Next.js & NestJS mendukung TS out-of-the-box).

## Fitur MVP (Minimum Viable Product)
Pada rilis awal, modul berikut **wajib** berfungsi (tidak hanya tampilan):

- **Autentikasi & Registrasi:** Pengguna dapat mendaftar akun (Owner/Admin/Mandor/Tim) dan login. Sistem pengelolaan peran (role) ditetapkan saat pendaftaran atau oleh Owner/Admin. Reset kata sandi via email.  
- **Manajemen Proyek:** Owner/Admin dapat membuat, mengubah, menghapus proyek. Setiap proyek berisi detail (nama, deskripsi, anggaran, klien). Proyek terkait ke anggota tim.  
- **Manajemen Tugas:** Di dalam proyek, dapat dibuat tugas (*task*) dengan atribut (judul, deskripsi, penanggung jawab, tanggal tenggat). Tugas bisa diubah statusnya (misalnya: baru/dalam progres/selesai).  
- **Jadwal/Gantt Chart:** Tampilkan rangkaian tugas proyek dalam format garis waktu (Gantt) agar visualisasi timeline jelas.  
- **Laporan Harian:** Mandor dapat membuat entri laporan harian proyek, termasuk catatan kemajuan, kondisi lapangan, dan lampiran foto atau dokumen.  
- **Dokumen Proyek:** Upload/download file relevan (rencana kerja, gambar lapangan, kontrak, dsb.) per proyek. Buat repositori dokumen terstruktur.  
- **Dashboard Analitik:** Halaman ringkasan (khusus Admin/Owner) menampilkan statistik proyek (total proyek, tugas tertunda, progress anggota) dan grafik dasar untuk memberi gambaran cepat.  
- **Manajemen Anggota:** Owner/Admin menambah/menghapus pengguna, menetapkan peran, dan mengelola tim proyek.  
- **Halaman Landing Publik:** Halaman depan (landing) untuk publik minimal menampilkan informasi umum Proyekin. (Dokumen tender dapat diakses publik jika disetujui; untuk saat ini ini opsional.)

Semua alur di atas harus didukung backend (API REST/GraphQL NestJS) dan penyimpanan data sebenarnya (PostgreSQL). Hanya modul yang disebut MVP yang dikembangkan dulu; fitur tambahan seperti penjadwalan lanjutan atau integrasi vendor bisa ke backlog.  

## Aturan Bisnis & Hak Akses
Peran pengguna yang sudah ditentukan dan hak aksesnya (harus diimplementasikan secara eksplisit):

- **Owner Proyek:** Pemilik proyek, kontrol penuh. Bisa membuat/hapus proyek, menetapkan Admin, menambah anggota tim, akses semua fitur proyek.  
- **Admin Kantor:** Staf kantor yang membantu Owner; bisa mengelola proyek yang ditugaskan oleh Owner (buat/ubah tugas, atur penjadwalan, dokumentasi).  
- **Mandor:** Supervisor lapangan; hanya melihat proyek yang ditugaskan, bisa mengupdate status tugas yang di-assign ke timnya, membuat laporan harian, mengunggah foto/dokumen di lapangan.  
- **Anggota Tim:** Pelaksana teknis; melihat tugas yang di-assign, menandai progres tugas (misalnya checklist harian).  
- **Guest (Tamu):** Hanya mengakses konten publik (misalnya halaman tender publik, jika ada). Tidak bisa membuat atau mengedit data internal.  

Hak akses harus di-check per modul. Contoh: hanya Owner/Admin yang bisa membuat proyek, Mandor/Anggota hanya mengupdate laporan/tugas, dll. Skema RBAC (Role-Based Access Control) direkomendasikan.  

## Keputusan yang Sudah Disepakati
- **Bahasa dan UI:** Seluruh aplikasi dalam Bahasa Indonesia, ~~tema hijau Proyekin~~ **[DIGANTI 2026-10-23: tema Orange + Charcoal Proyekin, lihat `CLAUDE.md`]** (logo & palet warna).  
- **Contoh Data:** Proyek contoh `PRJ-001 (Renovasi Gedung Kantor Batam)` sebagai referensi.  
- **Modul Utama:** Semua modul di daftar MVP di atas telah didesain; tidak ada modul tender/vendor di MVP.  
- **Platform:** SaaS berbasis web; UI Owner/Admin didesain untuk desktop (resolusi lebar), UI Mandor untuk mobile.  
- **Teknologi:** Frontend Next.js, backend NestJS, database PostgreSQL (post-commit mungkin dikonfirmasi). *Jika belum diputuskan resmi, anggap ini rekomendasi.*  
- **Data dan Integrasi:** Semua data tersentral di PostgreSQL, file disimpan terpisah (S3). API internal menggunakan NestJS.

Semua keputusan di atas **final**; AI seperti Claude **tidak boleh** mengubah scope atau modul tanpa persetujuan. Misalnya, tidak membuat modul tender/vendor baru atau mengubah bahasa UI tanpa konfirmasi.  

## Kondisi Proyek Saat Ini
Berdasarkan informasi tersedia, saat ini **baru pada tahap desain**. Prototipe UI ada di Figma, namun belum ada kode produksi. Belum ada aplikasi yang berjalan. Figma digunakan sebagai rujukan visual, tetapi **Claude atau AI lain tidak dapat mengakses Figma secara otomatis**. Jika perlu, detail desain (UI, workflow) harus diceritakan lewat instruksi prompt agar AI memahami tampilan yang diharapkan. Pengembangan belum dimulai; dokumentasi ini untuk memastikan tim (atau AI) punya gambaran lengkap sebelum coding.  

## Rekomendasi Teknis & Langkah Selanjutnya
- **Autentikasi:** Implementasikan NextAuth.js di frontend, NestJS Passport (JWT) di backend untuk keamanan sesi.  
- **Arsitektur Proyek:** Pertimbangkan monorepo (misal dengan Turborepo) untuk menyatukan Next.js dan NestJS dalam satu repositori, memudahkan sharing modul (seperti tipe data/klien API).  
- **Model Data Awal:** Rancang skema PostgreSQL: tabel User (role, profil), Project, Task (terhubung ke Project), DailyReport, Document, dsb. Gunakan Prisma schema untuk migrate DB cepat.  
- **API:** Buat modul NestJS sesuai fitur (ProjectController, TaskController, dll). Tes API dengan Postman.  
- **Desain & UI:** Jika perlu penyesuaian desain, lakukan review desain Figma dengan pemangku kepentingan. Pastikan lapisan mobile/desktop konsisten.  
- **Infrastruktur:** Rencanakan hosting: misal Frontend ke Vercel/Netlify (Next.js), Backend ke AWS/GCP/Heroku (NestJS Docker). Siapkan CI/CD (GitHub Actions/GitLab CI).  
- **Pengujian:** Buat unit test dan end-to-end test awal (misal Jest).  

## Panduan dan Contoh Prompt untuk Claude (AI)
Agar Claude (atau coding agent lainnya) memahami konteks Proyekin, berikan instruksi yang eksplisit:

- **Awali dengan Analisis Proyek:** Misalnya:
  > *“Claude, analisis konteks proyek Proyekin (platform manajemen proyek konstruksi) beserta modul dan peran yang sudah ditetapkan. Kemudian **tambahkan fitur [Nama Fitur]** sesuai desain yang ada. Contoh: Buatkan halaman Dashboard Admin modern dengan sidebar, statistik pengguna/proyek, grafik aktivitas, dan tabel data terbaru. Gunakan framework yang telah dipilih (Next.js/NestJS). Hubungkan elemen frontend ke API/backend terkait. Tampilkan langkah-langkah implementasi secara rinci dan minta persetujuan sebelum mengubah kode.”*  
  Contoh prompt di atas meminta Claude membuat **rencana implementasi terlebih dahulu**.

- **Persetujuan dan Implementasi Bertahap:** Setelah Claude memberikan rencana, balas dengan:
  > *“Saya setuju dengan rencana tersebut. Laksanakan implementasi secara bertahap. Gunakan skill/code agent ECC untuk membantu coding jika tersedia, dan jalankan pengujian setiap selesai modul.”*  
  Ini memastikan Claude mengkonfirmasi rencana sebelum coding, dan menandakan menggunakan ECC (Engine Code Chooser) atau CI tools sesuai integrasi tim.

- **Commit dan Review:** Selalu buat commit di Git sebelum perubahan besar agar mudah rollback. Misalnya:
  > *“(Commit sebelum memulai fitur: `feat: mulai implementasi halaman dashboard admin`)*. Kemudian perintahkan Claude melanjutkan.”*  
  Setelah selesai, minta ulasan:  
  > *“Mintalah GPT (atau reviewer manusia) memeriksa kode yang baru dibuat untuk memastikan kualitas.”*  
  Misalnya: *“GPT, tolong review kode modul dashboard ini dan cek kesesuaian dengan spesifikasi Proyekin.”*  

- **Detail yang Diperlukan:** Claude tidak bisa membaca Figma; berikan deskripsi fitur dengan jelas (warna tema, layout, nama field). ~~Sebutkan bahwa UI harus serupa desain Figma yang ada. Contoh warna hijau #009543, dsb., jika perlu.~~ **[DIPERBARUI 2026-10-23: Figma adalah referensi visual dan fungsional, bukan desain final yang ditiru pixel-perfect. Warna mengikuti Brand Color System di `CLAUDE.md`; `#009543` hanya catatan historis.]**  

### Instruksi Umum
- Jangan tambahkan fitur di luar scope yang sudah ditentukan.  
- Pastikan setiap modul baru konsisten dengan desain dan bahasa.  
- Gunakan bahasa Indonesia di antarmuka.  
- Simpan pekerjaan langkah demi langkah dan minta umpan balik setelah tiap bagian besar selesai.  

Dengan panduan di atas, tim (atau asisten AI seperti Claude) dapat mulai implementasi Proyekin secara terstruktur, dengan fokus pada keputusan yang sudah ada dan arahan MVP. 

**Sumber Referensi:** Kami merujuk dokumentasi teknologi dan praktik industri untuk rekomendasi stack:
- Next.js (React) framework  
- NestJS (Node/TypeScript) framework  
- Prisma ORM + NestJS example  
- NextAuth.js for Next.js authentication  
- Tutorial file storage Next.js + S3  
- PostgreSQL overview.

---

## Catatan Keputusan Pemilik (2026-10-23)

Bagian ini menambah, bukan menghapus, keputusan di atas. Bila ada pertentangan dengan teks sebelumnya, bagian ini yang berlaku.

- **Warna brand:** Orange `#E68D1F` + Charcoal `#293036` menggantikan tema hijau. Detail dan aturan kontras ada di `CLAUDE.md`. Hijau hanya boleh sebagai warna semantic (success).
- **Tipografi:** Geist sebagai font utama. Dark mode ditunda; fokus light mode.
- **Figma:** referensi visual dan fungsional, bukan desain final. Business rules dan scope MVP di dokumen ini tetap menjadi acuan utama.
- **Scope fitur Figma di luar daftar MVP** (klasifikasi A/B/C; tidak ada yang boleh diimplementasikan tanpa persetujuan):
  - A (MVP): Dashboard, auth/reset password, penugasan tugas, laporan harian, dokumen (upload/download, repositori), landing publik. Kanban hanya boleh sebagai alternatif visualisasi tugas yang sudah ada.
  - B (pasca-MVP): Manajemen Vendor, Vendor Invitation, Contractor Login.
  - C (butuh keputusan pemilik): WBS, multi-company, versioning/arsip/pengaturan publikasi dokumen, undangan pengguna (MVP mengikuti mekanisme penambahan pengguna di spesifikasi ini), verifikasi email (detail harus diajukan dulu), halaman Tentang Kami dan Kontak (kandidat landing), role di luar lima role resmi, model harga (`MOCK_PRICING`), notifikasi.
- **Role resmi hanya lima:** Owner, Admin Kantor, Mandor, Anggota Tim, Guest.

## Catatan Keputusan Pemilik — Autentikasi U3 (2026-10-24)

Bagian ini menambah, bukan menghapus, keputusan di atas. Bila ada pertentangan dengan teks sebelumnya (termasuk butir "Autentikasi & Registrasi" di bagian fitur), bagian ini yang berlaku.

- **U3-1 Registrasi publik hanya untuk Owner.** Admin Kantor, Mandor, dan Anggota Tim ditambahkan lewat mekanisme internal (oleh Owner/Admin di dalam aplikasi), bukan registrasi publik. Guest tidak memerlukan akun.
- **U3-2 Verifikasi email tidak diimplementasikan di U3.** Struktur disiapkan agar dapat ditambahkan nanti; detail dan scope tetap harus diajukan dulu (klasifikasi C).
- **U3-3 Company onboarding tidak termasuk U3.** Registrasi hanya simulasi pembuatan akun.
- **U3-4 Workspace selector dan multi-company tidak termasuk MVP.** Satu workspace; login langsung ke dashboard.
- **U3-5 Logo yang sudah memuat tulisan "Proyekin" tidak boleh diberi teks tambahan.**
- **U3-6 Invitation flow tidak termasuk U3.** Penambahan anggota mengikuti halaman Anggota sesuai spesifikasi ini.
- **Aturan mutlak:** PROYEKIN tidak memiliki role Tukang. Jangan menambahkan role tersebut atau menyamakannya dengan Anggota Tim. Lima role resmi saja.
- **Sifat implementasi U3:** semua alur auth di frontend adalah simulasi UI (data mock, `sessionStorage`). Bukan autentikasi atau authorization sungguhan; penegakan akses ada di backend (lihat `docs/BACKEND-ROADMAP.md`).
- **Guest:** tidak melihat App Shell. Bila sesi ber-role Guest terdeteksi di area aplikasi, pengguna dialihkan ke halaman Akses Ditolak tanpa merender shell.
