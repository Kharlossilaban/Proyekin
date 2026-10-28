// Pola penjaga "tanpa anggaran" (keputusan final Owner 2026-10-28, F2): fitur anggaran proyek dihapus total dari PROYEKIN
// untuk SEMUA role. Ini BUKAN aturan sembunyi per role. Dipakai bersama oleh check-no-budget.mjs (sumber + model data)
// dan check-u4-projects.mjs (HTML dan DOM halaman aplikasi).
//
// Lookbehind `(?<!\p{L})` mencegah kecocokan palsu pada "pelanggaran" (laporan axe), tetapi tetap menangkap "Anggaran",
// "anggarannya", dan "anggaran_total". MOCK_PRICING (harga langganan SaaS) sengaja di luar cakupan penjaga.

/** Token terlarang di seluruh kode sumber `src/` (tipe, seed, store, komponen, komentar). */
export const SOURCE_FORBIDDEN = [
  { name: "budget", re: /budget/i },
  { name: "anggaran", re: /(?<!\p{L})anggaran/iu },
  { name: "formatRupiah", re: /formatRupiah/ },
];

/** Teks terlarang di UI halaman aplikasi (HTML prerender dan DOM): kata anggaran dan nominal rupiah. */
export const UI_FORBIDDEN = [
  { name: "budget", re: /budget/i },
  { name: "anggaran", re: /(?<!\p{L})anggaran/iu },
  { name: "nominal Rp", re: /(?<!\p{L})Rp\.?\s?\d/iu },
  { name: "IDR", re: /(?<!\p{L})IDR(?!\p{L})/u },
];

/** Nama kunci data (tipe/seed/store) yang tidak boleh ada di model bisnis. */
export const KEY_FORBIDDEN = /budget|anggaran|biaya|spent/i;

/** Semua token terlarang yang ditemukan pada teks, sebagai daftar `nama: cuplikan`. */
export function findForbidden(text, patterns) {
  const hits = [];
  for (const { name, re } of patterns) {
    const m = re.exec(text);
    if (m) hits.push(`${name}: "${text.slice(Math.max(0, m.index - 20), m.index + 30).replace(/\s+/g, " ")}"`);
  }
  return hits;
}
