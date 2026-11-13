// Pemeriksaan Dashboard Access Correction (keputusan Owner 2026-11-13): Dashboard hanya menurunkan data dari proyek dalam
// lingkup pengguna aktif. Bagian A (tanpa browser): fungsi ringkasan `lib/dashboard-summary.ts` per persona, termasuk Rina
// sebelum/sesudah ditetapkan sebagai Admin principal, Admin dengan lebih dari satu proyek, dan pengguna yang menjadi anggota
// beberapa proyek (dihitung satu kali). Bagian B (Chrome via CDP, dev server): kartu statistik, tabel proyek, kalimat lingkup,
// state kosong, HTML prerender tanpa data proyek, data proyek tidak pernah terlihat oleh Rina, perubahan store langsung
// tercermin (hook uji development U4-7), 375 (mobile + sentuh) / 768 / 1280, overflow, axe.
// Nilai harapan ditulis sebagai LITERAL (bukan dihitung dari access.ts) agar perubahan lingkup yang tidak disengaja tertangkap.
// Representasi UI mock, BUKAN otorisasi. Jalankan: npm run check:dashboard-access [-- <folder-bukti>] [--unit-only]
import "./lib/register-ts.mjs";

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { createBrowser, sleep, waitFor } from "./lib/cdp.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const UNIT_ONLY = args.includes("--unit-only");
const OUT = resolve(args.find((a) => !a.startsWith("--")) ?? join(ROOT, ".dashboard-access-check"));
mkdirSync(OUT, { recursive: true });

const results = { checks: [], measurements: {}, failures: [] };
const rec = (name, ok, detail = "") => {
  results.checks.push({ name, ok: !!ok, detail });
  if (!ok) {
    results.failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log("FAIL:", name, detail);
  } else console.log("ok:  ", name, detail);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const q = (s) => JSON.stringify(s);
const finish = () => {
  writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
  const total = results.checks.length;
  console.log(results.failures.length ? `\n${results.failures.length} masalah dari ${total} pemeriksaan.` : `\nSemua ${total} pemeriksaan lolos.`);
};

// ================= A. Fungsi ringkasan (tanpa browser) =================
const load = (rel) => import(pathToFileURL(join(ROOT, "src", rel)).href);
const mock = await load("data/mock.ts");
const store = await load("lib/mock-store.ts");
const summaryMod = await load("lib/dashboard-summary.ts").catch((e) => {
  rec("A modul lib/dashboard-summary.ts tersedia", false, e.message.split("\n")[0]);
  return null;
});

const U = { budi: "u-001", siti: "u-002", ahmad: "u-003", dewi: "u-004", eko: "u-005", rina: "u-006" };
const user = (id) => mock.MOCK_USERS.find((u) => u.id === id);
const seedData = () => ({ users: store.SEED.users, projects: store.SEED.projects, members: store.SEED.members, tasks: store.SEED.tasks });
const withAdmin = (data, projectId, adminId) => ({
  ...data,
  projects: data.projects.map((p) => {
    if (p.id !== projectId) return p;
    if (adminId) return { ...p, adminId };
    const { adminId: _removed, ...rest } = p;
    void _removed;
    return rest;
  }),
});
const view = (s) => ({ projects: s.projects.map((p) => p.id), active: s.activeProjects, pending: s.pendingTasks, reports: s.pendingReports, team: s.teamMembers, scope: s.scope });

if (summaryMod) {
  const { getDashboardSummary } = summaryMod;
  const sum = (id, data = seedData()) => view(getDashboardSummary(id === null ? null : user(id), data, mock.MOCK_REPORTS));
  const expect = (label, actual, expected) => rec(`A ${label}`, same(actual, expected), `diharapkan ${q(expected)}, hasil ${q(actual)}`);

  expect("Owner: semua proyek; 3 aktif, 5 tugas belum Selesai, 2 laporan Terkirim, 4 orang unik", sum(U.budi), { projects: ["p-001", "p-002", "p-003", "p-004", "p-005"], active: 3, pending: 5, reports: 2, team: 4, scope: "ALL" });
  expect("Siti (Admin principal p-001, p-002): hanya proyeknya; 2 aktif, 5 tugas, 2 laporan, 4 orang", sum(U.siti), { projects: ["p-001", "p-002"], active: 2, pending: 5, reports: 2, team: 4, scope: "ASSIGNED" });
  expect("Rina tanpa penugasan: tanpa proyek dan semua statistik 0", sum(U.rina), { projects: [], active: 0, pending: 0, reports: 0, team: 0, scope: "NONE" });

  // Rina ditetapkan menggantikan Siti di p-001: Rina hanya p-001; Siti tinggal p-002.
  const rinaP1 = withAdmin(seedData(), "p-001", U.rina);
  expect("Rina setelah ditetapkan di p-001: hanya p-001; 1 aktif, 3 tugas, 1 laporan, 4 orang (Rina + 3 anggota)", sum(U.rina, rinaP1), { projects: ["p-001"], active: 1, pending: 3, reports: 1, team: 4, scope: "ASSIGNED" });
  expect("Siti setelah digantikan di p-001: hanya p-002; 1 aktif, 2 tugas, 1 laporan, 3 orang", sum(U.siti, rinaP1), { projects: ["p-002"], active: 1, pending: 2, reports: 1, team: 3, scope: "ASSIGNED" });
  expect("Owner setelah pergantian: proyek dan tugas tetap; orang unik 5 (Rina Admin p-001, Siti tetap Admin p-002)", sum(U.budi, rinaP1), { projects: ["p-001", "p-002", "p-003", "p-004", "p-005"], active: 3, pending: 5, reports: 2, team: 5, scope: "ALL" });

  // Rina di proyek tanpa anggota dan tanpa tugas (p-003, Tertunda): ia sendiri terhitung; tidak ada data proyek lain.
  const rinaP3 = withAdmin(seedData(), "p-003", U.rina);
  expect("Rina di p-003 (tanpa anggota/tugas): 1 aktif (Tertunda), 0 tugas, 0 laporan, 1 orang", sum(U.rina, rinaP3), { projects: ["p-003"], active: 1, pending: 0, reports: 0, team: 1, scope: "ASSIGNED" });
  expect("Siti tidak terpengaruh penetapan Rina di p-003", sum(U.siti, rinaP3), sum(U.siti));

  // Admin dengan lebih dari satu proyek dan pengguna di beberapa proyek: Ahmad dan Eko anggota p-001 DAN p-002.
  const entries = ["p-001", "p-002"].map((pid) => store.SEED.members.filter((m) => m.projectId === pid).length + 1).reduce((a, b) => a + b, 0);
  rec("A data uji: Siti memiliki 7 entri tim (2 Admin + 5 keanggotaan) di dua proyek", entries === 7, String(entries));
  rec("A pengguna di beberapa proyek dihitung satu kali (7 entri → 4 orang, bukan jumlah keanggotaan)", sum(U.siti).team === 4);

  // Role tanpa Dashboard: ringkasan kosong (fail-closed), walau anggota proyek.
  for (const [key, id] of [["ahmad (Mandor)", U.ahmad], ["dewi (Anggota Tim)", U.dewi], ["tanpa pengguna", null]]) {
    expect(`${key}: ringkasan kosong (tanpa akses Dashboard)`, sum(id), { projects: [], active: 0, pending: 0, reports: 0, team: 0, scope: "NONE" });
  }
  expect("Guest: ringkasan kosong", view(getDashboardSummary({ id: "u-guest", name: "Tamu", email: "t@x", role: "GUEST" }, seedData(), mock.MOCK_REPORTS)), { projects: [], active: 0, pending: 0, reports: 0, team: 0, scope: "NONE" });

  // Data runtime: tugas baru di p-001 menambah tugas Siti dan Owner, tidak untuk Rina; proyek runtime (tanpa Admin) hanya Owner.
  const runtime = {
    ...seedData(),
    tasks: [...store.SEED.tasks, { id: "t-007", code: "TSK-007", projectId: "p-001", title: "Uji", status: "TODO", priority: "MEDIUM", assigneeId: U.dewi, progress: 0 }],
    projects: [...store.SEED.projects, { id: "p-006", code: "PRJ-006", name: "Proyek Runtime", client: "Uji", location: "Batam", status: "ON_PROGRESS", startDate: "2026-03-01", endDate: "2026-06-01", progress: 0 }],
  };
  rec("A runtime: tugas baru p-001 → Siti 6 tugas belum Selesai", sum(U.siti, runtime).pending === 6);
  rec("A runtime: proyek baru tanpa Admin → Owner 6 proyek, 4 aktif", same([sum(U.budi, runtime).projects.length, sum(U.budi, runtime).active], [6, 4]));
  rec("A runtime: proyek baru tanpa Admin tidak terlihat Siti dan Rina", !sum(U.siti, runtime).projects.includes("p-006") && sum(U.rina, runtime).projects.length === 0);
  rec("A tugas Selesai tidak dihitung tertunda; tugas di luar lingkup tidak dihitung (Rina 0)", sum(U.rina, runtime).pending === 0);
  // Owner tanpa proyek sama sekali (kasus tepi): lingkup tetap ALL dengan 0 proyek (copy khusus Owner, bukan copy Admin).
  expect("Owner tanpa proyek: lingkup ALL, semua 0", sum(U.budi, { ...seedData(), projects: [], members: [], tasks: [] }), { projects: [], active: 0, pending: 0, reports: 0, team: 0, scope: "ALL" });
  const labelsMod = await load("lib/labels.ts");
  rec("A copy kosong Owner berbeda dari copy Admin (tidak menyuruh menunggu Owner)", labelsMod.getDashboardEmptyText("ALL").description !== labelsMod.getDashboardEmptyText("NONE").description && !/Owner menetapkan/.test(labelsMod.getDashboardEmptyText("ALL").description), q(labelsMod.getDashboardEmptyText("ALL")));
  rec("A kalimat lingkup Owner tanpa proyek tidak menyebut '0 proyek'", !/\b0 proyek/.test(labelsMod.getDashboardScopeText("ALL", 0)), labelsMod.getDashboardScopeText("ALL", 0));
  // Fungsi murni: tidak mengubah data masukan.
  const frozen = seedData();
  const before = JSON.stringify(frozen);
  getDashboardSummary(user(U.budi), frozen, mock.MOCK_REPORTS);
  rec("A fungsi ringkasan tidak mengubah data masukan", JSON.stringify(frozen) === before);
}

// Sumber: dashboard tidak lagi membaca seed langsung (MOCK_*) untuk data proyek/tugas/laporan/pengguna.
{
  const page = readFileSync(join(ROOT, "src/app/(app)/dashboard/page.tsx"), "utf8");
  rec("A sumber: dashboard/page.tsx tidak mengimpor MOCK_PROJECTS/MOCK_TASKS/MOCK_REPORTS/MOCK_USERS", !/MOCK_(PROJECTS|TASKS|REPORTS|USERS)/.test(page));
}

if (UNIT_ONLY) {
  finish();
  process.exit(results.failures.length ? 1 : 0);
}

// ================= B. Browser =================
const APP_PORT = 3520;
const BASE = `http://localhost:${APP_PORT}`;
const SESSION_KEY = "proyekin-demo-session";
const PROJECT_NAMES = mock.MOCK_PROJECTS.map((p) => p.name);
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(APP_PORT)], { cwd: ROOT, stdio: "ignore" });
const browser = await createBrowser({ cdpPort: 9680 });
const { send, evaluate, setViewport } = browser;
const cleanup = () => {
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
  finish();
  process.exit(1);
});
await waitFor(async () => (await fetch(`${BASE}/masuk`)).ok, 120000, "dev server");

const axeSource = readFileSync(join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
const AXE_RUN = `(async () => {
  const r = await axe.run({ exclude: [["nextjs-portal"]] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
  return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " :: " + (n.failureSummary || "").split("\\n").slice(0, 2).join(" | ")) }));
})()`;
async function checkAxe(label) {
  if (!(await evaluate(`typeof window.axe !== "undefined"`))) await evaluate(axeSource);
  const v = await evaluate(AXE_RUN);
  results.measurements[`axe ${label}`] = v;
  rec(`axe 0 pelanggaran: ${label}`, v.length === 0, v.map((x) => `${x.id}: ${x.nodes.join("; ")}`).join(" || "));
}
async function checkOverflow(label) {
  const o = await evaluate(`({ s: document.documentElement.scrollWidth, w: window.innerWidth })`);
  rec(`overflow halaman: ${label}`, o.s <= o.w + 1, `${o.s} <= ${o.w}`);
}
async function shot(name) {
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
}

// Pengamat kebocoran: mencatat bila nama atau kode proyek PERNAH terlihat di <main> (kunci di sessionStorage).
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => { const names = ${q(PROJECT_NAMES)}; const check = () => { try { if (sessionStorage.getItem("__watchLeak") !== "1") return; const m = document.querySelector("main"); if (!m || !m.checkVisibility()) return;
    const t = m.innerText || ""; if (/PRJ-\\d{3}/.test(t) || names.some((n) => t.includes(n))) sessionStorage.setItem("__leakSeen", "1"); } catch {} };
    new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true, characterData: true }); })();`,
});

async function navigate(path) {
  await send("Page.navigate", { url: `${BASE}${path}` });
  await waitFor(() => evaluate(`document.readyState === "complete"`), 90000, `muat ${path}`);
  await evaluate(`document.fonts.ready.then(() => true)`);
}
async function setSession(userId, { watchLeak = false } = {}) {
  await navigate("/masuk");
  await evaluate(`sessionStorage.clear(); sessionStorage.setItem(${q(SESSION_KEY)}, JSON.stringify({ userId: ${q(userId)}, loginAt: new Date().toISOString() })); ${watchLeak ? `sessionStorage.setItem("__watchLeak", "1");` : ""}`);
}
const ready = (label) =>
  waitFor(() => evaluate(`(() => { const d = document.querySelector('[data-slot="dashboard"][data-state="ready"]'); return !!d && d.checkVisibility(); })()`), 30000, `dashboard siap ${label}`);
const readDashboard = () =>
  evaluate(`(() => {
    const num = (key) => { const el = document.querySelector('[data-stat="' + key + '"]'); const m = el && el.textContent.match(/\\d+/); return m ? Number(m[0]) : null; };
    return {
      scope: document.querySelector('[data-slot="dashboard-scope"]')?.textContent.trim() ?? null,
      stats: [num("active-projects"), num("pending-tasks"), num("pending-reports"), num("team-members")],
      rows: [...document.querySelectorAll('[data-slot="dashboard-projects"] tbody tr')].map((r) => r.cells[0]?.textContent.trim()),
      empty: !!document.querySelector('[data-slot="dashboard-empty"]')?.checkVisibility(),
      emptyText: document.querySelector('[data-slot="dashboard-empty"]')?.innerText.replace(/\\s+/g, " ").trim() ?? null,
      labels: [...document.querySelectorAll('[data-stat]')].map((e) => e.innerText.replace(/\\d+/g, "#").replace(/\\s+/g, " ").trim()),
    };
  })()`);

// B1. HTML prerender /dashboard tidak memuat data proyek (sebelumnya seluruh tabel proyek ada di HTML statis).
{
  const html = await (await fetch(`${BASE}/dashboard`)).text();
  const leaked = PROJECT_NAMES.filter((n) => html.includes(n));
  rec("B HTML /dashboard tanpa nama proyek", leaked.length === 0, leaked.join(" | "));
  rec("B HTML /dashboard tanpa kode proyek PRJ-00x", !/PRJ-00\d/.test(html));
}

const OWNER_SCOPE = "Ringkasan seluruh 5 proyek organisasi.";
const SITI_SCOPE = "Ringkasan 2 proyek yang Anda tangani sebagai Admin penanggung jawab.";
const RINA_SCOPE = "Belum ada proyek yang Anda tangani sebagai Admin penanggung jawab.";
const EMPTY_TEXT = "Belum ada proyek yang Anda tangani Proyek dan ringkasannya muncul di sini setelah Owner menetapkan Anda sebagai Admin penanggung jawab sebuah proyek.";
const STAT_LABELS = ["Proyek Aktif # Berjalan atau Tertunda", "Tugas Tertunda # Belum Selesai", "Laporan Menunggu # Berstatus Terkirim", "Anggota Tim # Dihitung sekali per orang"];
const VIEWPORTS = [
  [{ width: 1280, height: 900 }, "1280"],
  [{ width: 768, height: 1024 }, "768"],
  [{ width: 375, height: 800, mobile: true, touch: true }, "375"],
];

// B2. Owner, Siti, Rina di tiga viewport.
const CASES = [
  { key: "budi", id: U.budi, scope: OWNER_SCOPE, stats: [3, 5, 2, 4], rows: ["PRJ-001", "PRJ-002", "PRJ-003", "PRJ-004", "PRJ-005"], empty: false },
  { key: "siti", id: U.siti, scope: SITI_SCOPE, stats: [2, 5, 2, 4], rows: ["PRJ-001", "PRJ-002"], empty: false },
  { key: "rina", id: U.rina, scope: RINA_SCOPE, stats: [0, 0, 0, 0], rows: [], empty: true },
];
for (const [viewport, vlabel] of VIEWPORTS) {
  await setViewport(viewport);
  for (const c of CASES) {
    await setSession(c.id, { watchLeak: c.key === "rina" });
    await navigate("/dashboard");
    await ready(`${c.key} ${vlabel}`).catch(() => null);
    const d = await readDashboard();
    results.measurements[`${c.key} ${vlabel}`] = d;
    rec(`B ${c.key} ${vlabel}: kalimat lingkup`, d.scope === c.scope, q(d.scope));
    rec(`B ${c.key} ${vlabel}: statistik ${q(c.stats)}`, same(d.stats, c.stats), q(d.stats));
    rec(`B ${c.key} ${vlabel}: baris tabel proyek ${q(c.rows)}`, same(d.rows, c.rows), q(d.rows));
    rec(`B ${c.key} ${vlabel}: state kosong ${c.empty ? "tampil dengan penjelasan" : "tidak tampil"}`, c.empty ? d.empty && d.emptyText === EMPTY_TEXT : !d.empty, q(d.emptyText));
    if (vlabel === "1280") rec(`B ${c.key}: label dan keterangan kartu statistik`, same(d.labels, STAT_LABELS), q(d.labels));
    if (c.key === "rina") rec(`B rina ${vlabel}: nama/kode proyek tidak pernah terlihat`, !(await evaluate(`sessionStorage.getItem("__leakSeen") === "1"`)));
    await checkOverflow(`${c.key} /dashboard ${vlabel}`);
    await checkAxe(`${c.key} /dashboard ${vlabel}`);
    await evaluate(`window.scrollTo(0, 0)`);
    await shot(`${c.key}-dashboard-${vlabel}`);
  }
}

// B3. Perubahan store langsung tercermin (Rina): ditetapkan di p-001 → hanya p-001; dicabut → kosong lagi. Hook dev U4-7.
await setViewport({ width: 1280, height: 900 });
await setSession(U.rina);
await navigate("/dashboard");
await ready("rina sebelum penetapan");
const hook = await waitFor(() => evaluate(`typeof window.__PROYEKIN_TEST__?.setProjectAdmin === "function"`), 30000, "hook uji").catch(() => false);
rec("B hook uji development tersedia", hook);
if (hook) {
  await evaluate(`window.__PROYEKIN_TEST__.setProjectAdmin("p-001", "u-006") !== null`);
  await waitFor(async () => (await readDashboard()).rows.length === 1, 10000, "Rina melihat p-001").catch(() => null);
  const after = await readDashboard();
  results.measurements["rina setelah ditetapkan p-001"] = after;
  rec("B rina setelah ditetapkan di p-001 (tanpa muat ulang): lingkup 1 proyek", after.scope === "Ringkasan 1 proyek yang Anda tangani sebagai Admin penanggung jawab.", q(after.scope));
  rec("B rina setelah ditetapkan: statistik [1,3,1,4]", same(after.stats, [1, 3, 1, 4]), q(after.stats));
  rec("B rina setelah ditetapkan: hanya PRJ-001; state kosong hilang", same(after.rows, ["PRJ-001"]) && !after.empty, q(after.rows));
  await checkAxe("rina setelah ditetapkan 1280");
  await shot("rina-dashboard-setelah-ditetapkan-1280");
  await evaluate(`window.__PROYEKIN_TEST__.setProjectAdmin("p-001", null) !== null`);
  await waitFor(async () => (await readDashboard()).empty, 10000, "Rina kosong lagi").catch(() => null);
  const revoked = await readDashboard();
  rec("B rina setelah dicabut: kembali kosong, statistik 0", revoked.empty && same(revoked.stats, [0, 0, 0, 0]) && revoked.rows.length === 0, q(revoked));
  // Tugas runtime di p-001 (di luar lingkup Rina): statistiknya tetap 0. Lalu Rina ditetapkan lagi di p-001 → tugas runtime
  // ikut terhitung (3 seed + 1 runtime = 4). Ini membuktikan Dashboard berlangganan store dan menyaring tugas per lingkup.
  await evaluate(`window.__PROYEKIN_TEST__.createTask({ projectId: "p-001", title: "Tugas runtime", status: "TODO", priority: "MEDIUM", assigneeId: "u-004", progress: 0 }).id`);
  await sleep(300);
  rec("B rina: tugas runtime di p-001 (di luar lingkupnya) tidak menambah statistiknya", same((await readDashboard()).stats, [0, 0, 0, 0]));
  await evaluate(`window.__PROYEKIN_TEST__.setProjectAdmin("p-001", "u-006") !== null`);
  await waitFor(async () => (await readDashboard()).rows.length === 1, 10000, "Rina melihat p-001 lagi").catch(() => null);
  const withRuntime = await readDashboard();
  rec("B rina ditetapkan lagi di p-001: tugas runtime ikut terhitung [1,4,1,4]", same(withRuntime.stats, [1, 4, 1, 4]), q(withRuntime.stats));
}

// B4. Persona tanpa Dashboard tidak pernah melihat ringkasan (URL langsung).
for (const [key, id] of [["ahmad", U.ahmad], ["dewi", U.dewi]]) {
  await setSession(id, { watchLeak: true });
  await navigate("/dashboard");
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/akses-ditolak" ? true : null), 20000, `${key} ditolak`).catch(() => null);
  rec(`B ${key}: /dashboard dialihkan ke Akses Ditolak tanpa data proyek terlihat`, (await evaluate(`location.pathname`)) === "/akses-ditolak" && !(await evaluate(`sessionStorage.getItem("__leakSeen") === "1"`)));
}

await evaluate(`sessionStorage.clear()`);
finish();
cleanup();
process.exit(results.failures.length ? 1 : 0);
