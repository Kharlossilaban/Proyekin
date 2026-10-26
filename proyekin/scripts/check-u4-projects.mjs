// Pemeriksaan U4-4 di browser (Chrome via CDP, dev server): daftar proyek /proyek per role.
// Persona: Budi (Owner), Siti (Admin Kantor), Ahmad dan Eko (Mandor), Dewi (Anggota Tim), Guest, dan tiga akun uji sementara
// tanpa proyek (Admin Kantor, Mandor, Anggota Tim) untuk state kosong. Akun uji ditulis sementara ke src/data/mock.ts dan SELALU dipulihkan.
// Cakupan: lingkup daftar per role (literal, sengaja bukan dihitung dari access.ts), proyek runtime di luar lingkup,
// state kosong, navigasi ke detail (klik/ketuk, tanpa muat ulang), isi kartu/baris, tanpa tampilan anggaran,
// HTML prerender tanpa data proyek, 1280/768/375 (overflow, axe), Mandor dan Anggota 375px mobile:true + sentuhan
// (satu kolom, target sentuh >= 44px, seluruh kartu dapat diketuk, tanpa aksi hover-only).
// Representasi UI mock, BUKAN otorisasi. Jalankan: npm run check:u4-projects [-- <folder-bukti>]
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { createBrowser, sleep, waitFor } from "./lib/cdp.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(process.argv[2] ?? join(ROOT, ".u4-projects-check"));
const APP_PORT = 3500;
const BASE = `http://localhost:${APP_PORT}`;
const SESSION_KEY = "proyekin-demo-session";
mkdirSync(OUT, { recursive: true });

const results = { checks: [], matrix: {}, measurements: {}, notes: [], failures: [] };
const rec = (name, ok, detail = "") => {
  results.checks.push({ name, ok: !!ok, detail });
  if (!ok) {
    results.failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log("FAIL:", name, detail);
  } else console.log("ok:  ", name, detail);
};
const q = (s) => JSON.stringify(s);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- data harapan (literal) ----
const ALL_P = ["p-001", "p-002", "p-003", "p-004", "p-005"];
const PERSONAS = [
  { key: "budi", name: "Budi Santoso", role: "Owner", id: "u-001", projects: ALL_P },
  { key: "siti", name: "Siti Aminah", role: "Admin Kantor", id: "u-002", projects: ["p-001", "p-002"] },
  { key: "ahmad", name: "Ahmad Rizal", role: "Mandor", id: "u-003", projects: ["p-001", "p-002"] },
  { key: "eko", name: "Eko Prasetyo", role: "Mandor", id: "u-005", projects: ["p-001", "p-002"] },
  { key: "dewi", name: "Dewi Lestari", role: "Anggota Tim", id: "u-004", projects: ["p-001"] },
];
const SEED_FACTS = {
  "p-001": { name: "Renovasi Gedung Kantor Batam", client: "PT. Properti Nusantara", status: "Berjalan", period: ["15 Jan 2026", "30 Jun 2026"] },
  "p-002": { name: "Pembangunan Gudang Logistik Tanjung Pinang", client: "CV. Jaya Abadi Logistics", status: "Berjalan", period: ["1 Mar 2026", "15 Sep 2026"] },
  "p-003": { name: "Pengerjaan Jalan Akses Pelabuhan", client: "Dinas PU Kepulauan Riau", status: "Tertunda", period: ["1 Nov 2025", "30 Apr 2026"] },
  "p-004": { name: "Pembangunan Pos Keamanan Batang Tembesi", client: "PT. Batamindo Industri Perkasa", status: "Selesai", period: ["1 Jun 2025", "31 Okt 2025"] },
  "p-005": { name: "Perbaikan Jembatan Kayu Angkut", client: "Desa Batu Angkut", status: "Arsip", period: ["1 Agu 2024", "31 Des 2024"] },
};

// ---- server, browser, utilitas ----
const MOCK_FILE = join(ROOT, "src/data/mock.ts");
const MOCK_ORIGINAL = readFileSync(MOCK_FILE, "utf8");
const restoreMock = () => {
  try {
    if (readFileSync(MOCK_FILE, "utf8") !== MOCK_ORIGINAL) writeFileSync(MOCK_FILE, MOCK_ORIGINAL);
  } catch {
    /* tidak ada yang bisa dipulihkan */
  }
};
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(APP_PORT)], { cwd: ROOT, stdio: "ignore" });
const browser = await createBrowser({ cdpPort: 9666 });
const { send, evaluate, setViewport, tap, tapAt } = browser;
const cleanup = () => {
  restoreMock();
  try {
    dev.kill();
  } catch {
    /* sudah berhenti */
  }
  browser.close();
};
process.on("exit", cleanup);
process.on("SIGINT", () => process.exit(130));
process.on("unhandledRejection", (error) => {
  console.error("GALAT:", error instanceof Error ? error.message : error);
  process.exit(1);
});
await waitFor(async () => (await fetch(`${BASE}/masuk`)).ok, 120000, "dev server");

const axeSource = readFileSync(join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
const AXE_RUN = `(async () => {
  const r = await axe.run({ exclude: [["nextjs-portal"]] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
  return r.violations.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " :: " + (n.failureSummary || "").split("\\n").slice(0, 2).join(" | ")) }));
})()`;

// Pengamat: mencatat bila daftar proyek (kartu/baris/empty/daftar) PERNAH terlihat. Kunci dibaca dari sessionStorage.
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => { const check = () => { try { const sel = sessionStorage.getItem("__watchSel"); if (!sel) return;
    if ([...document.querySelectorAll(sel)].some((e) => e.checkVisibility())) sessionStorage.setItem("__seenGuarded", "1"); } catch {} };
    new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true }); })();`,
});
const LIST_SEL = '[data-slot="project-row"], [data-slot="project-card"], [data-slot="project-empty"]';
const watch = () => evaluate(`(() => { sessionStorage.removeItem("__seenGuarded"); sessionStorage.setItem("__watchSel", ${q(LIST_SEL)}); })()`);
const seenGuarded = () => evaluate(`sessionStorage.getItem("__seenGuarded") === "1"`);
const unwatch = () => evaluate(`sessionStorage.removeItem("__watchSel"); sessionStorage.removeItem("__seenGuarded");`);

async function navigate(path) {
  await send("Page.navigate", { url: `${BASE}${path}` });
  await waitFor(() => evaluate(`document.readyState === "complete"`), 90000, `muat ${path}`);
  await evaluate(`document.fonts.ready.then(() => true)`);
}
/** Hasil akhir halaman daftar: denied | ready (daftar siap) | detail | not-found. */
const outcome = () =>
  waitFor(
    () =>
      evaluate(`(() => {
        if (location.pathname === "/akses-ditolak" && document.querySelector("h1")?.textContent === "Akses tidak tersedia") return "denied";
        const vis = (sel) => [...document.querySelectorAll(sel)].some((e) => e.checkVisibility());
        if (vis('[data-detail="not-found"]')) return "not-found";
        if (vis('[data-detail="found"]')) return "detail";
        if (vis('[data-slot="project-list"][data-state="ready"]')) return "ready";
        return null;
      })()`),
    20000,
    "hasil halaman",
  ).catch(() => "timeout");
async function ensureAxe() {
  if (!(await evaluate(`typeof window.axe !== "undefined"`))) await evaluate(axeSource);
}
async function checkAxe(label) {
  await ensureAxe();
  const v = await evaluate(AXE_RUN);
  results.measurements[`axe ${label}`] = v;
  rec(`axe 0 pelanggaran: ${label}`, v.length === 0, v.map((x) => `${x.id}: ${x.nodes.join("; ")}`).join(" || "));
}
async function checkOverflow(label) {
  const o = await evaluate(`({ s: document.documentElement.scrollWidth, w: window.innerWidth })`);
  rec(`overflow halaman: ${label}`, o.s <= o.w + 1, `${o.s} <= ${o.w}`);
}
async function shot(name) {
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
}
const clickEl = (sel) => evaluate(`(() => { const el = document.querySelector(${q(sel)}); if (!el) throw new Error("tidak ada: " + ${q(sel)}); el.click(); return true; })()`);
const MARK = "__u44Marker";
const setMark = () => evaluate(`window.${MARK} = "m" + Date.now(); window.${MARK}`);
const markIs = (m) => evaluate(`window.${MARK} === ${q(m)}`);
async function setSession(userId) {
  await navigate("/masuk");
  await evaluate(`sessionStorage.clear(); ${userId ? `sessionStorage.setItem(${q(SESSION_KEY)}, JSON.stringify({ userId: ${q(userId)}, loginAt: new Date().toISOString() }))` : ""}`);
}
/** ID proyek yang TERLIHAT, dari tabel (desktop) atau kartu (di bawah lg). */
const visibleIds = (kind) =>
  evaluate(`[...document.querySelectorAll(${q(kind === "table" ? '[data-slot="project-row"]' : '[data-slot="project-card"]')})].filter((e) => e.checkVisibility()).map((e) => e.getAttribute("data-project-id"))`);
const visibleText = (kind, id) =>
  evaluate(`(() => { const e = document.querySelector(${q(`${kind === "table" ? '[data-slot="project-row"]' : '[data-slot="project-card"]'}[data-project-id="${id}"]`)}); return e && e.checkVisibility() ? e.textContent.replace(/\\s+/g, " ").trim() : null; })()`);
const gotoList = async (userId, path = "/proyek") => {
  await setSession(userId);
  await navigate(path);
  return outcome();
};

// ================= 0. HTML prerender tidak memuat daftar proyek =================
{
  const html = await (await fetch(`${BASE}/proyek`)).text();
  rec("HTML /proyek: tidak memuat nama proyek seed (daftar dihitung setelah sesi diketahui)", !Object.values(SEED_FACTS).some((f) => html.includes(f.name)));
  rec("HTML /proyek: tidak memuat kartu/baris proyek", !html.includes('data-slot="project-card"') && !html.includes('data-slot="project-row"'));
}

// ================= A. 1280px desktop: lingkup, isi, navigasi per persona =================
await setViewport({ width: 1280, height: 900 });
for (const p of PERSONAS) {
  results.matrix[p.key] = { visible: null, others: null };
  const got = await gotoList(p.id);
  rec(`${p.key} (${p.role}): /proyek siap`, got === "ready", got);
  const ids = await visibleIds("table");
  results.matrix[p.key].visible = ids;
  rec(`${p.key} (${p.role}): tabel hanya memuat proyek dalam lingkup`, same(ids, p.projects), JSON.stringify(ids));
  const notIn = ALL_P.filter((id) => !p.projects.includes(id));
  const leaked = await evaluate(`${q(notIn)}.filter((id) => document.querySelector('[data-project-id="' + id + '"]') && [...document.querySelectorAll('[data-project-id="' + id + '"]')].some((e) => e.checkVisibility()))`);
  results.matrix[p.key].others = notIn.map((id) => ({ id, shown: leaked.includes(id) }));
  rec(`${p.key}: proyek di luar lingkup (${notIn.join(", ") || "tidak ada"}) tidak tampil`, leaked.length === 0, JSON.stringify(leaked));
  rec(`${p.key}: kartu mobile tersembunyi di 1280 (tidak ada duplikasi tampilan)`, (await visibleIds("cards")).length === 0);
  const desc = await evaluate(`document.querySelector('[data-slot="page-header"] p')?.textContent`);
  rec(`${p.key}: ringkasan jumlah "${p.projects.length} proyek"`, desc?.startsWith(`${p.projects.length} proyek`), desc);
  rec(`${p.key}: DemoDataNotice tampil dan tidak mengklaim data tersimpan`, await evaluate(`(() => { const n = document.querySelector('[data-slot="demo-data-notice"]'); return !!n && n.checkVisibility() && n.textContent.includes("memori tab ini") && n.textContent.includes("Tidak ada data yang dikirim atau disimpan ke server"); })()`));
  const noCrud = await evaluate(`[...document.querySelectorAll('[data-slot="project-list"] button')].filter((b) => b.checkVisibility()).map((b) => b.textContent.trim())`);
  rec(`${p.key}: tidak ada tombol bisnis (tambah/ubah/hapus) di daftar`, noCrud.length === 0, JSON.stringify(noCrud));
  const money = await evaluate(`/Rp|IDR|anggaran/i.test(document.querySelector('[data-slot="project-list"]').textContent)`);
  rec(`${p.key}: anggaran tidak ditampilkan`, !money);
  for (const id of p.projects) {
    const f = SEED_FACTS[id];
    const text = await visibleText("table", id);
    rec(
      `${p.key}: baris ${id} memuat nama, klien, status ${f.status}, periode`,
      !!text && text.includes(f.name) && text.includes(f.client) && text.includes(f.status) && f.period.every((d) => text.includes(d)),
      text ?? "tidak tampil",
    );
    if (id === "p-005") rec(`${p.key}: proyek Arsip p-005 ditandai Hanya baca`, text.includes("Hanya baca"));
    else rec(`${p.key}: ${id} tidak ditandai Hanya baca`, !text.includes("Hanya baca"));
  }
  await checkAxe(`${p.key} /proyek 1280`);
  await checkOverflow(`${p.key} /proyek 1280`);
  await shot(`${p.key}-proyek-1280`);

  // klik baris → detail (navigasi klien, tanpa muat ulang)
  const target = p.projects[0];
  const mark = await setMark();
  await clickEl(`[data-slot="project-row"][data-project-id="${target}"] a`);
  await waitFor(async () => ((await evaluate(`location.pathname`)) === `/proyek/${target}` ? true : null), 15000, "path detail");
  const res = await outcome();
  rec(`${p.key}: klik baris ${target} membuka detail tanpa muat ulang`, res === "detail" && (await markIs(mark)), res);
}

// ================= B. 768px: kartu dua kolom =================
await setViewport({ width: 768, height: 1024 });
for (const p of PERSONAS.filter((x) => ["budi", "siti", "ahmad", "dewi"].includes(x.key))) {
  const got = await gotoList(p.id);
  const ids = await visibleIds("cards");
  rec(`${p.key} 768: kartu sesuai lingkup`, got === "ready" && same(ids, p.projects), JSON.stringify(ids));
  rec(`${p.key} 768: tabel tersembunyi`, (await visibleIds("table")).length === 0);
  await checkOverflow(`${p.key} /proyek 768`);
  await checkAxe(`${p.key} /proyek 768`);
  if (p.key === "budi") await shot("budi-proyek-768");
}

// ================= C. 375px mobile:true + sentuhan: Mandor (utama), Anggota Tim, Admin, Owner =================
await setViewport({ width: 375, height: 800, mobile: true, touch: true });
for (const p of PERSONAS) {
  const got = await gotoList(p.id);
  rec(`${p.key} mobile 375: emulasi sentuh aktif`, (await evaluate(`navigator.maxTouchPoints`)) > 0 && (await evaluate(`innerWidth`)) === 375);
  const ids = await visibleIds("cards");
  rec(`${p.key} mobile 375: kartu sesuai lingkup`, got === "ready" && same(ids, p.projects), JSON.stringify(ids));
  rec(`${p.key} mobile 375: tabel tersembunyi`, (await visibleIds("table")).length === 0);
  await checkOverflow(`${p.key} /proyek 375 mobile`);
  await checkAxe(`${p.key} /proyek 375 mobile`);
  const geo = await evaluate(`[...document.querySelectorAll('[data-slot="project-card"]')].filter((e) => e.checkVisibility()).map((e) => { const r = e.getBoundingClientRect(); const a = e.querySelector("a"); const ar = a.getBoundingClientRect(); return { id: e.getAttribute("data-project-id"), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height), linkH: Math.round(ar.height) }; })`);
  results.measurements[`kartu ${p.key} 375`] = geo;
  rec(`${p.key} mobile 375: satu kolom (semua kartu selebar sama dan tidak melewati viewport)`, geo.length > 0 && geo.every((g) => g.left === geo[0].left && g.w === geo[0].w && g.right <= 375), JSON.stringify(geo.map((g) => `${g.left}/${g.w}`)));
  rec(`${p.key} mobile 375: setiap kartu >= 44px (area sentuh)`, geo.every((g) => g.h >= 44 && g.w >= 44), JSON.stringify(geo.map((g) => `${g.w}x${g.h}`)));
  // seluruh kartu adalah satu target: titik-titik di dalam kartu (sudut, tengah, bawah) jatuh pada tautan kartu itu sendiri
  const hits = await evaluate(`[...document.querySelectorAll('[data-slot="project-card"]')].filter((e) => e.checkVisibility()).map((e) => { e.scrollIntoView({ block: "nearest" }); const r = e.getBoundingClientRect(); const a = e.querySelector("a"); if (r.top < 0 || r.bottom > innerHeight) return false; return [[r.left + 6, r.top + 6], [r.right - 6, r.top + 6], [r.left + r.width / 2, r.top + r.height / 2], [r.left + 6, r.bottom - 6], [r.right - 6, r.bottom - 6]].every(([x, y]) => document.elementFromPoint(x, y) === a); })`);
  rec(`${p.key} mobile 375: seluruh area kartu menjadi tautan ke detail (tidak hanya teks judul)`, hits.length > 0 && hits.every(Boolean), JSON.stringify(hits));
  const hidden = await evaluate(`[...document.querySelectorAll('[data-slot="project-card"] a')].every((a) => getComputedStyle(a).opacity !== "0" && getComputedStyle(a).visibility !== "hidden")`);
  rec(`${p.key} mobile 375: aksi utama tampil permanen (bukan hover-only)`, hidden);
  await evaluate(`window.scrollTo(0, 0)`);
  await shot(`${p.key}-proyek-375`);

  // ketuk area kartu (bukan teks judul): bagian bawah kartu pertama → detail, tanpa muat ulang
  const target = p.projects[0];
  const mark = await setMark();
  const pt = await evaluate(`(() => { const e = document.querySelector('[data-slot="project-card"][data-project-id="${target}"]'); e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return { x: r.left + r.width - 20, y: r.bottom - 10 }; })()`);
  await sleep(100);
  const pt2 = await evaluate(`(() => { const r = document.querySelector('[data-slot="project-card"][data-project-id="${target}"]').getBoundingClientRect(); return { x: r.left + r.width - 20, y: r.bottom - 10 }; })()`);
  await tapAt(pt2.x ?? pt.x, pt2.y ?? pt.y);
  await waitFor(async () => ((await evaluate(`location.pathname`)) === `/proyek/${target}` ? true : null), 15000, "ketuk kartu");
  const res = await outcome();
  rec(`${p.key} mobile 375: ketuk area kartu ${target} membuka detail tanpa muat ulang`, res === "detail" && (await markIs(mark)), res);
  await checkOverflow(`${p.key} detail ${target} 375 mobile`);
}

// Mandor: alur lengkap dari login (ketuk) → /tugas → drawer → Proyek → daftar → ketuk kartu
{
  await setViewport({ width: 375, height: 800, mobile: true, touch: true });
  await navigate("/masuk");
  await evaluate(`sessionStorage.clear()`);
  await navigate("/masuk");
  await evaluate(`(() => { const set = (sel, v) => { const el = document.querySelector(sel); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); }; set("#email", "ahmad@proyekin.id"); set("#password", "kata-sandi-demo-1"); })()`);
  await tap('form button[type="submit"]');
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/tugas" ? true : null), 20000, "login Mandor");
  await sleep(500);
  const mark = await setMark();
  await tap('[aria-label="Buka navigasi"]');
  await waitFor(() => evaluate(`!!document.querySelector('[data-slot="sidebar-mobile"]')`), 5000, "drawer");
  await sleep(250);
  await tap('[data-slot="sidebar-mobile"] nav a[href="/proyek"]');
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/proyek" ? true : null), 10000, "menu Proyek");
  rec("ahmad (Mandor) mobile: login → /tugas → drawer → Proyek → daftar tanpa muat ulang", (await outcome()) === "ready" && (await markIs(mark)) && same(await visibleIds("cards"), ["p-001", "p-002"]));
  await shot("ahmad-alur-proyek-375");
  await tap('[data-slot="project-card"][data-project-id="p-002"] a');
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/proyek/p-002" ? true : null), 15000, "ketuk p-002");
  rec("ahmad (Mandor) mobile: ketuk kartu p-002 → detail p-002 (berhak)", (await outcome()) === "detail" && (await markIs(mark)));
}

// ================= D. Proyek runtime (dibuat di memori) di luar/ dalam lingkup =================
// Proyek runtime tidak punya adminId dan tidak punya anggota: hanya Owner yang melihatnya.
async function runtimeCase(key, userId, expectRuntime) {
  await setViewport({ width: 1280, height: 900 });
  await setSession(userId);
  await navigate("/u4-spike");
  await waitFor(() => evaluate(`!!document.querySelector('[data-spike-action="create-project-push"]')`), 30000, "halaman uji");
  await sleep(300);
  const mark = await setMark();
  await clickEl('[data-spike-action="create-project-push"]');
  await waitFor(async () => (["/proyek/p-006", "/akses-ditolak"].includes(await evaluate(`location.pathname`)) ? true : null), 20000, "setelah buat proyek");
  await outcome();
  if ((await evaluate(`location.pathname`)) !== "/proyek/p-006") {
    await evaluate(`history.back()`);
    await waitFor(async () => ((await evaluate(`location.pathname`)) === "/u4-spike" ? true : null), 15000, "kembali ke /u4-spike");
    await sleep(300);
  }
  await clickEl('[data-slot="sidebar-desktop"] nav a[href="/proyek"]');
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/proyek" ? true : null), 15000, "menu Proyek");
  await outcome();
  const ids = await visibleIds("table");
  const expected = expectRuntime ? [...ALL_P, "p-006"] : PERSONAS.find((x) => x.key === key).projects;
  rec(`${key}: daftar setelah proyek runtime p-006 dibuat (navigasi klien, tanpa muat ulang)`, same(ids, expected) && (await markIs(mark)), JSON.stringify(ids));
  rec(`${key}: proyek runtime p-006 ${expectRuntime ? "tampil" : "tidak tampil"}`, ids.includes("p-006") === expectRuntime);
  if (expectRuntime) {
    const text = await visibleText("table", "p-006");
    rec("budi: baris proyek runtime memuat nama, klien, status Draf", !!text && text.includes("Proyek uji runtime") && text.includes("(uji)") && text.includes("Draf"), text ?? "");
    await shot("budi-proyek-runtime-1280");
    const mark2 = await setMark();
    await clickEl('[data-slot="project-row"][data-project-id="p-006"] a');
    await waitFor(async () => ((await evaluate(`location.pathname`)) === "/proyek/p-006" ? true : null), 15000, "detail runtime");
    rec("budi: klik proyek runtime membuka detail p-006", (await outcome()) === "detail" && (await markIs(mark2)));
  }
  await evaluate(`sessionStorage.clear()`);
}
await runtimeCase("budi", "u-001", true);
await runtimeCase("siti", "u-002", false);
await runtimeCase("ahmad", "u-003", false);
await runtimeCase("dewi", "u-004", false);

// ================= E. Tanpa sesi (mode pengembangan) =================
await setViewport({ width: 1280, height: 900 });
{
  await navigate("/masuk");
  await evaluate(`sessionStorage.clear()`);
  await navigate("/proyek");
  const got = await outcome();
  rec("tanpa sesi (Owner demo, mode pengembangan): daftar memuat semua proyek seed", got === "ready" && same(await visibleIds("table"), ALL_P), JSON.stringify(await visibleIds("table")));
}

// ================= F. Akun uji sementara: state kosong dan Guest (mock.ts selalu dipulihkan) =================
{
  const HEAD = /export const MOCK_USERS: User\[\] = \[\r?\n/;
  if (!HEAD.test(MOCK_ORIGINAL)) throw new Error("MOCK_USERS tidak ditemukan; sesuaikan pengujian");
  const TEMP = [
    { id: "u-uji-admin", name: "Admin Uji Kosong", email: "admin.uji@contoh.co.id", role: "ADMIN" },
    { id: "u-uji-mandor", name: "Mandor Uji Kosong", email: "mandor.uji@contoh.co.id", role: "MANDOR" },
    { id: "u-uji-anggota", name: "Anggota Uji Kosong", email: "anggota.uji@contoh.co.id", role: "ANGGOTA" },
    { id: "u-uji-guest", name: "Tamu Uji", email: "tamu.uji@contoh.co.id", role: "GUEST" },
  ];
  try {
    writeFileSync(MOCK_FILE, MOCK_ORIGINAL.replace(HEAD, (h) => `${h}${TEMP.map((u) => `  { id: "${u.id}", name: "${u.name}", email: "${u.email}", role: "${u.role}" },\n`).join("")}`));
    await waitFor(async () => {
      await navigate("/masuk");
      return evaluate(`document.body.textContent.includes(${q(TEMP[3].email)})`);
    }, 90000, "akun uji termuat");

    for (const [viewport, label] of [[{ width: 1280, height: 900 }, "1280"], [{ width: 375, height: 800, mobile: true, touch: true }, "375 mobile"]]) {
      await setViewport(viewport);
      for (const u of TEMP.slice(0, 3)) {
        const got = await gotoList(u.id);
        rec(`${u.role} tanpa proyek (${label}): halaman siap`, got === "ready", got);
        const empty = await evaluate(`(() => { const e = document.querySelector('[data-slot="project-empty"]'); return e && e.checkVisibility() ? e.textContent.replace(/\\s+/g, " ").trim() : null; })()`);
        rec(`${u.role} tanpa proyek (${label}): state kosong tampil`, !!empty && empty.includes("Belum ada proyek yang dapat Anda akses"), empty ?? "tidak tampil");
        rec(`${u.role} tanpa proyek (${label}): tidak ada kartu, baris, atau tautan detail`, (await visibleIds("table")).length === 0 && (await visibleIds("cards")).length === 0 && !(await evaluate(`!!document.querySelector('[data-slot="project-list"] a[href^="/proyek/"]')`)));
        const desc = await evaluate(`document.querySelector('[data-slot="page-header"] p')?.textContent`);
        rec(`${u.role} tanpa proyek (${label}): ringkasan "0 proyek"`, desc?.startsWith("0 proyek"), desc);
        await checkOverflow(`${u.role} kosong ${label}`);
        await checkAxe(`${u.role} kosong ${label}`);
        if (u.role === "ADMIN" || label === "375 mobile") await shot(`kosong-${u.id.replace("u-uji-", "")}-${label.replace(" ", "-")}`);
      }
    }

    // Guest: tanpa App Shell, daftar tidak pernah terlihat
    await setViewport({ width: 1280, height: 900 });
    await setSession(TEMP[3].id);
    await watch();
    await navigate("/proyek");
    const got = await outcome();
    rec("guest: URL langsung /proyek → akses ditolak", got === "denied", got);
    rec("guest: daftar proyek (kartu/baris/state kosong) tidak pernah terlihat", !(await seenGuarded()));
    rec("guest: tanpa sidebar App Shell", !(await evaluate(`!!document.querySelector('[data-slot="sidebar-desktop"]')`)));
    rec("guest: tidak ada nama proyek di halaman", !(await evaluate(`${q(Object.values(SEED_FACTS).map((f) => f.name))}.some((n) => [...document.querySelectorAll("*")].some((e) => e.checkVisibility?.() && e.children.length === 0 && e.textContent.includes(n)))`)));
    await shot("guest-akses-ditolak-1280");
    await unwatch();
  } finally {
    restoreMock();
  }
}
await evaluate(`sessionStorage.clear()`);

writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
const total = results.checks.length;
console.log(results.failures.length ? `\n${results.failures.length} masalah dari ${total} pemeriksaan.` : `\nSemua ${total} pemeriksaan lolos.`);
cleanup();
process.exit(results.failures.length ? 1 : 0);
