// Penjaga statis "tanpa anggaran" (keputusan final Owner 2026-10-28, F2). Tanpa browser dan tanpa dependency baru.
// Memastikan fitur anggaran proyek tidak muncul kembali di kode sumber maupun model bisnis:
//   1. Seluruh src/ (ts, tsx, css, mjs, json, md): nol token budget / anggaran / formatRupiah (komentar ikut diperiksa).
//   2. Model data: kunci Project persis himpunan yang diizinkan; tidak ada kunci anggaran di seed, MOCK_STATS, maupun
//      hasil createProject; penelusuran dalam atas SEMUA ekspor mock.ts (kunci dan teks).
//   3. formatRupiah tidak lagi diekspor lib/utils.ts.
//   4. Dipertahankan sengaja: MOCK_PRICING (harga langganan SaaS, kelas C) dan data legacy Document/RAB (U5).
// Halaman aplikasi (HTML dan DOM) diperiksa terpisah di check-u4-projects.mjs. Jalankan: npm run check:no-budget
import "./lib/register-ts.mjs";

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { findForbidden, KEY_FORBIDDEN, SOURCE_FORBIDDEN } from "./lib/no-budget.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const load = (rel) => import(pathToFileURL(join(SRC, rel)).href);

const failures = [];
let passed = 0;
function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    return;
  }
  failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log("FAIL:", name, detail);
}

// ---------- 1. kode sumber ----------
const files = readdirSync(SRC, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && /\.(ts|tsx|css|mjs|json|md)$/.test(e.name))
  .map((e) => join(e.parentPath, e.name));
check("sumber: src/ memuat berkas yang diperiksa", files.length > 50, `${files.length} berkas`);
const sourceHits = files.flatMap((f) => findForbidden(readFileSync(f, "utf8"), SOURCE_FORBIDDEN).map((h) => `${f.slice(SRC.length + 1).replace(/\\/g, "/")} → ${h}`));
check("sumber: nol token budget/anggaran/formatRupiah di seluruh src/ (termasuk komentar)", sourceHits.length === 0, sourceHits.join(" | "));

// ---------- 2. model data ----------
const mock = await load("data/mock.ts");
const store = await load("lib/mock-store.ts");
const utils = await load("lib/utils.ts");

const PROJECT_KEYS = ["adminId", "client", "code", "description", "endDate", "id", "location", "managerId", "name", "progress", "startDate", "status"];
const keysOf = (o) => Object.keys(o).sort();
check("model: seed memuat 5 proyek", mock.MOCK_PROJECTS.length === 5);
for (const p of mock.MOCK_PROJECTS) {
  const extra = keysOf(p).filter((k) => !PROJECT_KEYS.includes(k));
  check(`model: proyek ${p.id} hanya memuat kunci Project yang diizinkan`, extra.length === 0, `kunci tak dikenal: ${extra.join(", ")}`);
  check(`model: proyek ${p.id} tanpa kunci anggaran/biaya`, !keysOf(p).some((k) => KEY_FORBIDDEN.test(k)));
}
const REQUIRED = ["id", "code", "name", "description", "status", "startDate", "endDate", "progress", "client", "location"];
check("model: setiap proyek seed tetap memuat seluruh kunci wajib Project", mock.MOCK_PROJECTS.every((p) => REQUIRED.every((k) => k in p)));

const created = store.createProject({ name: "Uji", description: "", status: "DRAFT", startDate: "2026-03-21", endDate: "2026-03-21", progress: 0, client: "-", location: "-" });
store.resetMockStore();
check("model: hasil createProject hanya memuat kunci yang diizinkan", keysOf(created).every((k) => PROJECT_KEYS.includes(k)), keysOf(created).join(","));
check("model: createProject tidak menambahkan kunci anggaran", !keysOf(created).some((k) => KEY_FORBIDDEN.test(k)));

check("model: MOCK_STATS tanpa kunci anggaran/biaya", !Object.keys(mock.MOCK_STATS).some((k) => KEY_FORBIDDEN.test(k)), Object.keys(mock.MOCK_STATS).join(","));

// penelusuran dalam semua ekspor mock.ts: kunci dan nilai teks
const found = [];
const seen = new Set();
function walk(value, path) {
  if (value === null || typeof value !== "object") {
    if (typeof value === "string") for (const h of findForbidden(value, SOURCE_FORBIDDEN)) found.push(`${path} (nilai) → ${h}`);
    return;
  }
  if (seen.has(value)) return;
  seen.add(value);
  for (const [k, v] of Object.entries(value)) {
    if (!Array.isArray(value) && KEY_FORBIDDEN.test(k)) found.push(`${path}.${k} (kunci)`);
    walk(v, Array.isArray(value) ? `${path}[${k}]` : `${path}.${k}`);
  }
}
for (const [name, value] of Object.entries(mock)) walk(value, name);
check("model: tidak ada kunci atau teks anggaran di seluruh ekspor mock.ts", found.length === 0, found.slice(0, 5).join(" | "));

// ---------- 3. util ----------
check("util: formatRupiah tidak lagi diekspor lib/utils.ts", !("formatRupiah" in utils), Object.keys(utils).join(","));

// ---------- 4. yang sengaja dipertahankan ----------
check("dipertahankan: MOCK_PRICING (harga langganan SaaS) tetap diekspor dengan 3 paket", Array.isArray(mock.MOCK_PRICING) && mock.MOCK_PRICING.length === 3 && mock.MOCK_PRICING.every((p) => typeof p.price === "string"));
check("dipertahankan: data legacy Document (RAB, dievaluasi di U5) belum dihapus", mock.MOCK_DOCUMENTS.some((d) => d.id === "d-002"));
check("dipertahankan: tidak ada fitur keuangan pengganti (tidak ada ekspor mock berkunci keuangan)", !Object.keys(mock).some((k) => /finance|keuangan|cost|expense/i.test(k)), Object.keys(mock).join(","));

console.log(failures.length ? `\n${failures.length} masalah dari ${passed + failures.length} pemeriksaan.` : `\nSemua ${passed} pemeriksaan lolos.`);
process.exit(failures.length ? 1 : 0);
