# Evidence U3 — Authentication UI (demo/mock)

Dihasilkan oleh `npm run check:browser -- ../docs/u3-evidence` (Chrome headless + axe-core, dev server).
Semua halaman auth adalah SIMULASI UI; tidak ada backend, token, atau penyimpanan kata sandi.

| Berkas | Isi |
|---|---|
| `results.json`, `check-browser.log` | Hasil mentah: axe per route/viewport, overflow, 47 pemeriksaan alur |
| `auth-<route>-<375\|768\|1280>.png` | 6 route auth x 3 viewport (`masuk`, `daftar`, `lupa-sandi`, `reset-sandi-token-demo-token`, `reset-sandi` tanpa token, `akses-ditolak`) |
| `flows/` | Screenshot state alur: validasi login/daftar/reset, login gagal, konfirmasi lupa sandi, dashboard setelah login (3 viewport), mode pengembangan, drawer mobile dengan tombol Keluar |
| `landing-*`, `dashboard-*`, `proyek-*`, ... | Regresi route U2 (tanpa sesi = mode pengembangan) |
| `style-guide-*`, `dialog-open-1280.png` | Regresi design system U1 |

Pemeriksaan alur yang dicakup: validasi + fokus error + aria-describedby + label, state loading (aria-busy, input disabled),
login berhasil -> /dashboard, refresh mempertahankan sesi demo, logout, menu per role (Mandor tanpa Pengaturan),
akses route aplikasi tanpa sesi (mode pengembangan), registrasi Owner (tanpa pilihan role), lupa/reset sandi,
tautan reset tanpa token, akses ditolak, landing -> login, urutan Tab + toggle sandi via keyboard.
