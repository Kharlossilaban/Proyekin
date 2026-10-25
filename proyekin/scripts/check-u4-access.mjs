// Pemeriksaan U4-3 di browser (Chrome via CDP, dev server): redirect login, menu, dan guard URL per persona.
// Persona: Budi (Owner), Siti (Admin Kantor), Ahmad (Mandor), Dewi (Anggota Tim), dan Guest.
// Cakupan: tujuan login, isi dan urutan menu, URL langsung ke tiap bagian aplikasi, navigasi KLIEN (tanpa muat ulang),
// detail proyek/tugas (berhak, tidak berhak, ID tidak dikenal, ID runtime), tampilan 375px mobile:true + sentuhan
// (drawer dan urutan menu), axe, overflow, dan "konten terlindung tidak pernah terlihat".
// Semua yang diuji adalah representasi UI mock, BUKAN otorisasi (lihat docs/u4-evidence/U4-3-ACCESS.md).
// Jalankan: npm run check:u4-access [-- <folder-bukti>]
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { createBrowser, sleep, waitFor } from "./lib/cdp.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(process.argv[2] ?? join(ROOT, ".u4-access-check"));
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

// ---- data harapan (literal; sengaja bukan dihitung dari access.ts) ----
const FULL_MENU = ["Dashboard", "Proyek", "Tugas", "Laporan", "Dokumen", "Anggota", "Pengaturan"];
const SECTIONS = { "/dashboard": "Dashboard", "/proyek": "Proyek", "/tugas": "Tugas", "/laporan": "Laporan Harian", "/dokumen": "Dokumen", "/anggota": "Anggota", "/pengaturan": "Pengaturan" };
const ALL_P = ["p-001", "p-002", "p-003", "p-004", "p-005"];
const ALL_T = ["t-001", "t-002", "t-003", "t-004", "t-005", "t-006"];
const PERSONAS = [
  { key: "budi", name: "Budi Santoso", role: "Owner", email: "budi@proyekin.id", id: "u-001", landing: "/dashboard", menu: FULL_MENU, sections: Object.keys(SECTIONS), projects: ALL_P, tasks: ALL_T },
  { key: "siti", name: "Siti Aminah", role: "Admin Kantor", email: "siti@proyekin.id", id: "u-002", landing: "/dashboard", menu: FULL_MENU, sections: Object.keys(SECTIONS), projects: ["p-001", "p-002"], tasks: ALL_T },
  { key: "ahmad", name: "Ahmad Rizal", role: "Mandor", email: "ahmad@proyekin.id", id: "u-003", landing: "/tugas", menu: ["Tugas", "Proyek", "Laporan", "Dokumen"], sections: ["/proyek", "/tugas", "/laporan", "/dokumen"], projects: ["p-001", "p-002"], tasks: ALL_T },
  { key: "dewi", name: "Dewi Lestari", role: "Anggota Tim", email: "dewi@proyekin.id", id: "u-004", landing: "/tugas", menu: ["Tugas", "Proyek", "Dokumen"], sections: ["/proyek", "/tugas", "/dokumen"], projects: ["p-001"], tasks: ["t-002", "t-006"] },
];

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
const { send, evaluate, setViewport, tap, pressKey } = browser;
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

// Pengamat: mencatat bila elemen yang dipantau (selector atau teks h1) PERNAH terlihat. Kunci dibaca dari sessionStorage.
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => { const check = () => { try { const sel = sessionStorage.getItem("__watchSel"); const h1 = sessionStorage.getItem("__watchH1"); let hit = false;
    if (sel) hit = [...document.querySelectorAll(sel)].some((e) => e.checkVisibility());
    if (!hit && h1) hit = [...document.querySelectorAll("h1")].some((h) => h.textContent.trim() === h1 && h.checkVisibility());
    if (hit) sessionStorage.setItem("__seenGuarded", "1"); } catch {} };
    new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true }); })();`,
});

const watch = (sel, h1) =>
  evaluate(`(() => { sessionStorage.removeItem("__seenGuarded"); ${sel ? `sessionStorage.setItem("__watchSel", ${q(sel)});` : `sessionStorage.removeItem("__watchSel");`} ${h1 ? `sessionStorage.setItem("__watchH1", ${q(h1)});` : `sessionStorage.removeItem("__watchH1");`} })()`);
const seenGuarded = () => evaluate(`sessionStorage.getItem("__seenGuarded") === "1"`);
const unwatch = () => evaluate(`sessionStorage.removeItem("__watchSel"); sessionStorage.removeItem("__watchH1"); sessionStorage.removeItem("__seenGuarded");`);

async function navigate(path) {
  await send("Page.navigate", { url: `${BASE}${path}` });
  await waitFor(() => evaluate(`document.readyState === "complete"`), 90000, `muat ${path}`);
  await evaluate(`document.fonts.ready.then(() => true)`);
}
/** Hasil akhir sebuah halaman: denied | not-found | allowed (menunggu keputusan guard). */
const outcome = (kind) =>
  waitFor(
    () =>
      evaluate(`(() => {
        if (location.pathname === "/akses-ditolak" && document.querySelector("h1")?.textContent === "Akses tidak tersedia") return "denied";
        const vis = (sel) => [...document.querySelectorAll(sel)].some((e) => e.checkVisibility());
        if (vis('[data-detail="not-found"]')) return "not-found";
        if (${q(kind)} === "detail" ? vis('[data-detail="found"]') : vis('[data-slot="access-guard"][data-guard-status="allowed"]')) return "allowed";
        return null;
      })()`),
    20000,
    `hasil ${kind}`,
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
const overflowNow = () => evaluate(`({ s: document.documentElement.scrollWidth, w: window.innerWidth })`);
async function checkOverflow(label) {
  const o = await overflowNow();
  rec(`overflow halaman: ${label}`, o.s <= o.w + 1, `${o.s} <= ${o.w}`);
}
async function shot(name) {
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
}
const sidebarLinks = (kind) => evaluate(`[...document.querySelectorAll('[data-slot="sidebar-${kind}"] nav a')].map((a) => a.textContent.trim())`);
const fill = (sel, value) =>
  evaluate(`(() => { const el = document.querySelector(${q(sel)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${q(value)}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
/** Setelah mengklik tautan klien: tunggu path berubah dari `from` (halaman asal masih tampak "allowed" sesaat). */
const afterClick = (from) => waitFor(async () => ((await evaluate(`location.pathname`)) !== from ? true : null), 15000, `path berubah dari ${from}`);const MARK = "__u43Marker";
const setMark = () => evaluate(`window.${MARK} = "m" + Date.now(); window.${MARK}`);
const markIs = (m) => evaluate(`window.${MARK} === ${q(m)}`);
const clickEl = (sel) => evaluate(`(() => { const el = document.querySelector(${q(sel)}); if (!el) throw new Error("tidak ada: " + ${q(sel)}); el.click(); return true; })()`);
async function setSession(userId) {
  await navigate("/masuk");
  await evaluate(`sessionStorage.clear(); ${userId ? `sessionStorage.setItem(${q(SESSION_KEY)}, JSON.stringify({ userId: ${q(userId)}, loginAt: new Date().toISOString() }))` : ""}`);
}

// ================= A. persona berhak: login, menu, URL langsung, detail =================
await setViewport({ width: 1280, height: 900 });
for (const p of PERSONAS) {
  results.matrix[p.key] = { sections: {}, projects: {}, tasks: {}, client: {} };

  // A1. login lewat form → tujuan sesuai role
  await navigate("/masuk");
  await evaluate(`sessionStorage.clear()`);
  await navigate("/masuk");
  await fill("#email", p.email);
  await fill("#password", "kata-sandi-demo-1");
  await clickEl('form button[type="submit"]');
  const landed = await waitFor(async () => ((await evaluate(`location.pathname`)) === p.landing ? p.landing : null), 20000, `login ${p.key}`).catch(() => null);
  rec(`${p.key} (${p.role}): login diarahkan ke ${p.landing}`, landed === p.landing, `path ${await evaluate("location.pathname")}`);
  await outcome("section");
  await sleep(300);
  const menu = await sidebarLinks("desktop");
  rec(`${p.key} (${p.role}): menu sidebar persis dan berurutan`, same(menu, p.menu), JSON.stringify(menu));
  rec(`${p.key}: halaman awal ${p.landing} adalah menu pertama`, menu[0] === (p.landing === "/dashboard" ? "Dashboard" : "Tugas"));
  results.matrix[p.key].menu = menu;
  // Layout desktop tidak berubah oleh follow-up target sentuh: tautan 36px (U2), Keluar 36px (Button sm), tanpa tombol Buka navigasi.
  const desk = await evaluate(`(() => { const h = (e) => Math.round(e.getBoundingClientRect().height); const out = [...document.querySelectorAll('[data-slot="sidebar-desktop"] nav a')].map(h); const logout = [...document.querySelectorAll('[data-slot="sidebar-desktop"] button')].find((b) => b.textContent.trim() === "Keluar"); const burger = document.querySelector('[aria-label="Buka navigasi"]'); return { links: out, logout: logout ? h(logout) : null, burgerVisible: !!burger && burger.checkVisibility() }; })()`);
  rec(`${p.key}: desktop tidak berubah (tautan 36px, Keluar 36px, tanpa tombol Buka navigasi)`, desk.links.length === p.menu.length && desk.links.every((h) => h === 36) && desk.logout === 36 && !desk.burgerVisible, JSON.stringify(desk));
  await checkAxe(`${p.key} ${p.landing} 1280`);
  await shot(`${p.key}-landing-1280`);

  // A2. URL langsung ke tiap bagian aplikasi
  for (const [path, h1] of Object.entries(SECTIONS)) {
    const expected = p.sections.includes(path) ? "allowed" : "denied";
    await watch(null, expected === "denied" ? h1 : null);
    await navigate(path);
    const got = await outcome("section");
    const leaked = expected === "denied" ? await seenGuarded() : false;
    results.matrix[p.key].sections[path] = got;
    rec(`${p.key}: URL langsung ${path} → ${expected}${expected === "denied" ? " (konten tidak pernah terlihat)" : ""}`, got === expected && !leaked, `hasil ${got}${leaked ? ", konten sempat terlihat" : ""}`);
  }

  // A3. detail proyek dan tugas (URL langsung)
  for (const id of [...ALL_P, "p-999"]) {
    const expected = id === "p-999" ? "not-found" : p.projects.includes(id) ? "allowed" : "denied";
    await watch(expected === "denied" ? '[data-detail="found"]' : null, null);
    await navigate(`/proyek/${id}`);
    const got = await outcome("detail");
    const leaked = expected === "denied" ? await seenGuarded() : false;
    results.matrix[p.key].projects[id] = got;
    rec(`${p.key}: detail /proyek/${id} → ${expected}`, got === expected && !leaked, `hasil ${got}${leaked ? ", konten sempat terlihat" : ""}`);
  }
  for (const id of [...ALL_T, "t-999"]) {
    const expected = id === "t-999" ? "not-found" : p.tasks.includes(id) ? "allowed" : "denied";
    await watch(expected === "denied" ? '[data-detail="found"]' : null, null);
    await navigate(`/tugas/${id}`);
    const got = await outcome("detail");
    const leaked = expected === "denied" ? await seenGuarded() : false;
    results.matrix[p.key].tasks[id] = got;
    rec(`${p.key}: detail /tugas/${id} → ${expected}`, got === expected && !leaked, `hasil ${got}${leaked ? ", konten sempat terlihat" : ""}`);
  }
  await unwatch();

  // A4. navigasi KLIEN (tanpa muat ulang dokumen) ke bagian yang dibatasi
  for (const path of ["/dashboard", "/anggota", "/laporan", "/pengaturan"]) {
    const expected = p.sections.includes(path) ? "allowed" : "denied";
    await navigate("/u4-spike");
    await outcome("section");
    await sleep(200);
    const mark = await setMark();
    await watch(null, expected === "denied" ? SECTIONS[path] : null);
    await clickEl(`a[href="${path}"]`);
    await afterClick("/u4-spike");
    const got = await outcome("section");
    const leaked = expected === "denied" ? await seenGuarded() : false;
    results.matrix[p.key].client[path] = got;
    rec(`${p.key}: navigasi KLIEN ke ${path} → ${expected} tanpa muat ulang dokumen`, got === expected && !leaked && (await markIs(mark)), `hasil ${got}${leaked ? ", konten sempat terlihat" : ""}`);
  }
  await unwatch();
}

// ================= B. detail lewat navigasi klien + ID runtime (dibuat di memori) =================
// Persona terbatas: Siti (Admin), Ahmad (Mandor), Dewi (Anggota). Budi (Owner) sebagai pembanding.
async function clientDetail(personaKey, href, expected) {
  await navigate("/u4-spike");
  await outcome("section");
  await sleep(200);
  const mark = await setMark();
  await watch(expected === "denied" ? '[data-detail="found"]' : null, null);
  await clickEl(`a[href="${href}"]`);
  await afterClick("/u4-spike");
  const got = await outcome("detail");
  const leaked = expected === "denied" ? await seenGuarded() : false;
  rec(`${personaKey}: navigasi KLIEN ke ${href} → ${expected}`, got === expected && !leaked && (await markIs(mark)), `hasil ${got}${leaked ? ", konten sempat terlihat" : ""}`);
  await unwatch();
}
await setSession("u-004");
await clientDetail("dewi", "/proyek/p-001", "allowed");
await clientDetail("dewi", "/proyek/p-002", "denied");
await clientDetail("dewi", "/tugas/t-002", "allowed");
await clientDetail("dewi", "/tugas/t-001", "denied");
await clientDetail("dewi", "/proyek/p-999", "not-found");
await setSession("u-002");
await clientDetail("siti", "/proyek/p-001", "allowed");
await clientDetail("siti", "/proyek/p-003", "denied");
await setSession("u-003");
await clientDetail("ahmad", "/proyek/p-002", "allowed");
await clientDetail("ahmad", "/proyek/p-004", "denied");
await clientDetail("ahmad", "/tugas/t-003", "allowed"); // G5: Mandor melihat semua tugas proyek tempatnya menjadi anggota

// ID runtime: dibuat lewat tombol uji, dibuka lewat router.push (navigasi klien). Pada ID runtime proyek tidak punya adminId
// dan tidak punya anggota; tugas runtime ada di p-001 tanpa penanggung jawab.
async function runtimeCase(personaKey, userId, createSel, expected, label) {
  await setSession(userId);
  await navigate("/u4-spike");
  await outcome("section");
  await sleep(200);
  const mark = await setMark();
  await watch(expected === "denied" ? '[data-detail="found"]' : null, null);
  await clickEl(createSel);
  await afterClick("/u4-spike");
  const got = await outcome("detail");
  const leaked = expected === "denied" ? await seenGuarded() : false;
  rec(`${personaKey}: ${label} → ${expected} (navigasi klien)`, got === expected && !leaked && (await markIs(mark)), `hasil ${got}${leaked ? ", konten sempat terlihat" : ""}`);
  await unwatch();
}
await runtimeCase("budi", "u-001", '[data-spike-action="create-project-push"]', "allowed", "proyek runtime p-006");
await runtimeCase("budi", "u-001", '[data-spike-action="create-task-push"]', "allowed", "tugas runtime t-007");
await runtimeCase("siti", "u-002", '[data-spike-action="create-project-push"]', "denied", "proyek runtime (tanpa Admin principal) p-006");
await runtimeCase("siti", "u-002", '[data-spike-action="create-task-push"]', "allowed", "tugas runtime di p-001 (Admin principal p-001)");
await runtimeCase("ahmad", "u-003", '[data-spike-action="create-project-push"]', "denied", "proyek runtime (bukan anggota) p-006");
await runtimeCase("ahmad", "u-003", '[data-spike-action="create-task-push"]', "allowed", "tugas runtime di p-001 (anggota p-001, G5)");
await runtimeCase("dewi", "u-004", '[data-spike-action="create-task-push"]', "denied", "tugas runtime tanpa penanggung jawab (bukan miliknya)");
// Audit G8: tugas runtime pada proyek yang Admin principal-nya bukan Siti (p-003 tanpa Admin; proyek runtime tanpa Admin).
// Siti (Admin) harus ditolak; Owner tetap boleh; Mandor/Anggota ditolak karena bukan anggota proyek itu.
for (const [sel, label] of [
  ['[data-spike-action="create-task-p003-push"]', "tugas runtime di p-003 (tanpa Admin principal)"],
  ['[data-spike-action="create-task-runtime-project-push"]', "tugas runtime di proyek runtime (tanpa Admin principal)"],
]) {
  await runtimeCase("budi", "u-001", sel, "allowed", label);
  await runtimeCase("siti", "u-002", sel, "denied", label);
  await runtimeCase("ahmad", "u-003", sel, "denied", label);
  await runtimeCase("dewi", "u-004", sel, "denied", label);
}
// reload pada ID runtime → store reset → tidak dikenal
await setSession("u-001");
await navigate("/u4-spike");
await outcome("section");
await clickEl('[data-spike-action="create-project-push"]');
await outcome("detail");
await send("Page.reload");
await waitFor(() => evaluate(`document.readyState === "complete"`), 60000, "reload");
rec("budi: reload pada ID runtime → not-found (store memori reset)", (await outcome("detail")) === "not-found");

// ================= C. Mobile 375px (mobile:true + emulasi sentuh): Mandor dan Anggota Tim =================
await setViewport({ width: 375, height: 800, mobile: true, touch: true });
for (const p of PERSONAS.filter((x) => x.key === "ahmad" || x.key === "dewi")) {
  await navigate("/masuk");
  await evaluate(`sessionStorage.clear()`);
  await navigate("/masuk");
  rec(`${p.key} mobile: emulasi sentuh aktif`, (await evaluate(`navigator.maxTouchPoints`)) > 0 && (await evaluate(`innerWidth`)) === 375);
  await fill("#email", p.email);
  await fill("#password", "kata-sandi-demo-1");
  await tap('form button[type="submit"]');
  const landed = await waitFor(async () => ((await evaluate(`location.pathname`)) === p.landing ? p.landing : null), 20000, `login mobile ${p.key}`).catch(() => null);
  rec(`${p.key} mobile: login (ketuk) diarahkan ke ${p.landing}`, landed === p.landing);
  await outcome("section");
  await sleep(300);
  await checkOverflow(`${p.key} ${p.landing} 375 mobile`);
  await checkAxe(`${p.key} ${p.landing} 375 mobile`);
  await shot(`${p.key}-landing-375`);

  // header sticky tetap di atas konten saat halaman digulir (cacat U2: z-sticky tak terdefinisi)
  await evaluate(`window.scrollTo(0, 250)`);
  await sleep(250);
  const headerOnTop = await evaluate(`(() => { const h = document.querySelector("header"); const el = document.elementFromPoint(300, 24); return !!h && !!el && h.contains(el); })()`);
  rec(`${p.key} mobile: header sticky tetap di atas konten saat digulir`, headerOnTop);
  await evaluate(`window.scrollTo(0, 0)`);
  await sleep(150);

  // drawer: buka dengan sentuhan, periksa urutan menu dan ukuran target
  await tap('[aria-label="Buka navigasi"]');
  await waitFor(() => evaluate(`!!document.querySelector('[data-slot="sidebar-mobile"]')`), 5000, "drawer terbuka");
  await sleep(250);
  const drawer = await sidebarLinks("mobile");
  rec(`${p.key} mobile: drawer berisi menu persis dan berurutan (Tugas pertama)`, same(drawer, p.menu) && drawer[0] === "Tugas", JSON.stringify(drawer));
  const sizes = await evaluate(`[...document.querySelectorAll('[data-slot="sidebar-mobile"] nav a, [data-slot="sidebar-mobile"] button')].filter((e) => e.checkVisibility()).map((e) => { const r = e.getBoundingClientRect(); return { name: (e.getAttribute("aria-label") || e.textContent).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; })`);
  results.measurements[`drawer ${p.key} 375`] = sizes;
  // Follow-up U4-3: semua kontrol drawer (tautan menu, Tutup navigasi, Keluar) wajib >= 44x44px.
  const small = sizes.filter((s) => s.h < 44 || s.w < 44);
  rec(`${p.key} mobile: target sentuh drawer >= 44x44px (${sizes.length} kontrol)`, sizes.length >= p.menu.length + 2 && small.length === 0, small.map((s) => `${s.name} ${s.w}x${s.h}`).join("; "));
  const closeBox = await evaluate(`(() => { const r = document.querySelector('[aria-label="Tutup navigasi"]').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })()`);
  rec(`${p.key} mobile: tombol Tutup navigasi >= 44x44px`, closeBox.w >= 44 && closeBox.h >= 44, `${closeBox.w}x${closeBox.h}`);
  const logoutBox = await evaluate(`(() => { const b = [...document.querySelectorAll('[data-slot="sidebar-mobile"] button')].find((x) => x.textContent.trim() === "Keluar"); if (!b) return null; const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })()`);
  rec(`${p.key} mobile: tombol Keluar di drawer >= 44x44px`, !!logoutBox && logoutBox.w >= 44 && logoutBox.h >= 44, JSON.stringify(logoutBox));
  const openBox = await evaluate(`(() => { const r = document.querySelector('[aria-label="Buka navigasi"]').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })()`);
  rec(`${p.key} mobile: tombol Buka navigasi >= 44x44px`, openBox.w >= 44 && openBox.h >= 44, `${openBox.w}x${openBox.h}`);
  // Tidak ada tautan yang saling menimpa (jarak vertikal antar tautan tidak negatif).
  const gaps = await evaluate(`(() => { const rs = [...document.querySelectorAll('[data-slot="sidebar-mobile"] nav a')].map((a) => a.getBoundingClientRect()); return rs.slice(1).map((r, i) => Math.round(r.top - rs[i].bottom)); })()`);
  rec(`${p.key} mobile: tautan drawer tidak saling menimpa`, gaps.every((g) => g >= 0), JSON.stringify(gaps));
  rec(`${p.key} mobile: drawer tidak memuat Dashboard/Anggota/Pengaturan`, !drawer.some((l) => ["Dashboard", "Anggota", "Pengaturan"].includes(l)));
  // Susunan lapisan: konten halaman (mis. tabel ber-`relative`) tidak boleh menimpa drawer (cacat U2: z-modal tak terdefinisi).
  const stacking = await evaluate(`(() => { const d = document.querySelector('[data-slot="sidebar-mobile"]'); return [[100, 450], [200, 300], [150, 600]].map(([x, y]) => d.contains(document.elementFromPoint(x, y))); })()`);
  rec(`${p.key} mobile: drawer berada di atas konten halaman (z-index; tabel tidak menimpa)`, stacking.every(Boolean), JSON.stringify(stacking));
  await checkAxe(`${p.key} drawer terbuka 375 mobile`);
  await shot(`${p.key}-drawer-375`);
  // ketuk menu "Proyek" → drawer menutup dan navigasi klien
  const mark = await setMark();
  await tap('[data-slot="sidebar-mobile"] nav a[href="/proyek"]');
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/proyek" ? true : null), 10000, "menu Proyek");
  await outcome("section");
  rec(`${p.key} mobile: ketuk menu Proyek menavigasi tanpa muat ulang dan menutup drawer`, (await markIs(mark)) && !(await evaluate(`!!document.querySelector('[data-slot="sidebar-mobile"]')`)));
  await checkOverflow(`${p.key} /proyek 375 mobile`);

  // keyboard: Enter pada "Buka navigasi" membuka drawer; Tab melewati tautan menu berurutan lalu Tutup/Keluar; Enter pada tautan menavigasi
  await evaluate(`document.querySelector('[aria-label="Buka navigasi"]').focus()`);
  await pressKey("Enter");
  await waitFor(() => evaluate(`!!document.querySelector('[data-slot="sidebar-mobile"]')`), 5000, "drawer terbuka (keyboard)");
  await sleep(200);
  await evaluate(`document.querySelector('[data-slot="sidebar-mobile"] nav a').focus()`);
  const order = [];
  for (let i = 0; i < p.menu.length; i++) {
    order.push(await evaluate(`document.activeElement?.textContent?.trim()`));
    if (i < p.menu.length - 1) await pressKey("Tab");
  }
  rec(`${p.key} mobile: Tab melewati tautan drawer sesuai urutan menu`, same(order, p.menu), JSON.stringify(order));
  await pressKey("Tab");
  const afterLinks = await evaluate(`document.activeElement?.textContent?.trim()`);
  rec(`${p.key} mobile: Tab berikutnya setelah tautan terakhir mencapai Keluar`, afterLinks === "Keluar", afterLinks);
  const ring = await evaluate(`(() => { const s = getComputedStyle(document.activeElement); return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }; })()`);
  rec(`${p.key} mobile: fokus keyboard terlihat pada kontrol drawer`, ring.style !== "none" && ring.width >= 2, JSON.stringify(ring));
  await evaluate(`[...document.querySelectorAll('[data-slot="sidebar-mobile"] nav a')].find((a) => a.getAttribute("href") === "/dokumen").focus()`);
  await pressKey("Enter");
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/dokumen" ? true : null), 10000, "Enter pada tautan Dokumen");
  rec(`${p.key} mobile: Enter pada tautan menavigasi tanpa muat ulang dan menutup drawer`, (await markIs(mark)) && !(await evaluate(`!!document.querySelector('[data-slot="sidebar-mobile"]')`)));

  // URL langsung ke bagian terlarang dan detail di 375
  await watch(null, "Dashboard");
  await navigate("/dashboard");
  rec(`${p.key} mobile: URL langsung /dashboard → akses ditolak`, (await outcome("section")) === "denied" && !(await seenGuarded()));
  await shot(`${p.key}-akses-ditolak-375`);
  await unwatch();
  const own = p.key === "dewi" ? "/tugas/t-002" : "/tugas/t-003";
  await navigate(own);
  rec(`${p.key} mobile: detail ${own} (berhak) tampil`, (await outcome("detail")) === "allowed");
  await checkOverflow(`${p.key} ${own} 375 mobile`);
  await checkAxe(`${p.key} ${own} 375 mobile`);
}

// ================= D. 768px: bagian aplikasi untuk Mandor dan Owner =================
await setViewport({ width: 768, height: 1024 });
await setSession("u-003");
await navigate("/tugas");
await outcome("section");
await checkOverflow("ahmad /tugas 768");
await checkAxe("ahmad /tugas 768");
await setSession("u-001");
await navigate("/dashboard");
await outcome("section");
await checkOverflow("budi /dashboard 768");
await checkAxe("budi /dashboard 768");

// ================= E. Guest (akun uji sementara di mock.ts, selalu dipulihkan) =================
await setViewport({ width: 1280, height: 900 });
{
  const HEAD = /export const MOCK_USERS: User\[\] = \[\r?\n/;
  if (!HEAD.test(MOCK_ORIGINAL)) throw new Error("MOCK_USERS tidak ditemukan; sesuaikan pengujian Guest");
  const GUEST_EMAIL = "tamu.uji@contoh.co.id";
  try {
    writeFileSync(MOCK_FILE, MOCK_ORIGINAL.replace(HEAD, (h) => `${h}  { id: "u-guest-test", name: "Tamu Uji", email: "${GUEST_EMAIL}", role: "GUEST" },\n`));
    await waitFor(async () => {
      await navigate("/masuk");
      return evaluate(`document.body.textContent.includes(${q(GUEST_EMAIL)})`);
    }, 90000, "akun Guest uji termuat");
    await evaluate(`sessionStorage.clear()`);
    await navigate("/masuk");
    await fill("#email", GUEST_EMAIL);
    await fill("#password", "apa-saja");
    await clickEl('form button[type="submit"]');
    rec("guest: login diarahkan ke /akses-ditolak (tanpa App Shell)", (await outcome("section")) === "denied");
    rec("guest: tidak ada sidebar di DOM", !(await evaluate(`!!document.querySelector('[data-slot="sidebar-desktop"]')`)));
    for (const path of ["/dashboard", "/proyek/p-001", "/tugas/t-001", "/anggota"]) {
      await watch(path.startsWith("/proyek") || path.startsWith("/tugas") ? '[data-detail="found"]' : null, path === "/dashboard" ? "Dashboard" : path === "/anggota" ? "Anggota" : null);
      await navigate(path);
      const got = await outcome(path.includes("/p") && path !== "/proyek" ? "detail" : "section");
      rec(`guest: URL langsung ${path} → akses ditolak, tanpa sidebar, konten tidak pernah terlihat`, got === "denied" && !(await seenGuarded()) && !(await evaluate(`!!document.querySelector('[data-slot="sidebar-desktop"]')`)), `hasil ${got}`);
    }
    await unwatch();
    await navigate("/");
    rec("guest: halaman publik (landing) tanpa sidebar", !(await evaluate(`!!document.querySelector('[data-slot="sidebar-desktop"]')`)));
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
