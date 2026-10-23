// Verifikasi kontras WCAG 2.x untuk pasangan warna PROYEKIN.
// Sumber token: src/app/globals.css. Jalankan: npm run check:contrast
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

const raw = {};
for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) raw[m[1]] = m[2].trim();

function resolve(name, seen = new Set()) {
  const value = raw[name];
  if (value === undefined) throw new Error(`Token tidak ditemukan: ${name}`);
  const ref = value.match(/^var\(--color-([a-z0-9-]+)\)$/);
  if (ref) {
    if (seen.has(name)) throw new Error(`Referensi melingkar: ${name}`);
    return resolve(ref[1], seen.add(name));
  }
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`Bukan hex 6 digit: ${name}=${value}`);
  return value;
}

const lin = (v) => {
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(resolve(a)), lum(resolve(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

// [foreground, background, minimum, keterangan]
const T = 4.5; // teks normal (AA)
const U = 3; // komponen UI / teks besar (AA)
const lightBgs = ["surface", "canvas", "highlight", "muted"];
const pairs = [
  ...lightBgs.flatMap((bg) => [
    ["charcoal", bg, T, "teks utama"],
    ["graphite", bg, T, "teks sekunder"],
    ["muted-foreground", bg, T, "caption / placeholder / disabled"],
    ["brand-text", bg, T, "teks/tautan oranye"],
  ]),
  // Teks semantic hanya untuk latar terang non-muted (success/warning ~4.4:1 di muted).
  ...["surface", "canvas", "highlight"].flatMap((bg) => [
    ["success", bg, T, "teks success"],
    ["warning", bg, T, "teks warning"],
    ["danger", bg, T, "teks error"],
    ["info", bg, T, "teks info"],
  ]),
  ["primary-foreground", "primary", T, "teks tombol primer"],
  ["primary-foreground", "primary-hover", T, "teks tombol primer (hover)"],
  ["primary-foreground", "primary-active", T, "teks tombol primer (active)"],
  ["surface", "charcoal", T, "teks putih di tombol charcoal"],
  ["surface", "brand-700", T, "teks putih di oranye tua"],
  ["success", "success-soft", T, "badge success"],
  ["warning", "warning-soft", T, "badge warning"],
  ["danger", "danger-soft", T, "badge error"],
  ["info", "info-soft", T, "badge info"],
  ["secondary-foreground", "secondary", T, "teks tombol secondary"],
  ["secondary-foreground", "secondary-hover", T, "teks tombol secondary (hover)"],
  ["destructive-foreground", "destructive", T, "teks tombol destructive"],
  ["destructive-foreground", "destructive-hover", T, "teks tombol destructive (hover)"],
  ["accent-foreground", "accent", T, "item terpilih / hover outline"],
  ["card-foreground", "card", T, "teks di card"],
  ["popover-foreground", "popover", T, "teks di dialog/popover"],
  ["input", "surface", U, "border input"],
  ["input", "canvas", U, "border input di canvas"],
  ["input", "muted", U, "border input di latar muted"],
  ["ring", "surface", U, "focus ring"],
  ["ring", "canvas", U, "focus ring di canvas"],
  ["ring", "primary", U, "focus ring di atas oranye"],
];

let failed = 0;
for (const [fg, bg, min, note] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1 (min ${min})  ${fg} / ${bg}  — ${note}`);
}
console.log(`\n${pairs.length - failed}/${pairs.length} pasangan lolos.`);
console.log(
  `CATATAN: primary (oranye) di atas surface hanya ${ratio("primary", "surface").toFixed(2)}:1 (< ${U}:1). ` +
    "Jangan pakai #E68D1F sendirian sebagai teks, ikon, atau border di latar terang; " +
    "pakai sebagai latar (teks charcoal), atau gunakan brand-text/charcoal.",
);
process.exit(failed ? 1 : 0);
