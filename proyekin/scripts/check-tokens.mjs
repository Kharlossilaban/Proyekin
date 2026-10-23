// Mendeteksi warna mentah (hex atau palet default Tailwind) pada kode UI baru.
// Warna harus memakai design token dari src/app/globals.css.
// Jalankan: npm run check:tokens  (hanya peringatan; exit 1 dengan --strict)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const TARGETS = ["src/components", "src/app/style-guide"];
const strict = process.argv.includes("--strict");

const PALETTES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const RULES = [
  [/#[0-9a-fA-F]{3,8}\b/g, "hex mentah"],
  [new RegExp(`\\b(?:bg|text|border|ring|outline|fill|stroke|from|to|via|divide|decoration|shadow)-(?:${PALETTES})-\\d{2,3}\\b`, "g"), "palet default Tailwind"],
  [/\b(?:bg|text|border)-(?:black|white)\b/g, "black/white mentah (pakai surface/foreground)"],
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|css)$/.test(name)) yield p;
  }
}

let count = 0;
for (const target of TARGETS) {
  for (const file of walk(join(ROOT, target))) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const [re, label] of RULES) {
        for (const m of line.matchAll(re)) {
          count++;
          console.log(`${relative(ROOT, file)}:${i + 1}  ${m[0]}  — ${label}`);
        }
      }
    });
  }
}
console.log(count ? `\n${count} warna mentah ditemukan.` : "Tidak ada warna mentah. Semua memakai token.");
process.exit(strict && count ? 1 : 0);
