// Pemeriksaan U4-5 di browser (Chrome via CDP, dev server): detail proyek READ-ONLY /proyek/[projectId].
// Persona: Budi (Owner), Siti (Admin Kantor principal p-001 dan p-002), Ahmad dan Eko (Mandor), Dewi (Anggota Tim), dan satu
// akun Guest sementara. Akun Guest dan perubahan teks legacy Task.assigneeName ditulis sementara ke src/data/mock.ts dan SELALU dipulihkan.
// Cakupan (semua harapan ditulis sebagai literal, sengaja bukan dihitung dari access.ts):
//   - akses: URL langsung dan navigasi klien per persona dan proyek (Admin di luar proyeknya, Mandor/Anggota di luar keanggotaan,
//     Guest tanpa App Shell), tanpa konten terlindung sempat terlihat; ID tidak dikenal → not-found
//   - tab per role: Owner/Admin/Mandor = Ringkasan, Tugas, Tim; Anggota Tim = Ringkasan dan Tugas (tanpa Tim)
//   - isi: ringkasan (kode, nama, klien, lokasi, periode, status, deskripsi, Admin penanggung jawab, progres, hitungan tugas),
//     tugas dalam lingkup (Anggota Tim hanya miliknya), tim (Mandor tanpa email), nama penanggung jawab dari relasi User
//   - read-only: tanpa tombol, form, atau tautan ke detail tugas; proyek Arsip hanya baca; tanpa kata anggaran atau nominal Rp
//   - tenggat terhadap tanggal acuan demo 21 Maret 2026 + DemoDataNotice; HTML prerender tanpa tugas/tim
//   - mock-store: tugas dan proyek runtime muncul lewat navigasi klien
//   - 1280/768/375 (tabel vs kartu, overflow, axe 0 di tiap tab), 375px mobile:true + sentuhan (target >= 44px, satu kolom,
//     tanpa aksi hover-only), keyboard tab (panah, Home, End)
// Representasi UI mock, BUKAN otorisasi. Jalankan: npm run check:u4-project-detail [-- <folder-bukti>]
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { createBrowser, sleep, waitFor } from "./lib/cdp.mjs";
import { findForbidden, UI_FORBIDDEN } from "./lib/no-budget.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(process.argv[2] ?? join(ROOT, ".u4-project-detail-check"));
const APP_PORT = 3520;
const BASE = `http://localhost:${APP_PORT}`;
const SESSION_KEY = "proyekin-demo-session";
mkdirSync(OUT, { recursive: true });

const results = { checks: [], measurements: {}, failures: [] };
const rec = (name, ok, detail = "") => {
  results.checks.push({ name, ok: !!ok, detail });
  if (!ok) {
    results.failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log("FAIL:", name, detail);
  } else console.log("ok:  ", name, detail);
};
const q = (s) => JSON.stringify(s);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();

// ---------------- data harapan (literal) ----------------
const PROJECTS = {
  "p-001": { code: "PRJ-001", name: "Renovasi Gedung Kantor Batam", client: "PT. Properti Nusantara", location: "Balai Kota Batam, Kepulauan Riau", status: "Berjalan", period: "15 Jan 2026 – 30 Jun 2026", progress: 45, admin: "Siti Aminah", desc: "Renovasi total gedung kantor lantai 1-3" },
  "p-002": { code: "PRJ-002", name: "Pembangunan Gudang Logistik Tanjung Pinang", client: "CV. Jaya Abadi Logistics", location: "Kec. Sungai Manggis, Kepulauan Riau", status: "Berjalan", period: "1 Mar 2026 – 15 Sep 2026", progress: 20, admin: "Siti Aminah", desc: "Pembangunan gudang logistik seluas 2000m2" },
  "p-003": { code: "PRJ-003", name: "Pengerjaan Jalan Akses Pelabuhan", client: "Dinas PU Kepulauan Riau", location: "Pelabuhan Tanjung Pinang", status: "Tertunda", period: "1 Nov 2025 – 30 Apr 2026", progress: 60, admin: null, desc: "Rehabilitasi jalan akses pelabuhan" },
  "p-004": { code: "PRJ-004", name: "Pembangunan Pos Keamanan Batang Tembesi", client: "PT. Batamindo Industri Perkasa", location: "Kawasan Industri BATAMINDO", status: "Selesai", period: "1 Jun 2025 – 31 Okt 2025", progress: 100, admin: null, desc: "Pembangunan 4 unit pos keamanan" },
  "p-005": { code: "PRJ-005", name: "Perbaikan Jembatan Kayu Angkut", client: "Desa Batu Angkut", location: "Desa Batu Angkut, Kepulauan Riau", status: "Arsip", period: "1 Agu 2024 – 31 Des 2024", progress: 100, admin: null, desc: "Perbaikan struktur jembatan kayu" },
};
const ALL_P = Object.keys(PROJECTS);
const TASKS = {
  "t-001": { code: "TSK-001", title: "Pembongkaran dinding partisi lantai 1", assignee: "Ahmad Rizal", status: "Selesai", due: "15 Feb 2026", overdue: false },
  "t-002": { code: "TSK-002", title: "Pengecekan sistem kelistrikan lama", assignee: "Dewi Lestari", status: "Dalam Progres", due: "28 Feb 2026", overdue: true },
  "t-003": { code: "TSK-003", title: "Pembersihan material sisa pembongkaran", assignee: "Eko Prasetyo", status: "Belum Dimulai", due: "5 Mar 2026", overdue: true },
  "t-004": { code: "TSK-004", title: "Pembuatan pondasi footplate", assignee: "Ahmad Rizal", status: "Dalam Progres", due: "10 Apr 2026", overdue: false },
  "t-005": { code: "TSK-005", title: "Pemesanan baja WF untuk struktur", assignee: "Eko Prasetyo", status: "Belum Dimulai", due: "25 Mar 2026", overdue: false },
  "t-006": { code: "TSK-006", title: "Pemasangan keramik lobby", assignee: "Dewi Lestari", status: "Belum Dimulai", due: "1 Apr 2026", overdue: false },
};
const P1_ALL = ["t-001", "t-002", "t-003", "t-006"];
const P2_ALL = ["t-004", "t-005"];
const TEAM = {
  "p-001": [["u-002", "Siti Aminah", "Admin Kantor", "siti@proyekin.id", true], ["u-003", "Ahmad Rizal", "Mandor", "ahmad@proyekin.id", false], ["u-004", "Dewi Lestari", "Anggota Tim", "dewi@proyekin.id", false], ["u-005", "Eko Prasetyo", "Mandor", "eko@proyekin.id", false]],
  "p-002": [["u-002", "Siti Aminah", "Admin Kantor", "siti@proyekin.id", true], ["u-003", "Ahmad Rizal", "Mandor", "ahmad@proyekin.id", false], ["u-005", "Eko Prasetyo", "Mandor", "eko@proyekin.id", false]],
};
const STATS = (ids) => {
  const list = ids.map((id) => TASKS[id]);
  return {
    total: String(list.length),
    "in-progress": String(list.filter((t) => t.status === "Dalam Progres").length),
    done: String(list.filter((t) => t.status === "Selesai").length),
    overdue: String(list.filter((t) => t.overdue).length),
    todo: `${list.filter((t) => t.status === "Belum Dimulai").length} belum dimulai`,
  };
};
const OWN_ONLY = "Hanya tugas yang ditugaskan kepada Anda.";
const ALL_TASKS_NOTE = "Semua tugas proyek ini.";
const FULL_TABS = ["ringkasan", "tugas", "tim"];
const NO_TEAM_TABS = ["ringkasan", "tugas"];
const PERSONAS = [
  { key: "budi", name: "Budi Santoso", role: "Owner", id: "u-001", allowed: ALL_P, tabs: FULL_TABS, email: true, own: false, tasks: { "p-001": P1_ALL, "p-002": P2_ALL } },
  { key: "siti", name: "Siti Aminah", role: "Admin Kantor", id: "u-002", allowed: ["p-001", "p-002"], tabs: FULL_TABS, email: true, own: false, tasks: { "p-001": P1_ALL, "p-002": P2_ALL } },
  { key: "ahmad", name: "Ahmad Rizal", role: "Mandor", id: "u-003", allowed: ["p-001", "p-002"], tabs: FULL_TABS, email: false, own: false, tasks: { "p-001": P1_ALL, "p-002": P2_ALL } },
  { key: "eko", name: "Eko Prasetyo", role: "Mandor", id: "u-005", allowed: ["p-001", "p-002"], tabs: FULL_TABS, email: false, own: false, tasks: { "p-001": P1_ALL, "p-002": P2_ALL } },
  { key: "dewi", name: "Dewi Lestari", role: "Anggota Tim", id: "u-004", allowed: ["p-001"], tabs: NO_TEAM_TABS, email: false, own: true, tasks: { "p-001": ["t-002", "t-006"] } },
];
const ALL_EMAILS = ["siti@proyekin.id", "ahmad@proyekin.id", "dewi@proyekin.id", "eko@proyekin.id", "budi@proyekin.id"];

// ---------------- server, browser, utilitas ----------------
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
const browser = await createBrowser({ cdpPort: 9688 });
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

// Pengamat: mencatat bila konten detail (found) PERNAH terlihat. Dipakai untuk kasus yang harus ditolak.
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => { const check = () => { try { if (sessionStorage.getItem("__watch") !== "1") return;
    if ([...document.querySelectorAll('[data-detail="found"]')].some((e) => e.checkVisibility())) sessionStorage.setItem("__seen", "1"); } catch {} };
    new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true }); })();`,
});
const watch = () => evaluate(`(() => { sessionStorage.removeItem("__seen"); sessionStorage.setItem("__watch", "1"); })()`);
const seenLeak = () => evaluate(`sessionStorage.getItem("__seen") === "1"`);
const unwatch = () => evaluate(`sessionStorage.removeItem("__watch"); sessionStorage.removeItem("__seen");`);

async function navigate(path) {
  await send("Page.navigate", { url: `${BASE}${path}` });
  await waitFor(() => evaluate(`document.readyState === "complete"`), 90000, `muat ${path}`);
  await evaluate(`document.fonts.ready.then(() => true)`);
}
/** Hasil akhir halaman detail: denied | not-found | detail (siap, sesi diketahui) | timeout. */
const outcome = () =>
  waitFor(
    () =>
      evaluate(`(() => {
        if (location.pathname === "/akses-ditolak" && document.querySelector("h1")?.textContent === "Akses tidak tersedia") return "denied";
        const vis = (sel) => [...document.querySelectorAll(sel)].some((e) => e.checkVisibility());
        if (vis('[data-detail="not-found"]')) return "not-found";
        if (vis('[data-detail="found"][data-state="ready"]')) return "detail";
        return null;
      })()`),
    25000,
    "hasil halaman",
  ).catch(() => "timeout");
async function setSession(userId) {
  await navigate("/masuk");
  await evaluate(`sessionStorage.clear(); ${userId ? `sessionStorage.setItem(${q(SESSION_KEY)}, JSON.stringify({ userId: ${q(userId)}, loginAt: new Date().toISOString() }))` : ""}`);
}
const openDetail = async (userId, id) => {
  await setSession(userId);
  await navigate(`/proyek/${id}`);
  return outcome();
};
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
const MARK = "__u45Marker";
const setMark = () => evaluate(`window.${MARK} = "m" + Date.now(); window.${MARK}`);
const markIs = (m) => evaluate(`window.${MARK} === ${q(m)}`);

const tabNames = () => evaluate(`[...document.querySelectorAll('[data-slot="tabs-tab"]')].map((t) => t.getAttribute("data-tab"))`);
const mainText = () => evaluate(`document.querySelector("main").textContent`);
async function selectTab(name, touch = false) {
  const sel = `[data-slot="tabs-tab"][data-tab="${name}"]`;
  if (touch) await tap(sel);
  else await clickEl(sel);
  await waitFor(() => evaluate(`document.querySelector(${q(sel)})?.getAttribute("aria-selected") === "true"`), 8000, `tab ${name}`);
  await sleep(150);
}
const vis = (sel) => evaluate(`[...document.querySelectorAll(${q(sel)})].some((e) => e.checkVisibility())`);
const taskIds = (kind) => evaluate(`[...document.querySelectorAll(${q(kind === "table" ? '[data-slot="project-task-row"]' : '[data-slot="task-card"]')})].filter((e) => e.checkVisibility()).map((e) => e.getAttribute("data-task-id"))`);
const teamIds = (kind) => evaluate(`[...document.querySelectorAll(${q(kind === "table" ? '[data-slot="project-team-row"]' : '[data-slot="record-card"][data-user-id]')})].filter((e) => e.checkVisibility()).map((e) => e.getAttribute("data-user-id"))`);
const rowText = (kind, id) => evaluate(`(() => { const e = document.querySelector(${q(kind === "table" ? `[data-slot="project-task-row"][data-task-id="${id}"]` : `[data-slot="task-card"][data-task-id="${id}"]`)}); return e && e.checkVisibility() ? e.textContent.replace(/\\s+/g, " ").trim() : null; })()`);
const teamText = (kind, id) => evaluate(`(() => { const e = document.querySelector(${q(kind === "table" ? `[data-slot="project-team-row"][data-user-id="${id}"]` : `[data-slot="record-card"][data-user-id="${id}"]`)}); return e && e.checkVisibility() ? e.textContent.replace(/\\s+/g, " ").trim() : null; })()`);
const stat = (key) => evaluate(`(() => { const c = document.querySelector('[data-stat="${key}"]'); return c ? { value: c.querySelector("p.text-2xl")?.textContent.trim(), note: c.querySelector("p.text-xs")?.textContent.trim() ?? null } : null; })()`);

// Pengecekan bersama untuk satu halaman detail yang siap (sesi 1280 desktop atau viewport lain).
// U4-6: aksi ubah/hapus hanya untuk role berhak. Daftar tombol yang diharapkan ditulis sebagai literal (bukan dari access.ts):
// Owner = Ubah proyek + Hapus proyek (kecuali Arsip), Admin principal = Ubah proyek, Mandor/Anggota Tim = tidak ada.
const expectedActions = (p, id) => (id === "p-005" ? [] : p.key === "budi" ? ["Ubah proyek", "Hapus proyek"] : p.key === "siti" ? ["Ubah proyek"] : []);
// U4-7: tab Tim kini memuat aksi tim untuk role yang berhak (literal, bukan dari access.ts). Owner: Tambah anggota, Ganti/Cabut Admin di
// baris Admin, Keluarkan dari proyek di tiap anggota, atau Tetapkan Admin bila belum ada Admin. Admin principal: Tambah anggota saja.
// Mandor/Anggota Tim dan proyek Arsip: tetap tanpa aksi. Tombol baris muncul DUA kali karena kartu (tersembunyi di lg) dan tabel
// sama-sama ada di DOM; checkReadOnly menghitung semua tombol di <main> (perilaku pemeriksaan lama tidak diubah).
const TEAM_ROW_ACTIONS = {
  "p-001": ["Ganti Admin Siti Aminah", "Cabut Admin Siti Aminah", "Keluarkan dari proyek Ahmad Rizal", "Keluarkan dari proyek Dewi Lestari", "Keluarkan dari proyek Eko Prasetyo"],
  "p-002": ["Ganti Admin Siti Aminah", "Cabut Admin Siti Aminah", "Keluarkan dari proyek Ahmad Rizal", "Keluarkan dari proyek Eko Prasetyo"],
};
const expectedTeamActions = (p, id) =>
  id === "p-005"
    ? []
    : p.key === "budi"
      ? ["Ubah proyek", "Hapus proyek", "Tambah anggota", ...(TEAM_ROW_ACTIONS[id] ? [...TEAM_ROW_ACTIONS[id], ...TEAM_ROW_ACTIONS[id]] : ["Tetapkan Admin"])]
      : p.key === "siti"
        ? ["Ubah proyek", "Tambah anggota"]
        : [];
async function checkReadOnly(label, actions = []) {
  const info = await evaluate(`(() => ({
    buttons: [...document.querySelectorAll("main button")].filter((b) => !b.closest('[role="tablist"]')).map((b) => b.textContent.trim()),
    controls: document.querySelectorAll("main input, main select, main textarea, main form").length,
    links: [...document.querySelectorAll("main a")].map((a) => a.getAttribute("href")),
  }))()`);
  rec(`${label}: tombol di luar tab hanya aksi yang berhak (${actions.join(", ") || "tidak ada"}); tanpa form/input saat dialog tertutup`, same(info.buttons, actions) && info.controls === 0, JSON.stringify(info.buttons));
  rec(`${label}: satu-satunya tautan di halaman adalah kembali ke /proyek (tanpa tautan detail tugas)`, same([...new Set(info.links)], ["/proyek"]), JSON.stringify(info.links));
  const hits = findForbidden(await mainText(), UI_FORBIDDEN);
  rec(`${label}: tanpa kata anggaran atau nominal rupiah`, hits.length === 0, hits.join(" | "));
}

// ================= 0. HTML prerender: header ya, tugas/tim tidak =================
{
  const html = await (await fetch(`${BASE}/proyek/p-001`)).text();
  rec("HTML /proyek/p-001: memuat nama proyek dan penanda detail (kontrak U4-0)", html.includes("Renovasi Gedung Kantor Batam") && html.includes('data-detail="found"'));
  rec("HTML /proyek/p-001: status memuat (data-state=loading) dan skeleton, belum ada tab", html.includes('data-state="loading"') && html.includes("Memuat detail proyek") && !html.includes('data-slot="tabs-tab"'));
  rec("HTML /proyek/p-001: tidak memuat judul tugas, nama tugas, atau email anggota", Object.values(TASKS).every((t) => !html.includes(t.title) && !html.includes(t.code)) && !ALL_EMAILS.some((e) => html.includes(e)));
}

// ================= A. 1280 desktop: matriks persona x proyek (URL langsung) =================
await setViewport({ width: 1280, height: 900 });
for (const p of PERSONAS) {
  for (const id of ALL_P) {
    const proj = PROJECTS[id];
    if (!p.allowed.includes(id)) {
      await setSession(p.id);
      await watch();
      await navigate(`/proyek/${id}`);
      const got = await outcome();
      rec(`${p.key} (${p.role}): URL langsung /proyek/${id} (di luar lingkup) → akses ditolak, konten tidak sempat terlihat`, got === "denied" && !(await seenLeak()), `hasil ${got}${(await seenLeak()) ? ", konten sempat terlihat" : ""}`);
      await unwatch();
      continue;
    }
    const got = await openDetail(p.id, id);
    rec(`${p.key} (${p.role}): /proyek/${id} (dalam lingkup) siap`, got === "detail", got);
    if (got !== "detail") continue;
    const tag = `${p.key} ${id}`;

    // tab per role
    rec(`${tag}: tab = ${p.tabs.join(", ")}`, same(await tabNames(), p.tabs), JSON.stringify(await tabNames()));
    rec(`${tag}: tab Ringkasan terpilih awal`, await evaluate(`document.querySelector('[data-tab="ringkasan"]').getAttribute("aria-selected") === "true"`));
    const ids = p.tasks[id] ?? [];
    rec(`${tag}: label tab Tugas memuat jumlah tugas dalam lingkup`, norm(await evaluate(`document.querySelector('[data-tab="tugas"]').textContent`)) === `Tugas (${ids.length})`);
    if (!p.tabs.includes("tim")) rec(`${tag}: panel Tim tidak ada di DOM (bukan hanya disembunyikan)`, await evaluate(`document.querySelector('[data-slot="project-team"]') === null && !document.querySelector('[data-tab="tim"]')`));

    // header dan ringkasan
    const header = await evaluate(`({ h1: document.querySelector("main h1")?.textContent.trim(), eyebrow: document.querySelector('[data-slot="page-header"] p')?.textContent.trim(), back: document.querySelector('[data-slot="back-link"]')?.getAttribute("href") })`);
    rec(`${tag}: header memuat kode, nama, tautan kembali ke daftar`, header.h1 === proj.name && header.eyebrow === proj.code && header.back === "/proyek", JSON.stringify(header));
    const info = norm(await evaluate(`document.querySelector('[data-slot="project-info"]').textContent`));
    rec(`${tag}: ringkasan memuat kode, status, klien, lokasi, periode, Admin penanggung jawab`, [proj.code, proj.status, proj.client, proj.location, proj.period, proj.admin ?? "Belum ditetapkan"].every((s) => info.includes(s)), info.slice(0, 200));
    rec(`${tag}: ringkasan memuat deskripsi proyek`, info.includes(proj.desc));
    rec(`${tag}: progres proyek ${proj.progress}%`, (await evaluate(`document.querySelector('[data-slot="project-info"] [role="progressbar"]').getAttribute("aria-valuenow")`)) === String(proj.progress));
    const st = STATS(ids);
    const got4 = { total: await stat("total"), prog: await stat("in-progress"), done: await stat("done"), overdue: await stat("overdue") };
    rec(`${tag}: hitungan tugas (total ${st.total}, progres ${st["in-progress"]}, selesai ${st.done}, terlambat ${st.overdue})`, got4.total?.value === st.total && got4.total?.note === st.todo && got4.prog?.value === st["in-progress"] && got4.done?.value === st.done && got4.overdue?.value === st.overdue, JSON.stringify(got4));
    rec(`${tag}: judul ringkasan tugas ${p.own ? "Anda" : "umum"}`, (await mainText()).includes(p.own ? "Ringkasan tugas Anda" : "Ringkasan tugas") && ((await mainText()).includes("Ringkasan tugas Anda") === p.own));
    const notice = await evaluate(`(() => { const n = document.querySelector('[data-slot="demo-data-notice"]'); return n && n.checkVisibility() ? n.textContent : null; })()`);
    rec(`${tag}: DemoDataNotice tampil dengan tanggal acuan demo 21 Maret 2026 (bukan hari ini)`, !!notice && notice.includes("21 Maret 2026") && notice.includes("bukan tanggal hari ini") && notice.includes("memori tab ini"), notice ?? "tidak tampil");
    rec(`${tag}: DemoDataNotice berada SETELAH tab (isi tab tidak terdorong ke bawah layar pertama)`, await evaluate(`!!(document.querySelector('[data-slot="tabs"]').compareDocumentPosition(document.querySelector('[data-slot="demo-data-notice"]')) & Node.DOCUMENT_POSITION_FOLLOWING)`));
    await checkReadOnly(`${tag} ringkasan`, expectedActions(p, id));
    if (id === "p-005") {
      const arch = await evaluate(`(() => { const n = document.querySelector('[data-slot="archived-note"]'); return n && n.checkVisibility() ? n.textContent.trim() : null; })()`);
      rec(`${tag}: proyek Arsip ditandai Hanya baca dan catatan hanya baca tampil`, !!arch && arch.includes("Proyek berstatus Arsip bersifat hanya baca.") && (await mainText()).includes("Hanya baca"), arch ?? "tidak tampil");
    } else {
      rec(`${tag}: proyek non-Arsip tanpa penanda Hanya baca`, !(await vis('[data-slot="archived-note"]')) && !(await mainText()).includes("Hanya baca"));
    }
    if (["budi p-001", "siti p-001", "ahmad p-001", "dewi p-001", "budi p-005"].includes(tag)) await shot(`${p.key}-${id}-ringkasan-1280`);
    await checkAxe(`${tag} ringkasan 1280`);
    await checkOverflow(`${tag} ringkasan 1280`);

    // tab Tugas
    await selectTab("tugas");
    const rows = await taskIds("table");
    rec(`${tag}: tab Tugas (tabel) hanya memuat tugas dalam lingkup ${JSON.stringify(ids)}`, same(rows, ids), JSON.stringify(rows));
    rec(`${tag}: kartu mobile tersembunyi di 1280`, (await taskIds("cards")).length === 0);
    for (const tid of ids) {
      const t = TASKS[tid];
      const text = await rowText("table", tid);
      rec(`${tag}: baris ${tid} memuat kode, judul, penanggung jawab ${t.assignee}, status ${t.status}, tenggat ${t.due}${t.overdue ? ", Terlambat" : ""}`, !!text && [t.code, t.title, t.assignee, t.status, t.due].every((s) => text.includes(s)) && text.includes("Terlambat") === t.overdue, text ?? "tidak tampil");
    }
    const scopeNote = await evaluate(`document.querySelector('[data-slot="project-tasks"]').textContent`);
    rec(`${tag}: catatan lingkup tugas ${p.own ? "(hanya milik sendiri)" : "(semua tugas proyek)"}`, scopeNote.includes(p.own ? OWN_ONLY : ALL_TASKS_NOTE) && !scopeNote.includes(p.own ? ALL_TASKS_NOTE : OWN_ONLY));
    if (ids.length === 0) rec(`${tag}: state kosong tugas tampil`, await vis('[data-slot="project-tasks-empty"]') && (await mainText()).includes("Belum ada tugas di proyek ini"));
    const hint = await evaluate(`(() => { const h = document.querySelector('[data-slot="deadline-hint"]'); return h && h.checkVisibility() ? h.textContent.trim() : null; })()`);
    rec(`${tag}: keterangan acuan tenggat (21 Maret 2026) tampil langsung di tab Tugas`, !!hint && hint.includes("tanggal acuan demo 21 Maret 2026"), hint ?? "tidak tampil");
    if (ids.length > 0) {
      const tw = await evaluate(`(() => { const c = document.querySelector('[data-slot="project-task-table"] [data-slot="table-container"]'); return c ? { scroll: c.scrollWidth, client: c.clientWidth } : null; })()`);
      rec(`${tag}: tabel tugas muat tanpa gulir horizontal di 1280 (semua kolom termasuk persen progres terlihat)`, !!tw && tw.scroll <= tw.client + 1, JSON.stringify(tw));
    }
    if (p.own) {
      const others = ["t-001", "t-003"].map((tid) => TASKS[tid].title);
      const text = await mainText();
      rec(`${tag}: Anggota Tim tidak melihat judul tugas milik orang lain`, others.every((s) => !text.includes(s)) && !text.includes("TSK-001") && !text.includes("TSK-003"));
    }
    await checkReadOnly(`${tag} tugas`, expectedActions(p, id));
    if (["budi p-001", "dewi p-001"].includes(tag)) await shot(`${p.key}-${id}-tugas-1280`);
    await checkAxe(`${tag} tugas 1280`);
    await checkOverflow(`${tag} tugas 1280`);

    // tab Tim
    if (p.tabs.includes("tim")) {
      await selectTab("tim");
      const team = TEAM[id] ?? [];
      const tIds = await teamIds("table");
      rec(`${tag}: tab Tim (tabel) memuat ${team.length} orang: Admin principal lalu anggota`, same(tIds, team.map((m) => m[0])), JSON.stringify(tIds));
      for (const [uid, name, role, email, principal] of team) {
        const text = await teamText("table", uid);
        rec(`${tag}: baris tim ${name} — peran ${role}${principal ? ", Penanggung jawab" : ""}${p.email ? ", email tampil" : ", TANPA email"}`, !!text && text.includes(name) && text.includes(role) && text.includes("Penanggung jawab") === principal && text.includes(email) === p.email, text ?? "tidak tampil");
      }
      const panelText = await evaluate(`document.querySelector('[data-slot="project-team"]').textContent`);
      // Tim kosong menampilkan state kosong (tanpa tabel), jadi kolom Email hanya diharapkan bila tim berisi.
      rec(
        `${tag}: tab Tim ${p.email ? (team.length > 0 ? "memuat kolom Email" : "kosong: tanpa tabel, tanpa email") : "tanpa kolom Email dan tanpa alamat email sama sekali"}`,
        p.email ? (team.length > 0 ? panelText.includes("Email") : !panelText.includes("@")) : !panelText.includes("Email") && !panelText.includes("@") && !ALL_EMAILS.some((e) => panelText.includes(e)),
      );
      if (team.length === 0) rec(`${tag}: state kosong tim tampil`, await vis('[data-slot="project-team-empty"]') && panelText.includes("Belum ada tim di proyek ini"));
      else {
        const tw = await evaluate(`(() => { const c = document.querySelector('[data-slot="project-team-table"] [data-slot="table-container"]'); return c ? { scroll: c.scrollWidth, client: c.clientWidth } : null; })()`);
        rec(`${tag}: tabel tim muat tanpa gulir horizontal di 1280`, !!tw && tw.scroll <= tw.client + 1, JSON.stringify(tw));
      }
      await checkReadOnly(`${tag} tim`, expectedTeamActions(p, id));
      if (["budi p-001", "ahmad p-001"].includes(tag)) await shot(`${p.key}-${id}-tim-1280`);
      await checkAxe(`${tag} tim 1280`);
      await checkOverflow(`${tag} tim 1280`);
    } else {
      const text = await mainText();
      rec(`${tag}: tidak ada email atau susunan tim di halaman`, !ALL_EMAILS.some((e) => text.includes(e)) && !text.includes("Tim proyek"));
    }
  }
}

// Owner: proyek tanpa tugas dan tanpa tim (p-003), serta Arsip (p-005): state kosong dan hanya baca.
for (const id of ["p-003", "p-004", "p-005"]) {
  const got = await openDetail("u-001", id);
  rec(`budi ${id}: proyek tanpa tim dan tanpa tugas siap`, got === "detail", got);
  const info = norm(await evaluate(`document.querySelector('[data-slot="project-info"]').textContent`));
  rec(`budi ${id}: Admin penanggung jawab "Belum ditetapkan" dan hitungan tugas 0`, info.includes("Belum ditetapkan") && (await stat("total"))?.value === "0" && (await stat("overdue"))?.value === "0");
  await selectTab("tugas");
  rec(`budi ${id}: tab Tugas (0) menampilkan state kosong yang jelas`, (await taskIds("table")).length === 0 && (await vis('[data-slot="project-tasks-empty"]')) && (await mainText()).includes("Belum ada tugas di proyek ini") && (await mainText()).includes("Tugas (0)"));
  await selectTab("tim");
  rec(`budi ${id}: tab Tim menampilkan state kosong yang jelas`, (await vis('[data-slot="project-team-empty"]')) && (await mainText()).includes("Belum ada tim di proyek ini"));
  if (id === "p-003") await shot("budi-p-003-tim-kosong-1280");
}

// Direct URL: ID tidak dikenal dan Guest, Owner tanpa sesi (mode pengembangan)
{
  await setSession("u-001");
  await navigate("/proyek/p-999");
  const got = await outcome();
  const nf = await evaluate(`(() => { const e = document.querySelector('[data-detail="not-found"]'); return e ? { text: e.textContent.replace(/\\s+/g, " ").trim(), href: e.querySelector("a")?.getAttribute("href") } : null; })()`);
  rec("ID tidak dikenal /proyek/p-999 → not-found yang jelas dengan tautan kembali", got === "not-found" && nf?.text.includes("Proyek tidak ditemukan") && nf?.href === "/proyek", JSON.stringify(nf));
  rec("not-found: tidak ada konten detail", !(await vis('[data-detail="found"]')));
  await shot("budi-not-found-1280");
  await checkAxe("not-found 1280");
  await setSession(null);
  await navigate("/proyek/p-001");
  rec("tanpa sesi (Owner demo, mode pengembangan): /proyek/p-001 terbuka dengan tab lengkap", (await outcome()) === "detail" && same(await tabNames(), FULL_TABS));
}

// ================= B. Navigasi klien: dari daftar, tombol kembali, dan ke proyek di luar lingkup =================
await setViewport({ width: 1280, height: 900 });
for (const p of PERSONAS) {
  await setSession(p.id);
  await navigate("/proyek");
  await waitFor(() => evaluate(`!!document.querySelector('[data-slot="project-list"][data-state="ready"]')`), 20000, "daftar proyek");
  await sleep(200);
  const target = p.allowed[0];
  const mark = await setMark();
  await clickEl(`[data-slot="project-row"][data-project-id="${target}"] a`);
  await waitFor(async () => ((await evaluate(`location.pathname`)) === `/proyek/${target}` ? true : null), 15000, "path detail");
  rec(`${p.key}: klik proyek di daftar → detail ${target} tanpa muat ulang`, (await outcome()) === "detail" && (await markIs(mark)));
  await clickEl('[data-slot="back-link"]');
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/proyek" ? true : null), 15000, "kembali");
  await waitFor(() => evaluate(`!!document.querySelector('[data-slot="project-list"][data-state="ready"]')`), 15000, "daftar kembali");
  rec(`${p.key}: tautan Daftar proyek kembali ke /proyek tanpa muat ulang`, await markIs(mark));
}
// Navigasi klien ke detail di luar lingkup lewat halaman uji /u4-spike (memuat Link ke semua proyek seed)
for (const [key, userId, id] of [["siti", "u-002", "p-003"], ["siti", "u-002", "p-005"], ["ahmad", "u-003", "p-003"], ["dewi", "u-004", "p-002"], ["dewi", "u-004", "p-005"]]) {
  await setSession(userId);
  await navigate("/u4-spike");
  await waitFor(() => evaluate(`!!document.querySelector('a[href="/proyek/${id}"]')`), 30000, "halaman uji");
  await sleep(250);
  const mark = await setMark();
  await watch();
  await clickEl(`a[href="/proyek/${id}"]`);
  const got = await outcome();
  rec(`${key}: navigasi KLIEN ke /proyek/${id} (di luar lingkup) → akses ditolak tanpa muat ulang, konten tidak sempat terlihat`, got === "denied" && !(await seenLeak()) && (await markIs(mark)), `hasil ${got}`);
  await unwatch();
}

// ================= C. mock-store: tugas dan proyek runtime muncul lewat navigasi klien =================
{
  await setViewport({ width: 1280, height: 900 });
  await setSession("u-001");
  await navigate("/u4-spike");
  await waitFor(() => evaluate(`!!document.querySelector('[data-spike-action="create-task-p003-push"]')`), 30000, "halaman uji");
  await sleep(250);
  const mark = await setMark();
  await clickEl('[data-spike-action="create-task-p003-push"]');
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/tugas/t-007" ? true : null), 20000, "tugas runtime");
  await clickEl('[data-slot="sidebar-desktop"] nav a[href="/proyek"]');
  await waitFor(() => evaluate(`!!document.querySelector('[data-slot="project-row"][data-project-id="p-003"]')`), 20000, "daftar proyek");
  await clickEl('[data-slot="project-row"][data-project-id="p-003"] a');
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/proyek/p-003" ? true : null), 15000, "detail p-003");
  rec("runtime: tugas baru di proyek seed p-003 → detail p-003 lewat navigasi klien tanpa muat ulang", (await outcome()) === "detail" && (await markIs(mark)));
  rec("runtime: label tab Tugas (1) dan hitungan tugas 1", norm(await evaluate(`document.querySelector('[data-tab="tugas"]').textContent`)) === "Tugas (1)" && (await stat("total"))?.value === "1");
  await selectTab("tugas");
  const text = await rowText("table", "t-007");
  rec("runtime: tugas runtime TSK-007 tampil di tab Tugas dengan penanggung jawab \"Belum ditugaskan\"", !!text && text.includes("TSK-007") && text.includes("Tugas uji runtime (p-003)") && text.includes("Belum ditugaskan"), text ?? "tidak tampil");

  await setSession("u-001");
  await navigate("/u4-spike");
  await waitFor(() => evaluate(`!!document.querySelector('[data-spike-action="create-task-runtime-project-push"]')`), 30000, "halaman uji");
  await sleep(250);
  const mark2 = await setMark();
  await clickEl('[data-spike-action="create-task-runtime-project-push"]');
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/tugas/t-007" ? true : null), 20000, "tugas di proyek runtime");
  await clickEl('[data-slot="sidebar-desktop"] nav a[href="/proyek"]');
  await waitFor(() => evaluate(`!!document.querySelector('[data-slot="project-row"][data-project-id="p-006"]')`), 20000, "daftar proyek");
  await clickEl('[data-slot="project-row"][data-project-id="p-006"] a');
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/proyek/p-006" ? true : null), 15000, "detail p-006");
  rec("runtime: proyek runtime p-006 terbuka lewat navigasi klien (Owner), tanpa muat ulang", (await outcome()) === "detail" && (await markIs(mark2)));
  const info = norm(await evaluate(`document.querySelector('[data-slot="project-info"]').textContent`));
  rec("runtime: ringkasan p-006 memuat nama, status Draf, klien (uji), dan Admin \"Belum ditetapkan\"", (await evaluate(`document.querySelector("main h1").textContent`)) === "Proyek uji runtime" && info.includes("Draf") && info.includes("(uji)") && info.includes("Belum ditetapkan"), info.slice(0, 160));
  await selectTab("tim");
  rec("runtime: p-006 tanpa tim → state kosong tim", await vis('[data-slot="project-team-empty"]'));
  await evaluate(`sessionStorage.clear()`);
}

// ================= D. Responsif: 768 dan 375 mobile:true + sentuhan =================
const SWEEPS = [
  { key: "budi", id: "p-001", tabs: FULL_TABS },
  { key: "siti", id: "p-002", tabs: FULL_TABS },
  { key: "ahmad", id: "p-001", tabs: FULL_TABS },
  { key: "dewi", id: "p-001", tabs: NO_TEAM_TABS },
];
await setViewport({ width: 768, height: 1024 });
for (const s of SWEEPS) {
  const p = PERSONAS.find((x) => x.key === s.key);
  const got = await openDetail(p.id, s.id);
  rec(`${s.key} 768: detail ${s.id} siap`, got === "detail", got);
  for (const tab of s.tabs) {
    if (tab !== "ringkasan") await selectTab(tab);
    if (tab === "tugas") {
      const ids = p.tasks[s.id];
      rec(`${s.key} 768: tab Tugas memakai kartu (tabel tersembunyi) sesuai lingkup`, same(await taskIds("cards"), ids) && (await taskIds("table")).length === 0, JSON.stringify(await taskIds("cards")));
    }
    if (tab === "tim") {
      const team = TEAM[s.id].map((m) => m[0]);
      rec(`${s.key} 768: tab Tim memakai kartu (tabel tersembunyi)`, same(await teamIds("cards"), team) && (await teamIds("table")).length === 0, JSON.stringify(await teamIds("cards")));
    }
    await checkOverflow(`${s.key} ${s.id} ${tab} 768`);
    await checkAxe(`${s.key} ${s.id} ${tab} 768`);
    if (s.key === "budi" && tab === "tugas") await shot("budi-p-001-tugas-768");
  }
}

await setViewport({ width: 375, height: 800, mobile: true, touch: true });
for (const s of SWEEPS) {
  const p = PERSONAS.find((x) => x.key === s.key);
  const got = await openDetail(p.id, s.id);
  rec(`${s.key} mobile 375: emulasi sentuh aktif dan detail ${s.id} siap`, got === "detail" && (await evaluate(`navigator.maxTouchPoints`)) > 0 && (await evaluate(`innerWidth`)) === 375, got);
  // target sentuh dan keterlihatan permanen (tanpa aksi hover-only)
  const geo = await evaluate(`(() => { const box = (e) => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; }; return {
    back: box(document.querySelector('[data-slot="back-link"]')),
    tabs: [...document.querySelectorAll('[data-slot="tabs-tab"]')].map((t) => ({ name: t.getAttribute("data-tab"), ...box(t) })),
    hidden: [...document.querySelectorAll('[data-slot="back-link"], [data-slot="tabs-tab"]')].some((e) => getComputedStyle(e).opacity === "0" || getComputedStyle(e).visibility === "hidden"),
  }; })()`);
  results.measurements[`geo ${s.key} ${s.id} 375`] = geo;
  rec(`${s.key} mobile 375: tautan kembali dan semua tab >= 44x44px`, geo.back.h >= 44 && geo.back.w >= 44 && geo.tabs.every((t) => t.h >= 44 && t.w >= 44), JSON.stringify(geo));
  rec(`${s.key} mobile 375: kontrol utama tampil permanen (bukan hover-only)`, !geo.hidden);
  for (const tab of s.tabs) {
    if (tab !== "ringkasan") await selectTab(tab, true);
    const sel = await evaluate(`document.querySelector('[data-tab="${tab}"]').getAttribute("aria-selected")`);
    rec(`${s.key} mobile 375: ketuk tab ${tab} berpindah panel`, sel === "true");
    if (tab === "tugas") {
      const ids = p.tasks[s.id];
      const cards = await evaluate(`[...document.querySelectorAll('[data-slot="task-card"]')].filter((e) => e.checkVisibility()).map((e) => { const r = e.getBoundingClientRect(); return { id: e.getAttribute("data-task-id"), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) }; })`);
      rec(`${s.key} mobile 375: kartu tugas satu kolom sesuai lingkup, tabel tersembunyi`, same(cards.map((c) => c.id), ids) && cards.every((c) => c.left === cards[0].left && c.w === cards[0].w && c.right <= 375) && (await taskIds("table")).length === 0, JSON.stringify(cards));
      await evaluate(`window.scrollTo(0, 0)`);
      const firstTop = await evaluate(`Math.round(document.querySelector('[data-slot="task-card"]').getBoundingClientRect().top)`);
      results.measurements[`kartu pertama top ${s.key} 375`] = firstTop;
      rec(`${s.key} mobile 375: kartu tugas pertama sudah terlihat di layar pertama (mulai di atas 560px dari 800px)`, firstTop <= 560, `top ${firstTop}px`);
      const text = await rowText("cards", ids[0]);
      const t = TASKS[ids[0]];
      rec(`${s.key} mobile 375: kartu ${ids[0]} memuat kode, judul, status, penanggung jawab dari relasi User`, !!text && [t.code, t.title, t.status, `Penanggung jawab: ${t.assignee}`].every((x) => text.includes(x)), text ?? "tidak tampil");
    }
    if (tab === "tim") {
      const team = TEAM[s.id].map((m) => m[0]);
      const cards = await evaluate(`[...document.querySelectorAll('[data-slot="record-card"][data-user-id]')].filter((e) => e.checkVisibility()).map((e) => { const r = e.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) }; })`);
      rec(`${s.key} mobile 375: kartu tim satu kolom (${team.length} orang), tabel tersembunyi${p.email ? "" : ", tanpa email"}`, same(await teamIds("cards"), team) && cards.every((c) => c.left === cards[0].left && c.w === cards[0].w && c.right <= 375) && (await teamIds("table")).length === 0 && (p.email || !(await mainText()).includes("@")));
    }
    await checkOverflow(`${s.key} ${s.id} ${tab} 375 mobile`);
    await checkAxe(`${s.key} ${s.id} ${tab} 375 mobile`);
    await evaluate(`window.scrollTo(0, 0)`);
    if ((s.key === "ahmad" || s.key === "dewi" || s.key === "budi") && s.id === "p-001") await shot(`${s.key}-p-001-${tab}-375`);
  }
}
{
  // Arsip di mobile: hanya baca
  const got = await openDetail("u-001", "p-005");
  rec("budi mobile 375: Arsip p-005 siap, penanda Hanya baca dan catatan tampil, tanpa tombol di luar tab", got === "detail" && (await vis('[data-slot="archived-note"]')) && (await evaluate(`[...document.querySelectorAll("main button")].filter((b) => !b.closest('[role="tablist"]')).length === 0`)));
  await checkOverflow("budi p-005 375 mobile");
  await checkAxe("budi p-005 ringkasan 375 mobile");
  await shot("budi-p-005-arsip-375");
}

// ================= E. Keyboard: Tabs (panah, Home, End) =================
{
  await setViewport({ width: 1280, height: 900 });
  const got = await openDetail("u-001", "p-001");
  rec("keyboard: detail siap untuk uji tab", got === "detail");
  const selected = () => evaluate(`[...document.querySelectorAll('[data-slot="tabs-tab"]')].find((t) => t.getAttribute("aria-selected") === "true")?.getAttribute("data-tab")`);
  await evaluate(`document.querySelector('[data-tab="ringkasan"]').focus()`);
  await pressKey("ArrowRight");
  await sleep(200);
  rec("keyboard: ArrowRight memindahkan dan mengaktifkan tab Tugas (panel berganti)", (await selected()) === "tugas" && (await vis('[data-slot="project-tasks"]')));
  await pressKey("End");
  await sleep(200);
  rec("keyboard: End ke tab terakhir (Tim)", (await selected()) === "tim" && (await vis('[data-slot="project-team"]')));
  await pressKey("Home");
  await sleep(200);
  rec("keyboard: Home ke tab pertama (Ringkasan)", (await selected()) === "ringkasan" && (await vis('[data-slot="project-info"]')));
  const focusRing = await evaluate(`(() => { const t = document.querySelector('[data-tab="ringkasan"]'); t.focus(); const s = getComputedStyle(t); return { outline: s.outlineStyle, width: s.outlineWidth }; })()`);
  results.measurements["fokus tab"] = focusRing;
}

// ================= F. Akun uji sementara: Guest dan nama dari relasi User (mock.ts selalu dipulihkan) =================
{
  const HEAD = /export const MOCK_USERS: User\[\] = \[\r?\n/;
  if (!HEAD.test(MOCK_ORIGINAL)) throw new Error("MOCK_USERS tidak ditemukan; sesuaikan pengujian");
  const GUEST = { id: "u-uji-guest", name: "Tamu Uji", email: "tamu.uji@contoh.co.id", role: "GUEST" };
  const LEGACY = "Salinan Usang";
  try {
    const mutated = MOCK_ORIGINAL.replace(HEAD, (h) => `${h}  { id: "${GUEST.id}", name: "${GUEST.name}", email: "${GUEST.email}", role: "${GUEST.role}" },\n`).replace(/assigneeName: "[^"]*"/g, `assigneeName: "${LEGACY}"`);
    writeFileSync(MOCK_FILE, mutated);
    // Halaman Tugas lama (U2) masih menampilkan Task.assigneeName: bukti bahwa mock yang diubah sudah termuat.
    await waitFor(async () => {
      await navigate("/tugas");
      return evaluate(`document.body.textContent.includes(${q(LEGACY)})`);
    }, 120000, "mock termutasi termuat");
    await setViewport({ width: 1280, height: 900 });

    for (const [key, userId, id] of [["budi", "u-001", "p-001"], ["ahmad", "u-003", "p-001"], ["dewi", "u-004", "p-001"]]) {
      await openDetail(userId, id);
      await selectTab("tugas");
      const text = await mainText();
      const expected = (PERSONAS.find((x) => x.key === key).tasks[id] ?? []).map((tid) => TASKS[tid].assignee);
      rec(`${key}: nama penanggung jawab diambil dari relasi User, bukan salinan teks legacy Task.assigneeName (tabel)`, !text.includes(LEGACY) && expected.every((n) => text.includes(n)), `legacy muncul: ${text.includes(LEGACY)}`);
    }
    await setViewport({ width: 375, height: 800, mobile: true, touch: true });
    await openDetail("u-004", "p-001");
    await selectTab("tugas", true);
    const text = await mainText();
    rec("dewi mobile 375: kartu tugas juga memakai nama dari relasi User (bukan salinan legacy)", !text.includes(LEGACY) && text.includes("Penanggung jawab: Dewi Lestari"));

    // Guest: tanpa App Shell, konten tidak pernah terlihat
    await setViewport({ width: 1280, height: 900 });
    for (const id of ["p-001", "p-003"]) {
      await setSession(GUEST.id);
      await watch();
      await navigate(`/proyek/${id}`);
      const got = await outcome();
      rec(`guest: URL langsung /proyek/${id} → akses ditolak, konten detail tidak pernah terlihat`, got === "denied" && !(await seenLeak()), got);
      const names = Object.values(PROJECTS).map((pr) => pr.name);
      const namesVisible = await evaluate(`${q(names)}.some((n) => [...document.querySelectorAll("*")].some((e) => e.checkVisibility?.() && e.children.length === 0 && e.textContent.includes(n)))`);
      rec(`guest: /proyek/${id} tanpa sidebar App Shell dan tanpa nama proyek yang terlihat`, !(await vis('[data-slot="sidebar-desktop"]')) && !namesVisible);
      await unwatch();
    }
    await shot("guest-akses-ditolak-1280");
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
