// Pemeriksaan daftar responsif (follow-up audit visual P1) di browser (Chrome via CDP, dev server).
// Laporan, Dokumen, Anggota (dan Tugas, Langkah 3): di bawah lg tampil KARTU (satu kolom di 375, dua kolom di 768) dengan
// SEMUA kolom tabel sebagai pasangan label-nilai; mulai lg tampil TABEL dengan semua kolom. Tidak ada kolom yang tersembunyi,
// tidak ada wadah yang bisa digulir horizontal, kartu tidak interaktif, hierarki heading berurutan, axe 0.
// Data harapan literal dari mock (sengaja bukan dihitung dari kode halaman). Representasi UI mock, BUKAN otorisasi.
// Jalankan: npm run check:responsive-lists [-- <folder-bukti>]
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { createBrowser, sleep, waitFor } from "./lib/cdp.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(process.argv[2] ?? join(ROOT, ".responsive-lists-check"));
const APP_PORT = 3500;
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
/** Nilai harapan: string, atau daftar alternatif (mis. tanggal yang bergantung zona waktu mesin). */
const matches = (text, expected) => (Array.isArray(expected) ? expected.includes(text) : text === expected);
const includesAny = (text, expected) => (Array.isArray(expected) ? expected.some((e) => text.includes(e)) : text.includes(expected));

// ---- data harapan (literal dari mock) ----
const LAPORAN = {
  key: "laporan",
  path: "/laporan",
  h1: "Laporan Harian",
  section: "Semua Laporan",
  count: "3 laporan",
  listLabel: "Daftar laporan harian",
  tableLabel: "Daftar laporan harian",
  tableHeaders: ["Tanggal", "Proyek", "Mandor", "Pekerja", "Cuaca", "Status"],
  labels: ["Proyek", "Mandor", "Pekerja", "Cuaca", "Status"],
  records: [
    { id: "r-001", title: "20 Februari 2026", values: ["PRJ-001", "Ahmad Rizal", "12", "Cerah Berawan", "Terkirim"] },
    { id: "r-002", title: "19 Februari 2026", values: ["PRJ-001", "Ahmad Rizal", "10", "Cerah", "Disetujui"] },
    { id: "r-003", title: "21 Maret 2026", values: ["PRJ-002", "Eko Prasetyo", "8", "Hujan Ringan", "Terkirim"] },
  ],
};
const DOKUMEN = {
  key: "dokumen",
  path: "/dokumen",
  h1: "Dokumen",
  section: "Semua Dokumen",
  count: "5 dokumen",
  listLabel: "Daftar dokumen",
  tableLabel: "Daftar dokumen",
  tableHeaders: ["Nama", "Kategori", "Diunggah", "Ukuran"],
  labels: ["Kategori", "Diunggah", "Ukuran"],
  records: [
    { id: "d-001", title: "Gambar Arsitektur Lantai 1-3", values: ["Gambar Teknis", "20 Januari 2026", "15.0 MB"] },
    { id: "d-002", title: "RAB Renovasi Gedung Kantor", values: ["Rencana Kerja", "18 Januari 2026", "2.0 MB"] },
    { id: "d-003", title: "Kontrak Pekerjaan No. 045/CON/2026", values: ["Kontrak", "15 Januari 2026", "5.0 MB"] },
    // 2026-02-20T18:00:00Z: tanggal lokal bergantung zona waktu mesin (formatDate memakai zona lokal; sudah demikian sejak U2).
    { id: "d-004", title: "Foto Progress Pembongkaran 20 Feb", values: ["Lainnya", ["20 Februari 2026", "21 Februari 2026"], "50.0 MB"] },
    { id: "d-005", title: "Gambar Struktur Jembatan", values: ["Gambar Teknis", "5 Oktober 2025", "12.0 MB"] },
  ],
};
const ANGGOTA = {
  key: "anggota",
  path: "/anggota",
  h1: "Anggota",
  section: "Semua Anggota",
  count: "5 anggota",
  listLabel: "Daftar anggota tim",
  tableLabel: "Daftar anggota tim",
  tableHeaders: ["Nama", "Email", "Role"],
  labels: ["Email", "Role"],
  records: [
    { id: "u-001", title: "Budi Santoso", values: ["budi@proyekin.id", "Owner"] },
    { id: "u-002", title: "Siti Aminah", values: ["siti@proyekin.id", "Admin Kantor"] },
    { id: "u-003", title: "Ahmad Rizal", values: ["ahmad@proyekin.id", "Mandor"] },
    { id: "u-004", title: "Dewi Lestari", values: ["dewi@proyekin.id", "Anggota Tim"] },
    { id: "u-005", title: "Eko Prasetyo", values: ["eko@proyekin.id", "Mandor"] },
  ],
};
const PAGES = [LAPORAN, DOKUMEN, ANGGOTA];
const VPS = [
  { n: 375, v: { width: 375, height: 800, mobile: true, touch: true } },
  { n: 768, v: { width: 768, height: 1024 } },
  { n: 1280, v: { width: 1280, height: 900 } },
];

// ---- server, browser, utilitas ----
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(APP_PORT)], { cwd: ROOT, stdio: "ignore" });
const browser = await createBrowser({ cdpPort: 9666 });
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
  process.exit(1);
});
await waitFor(async () => (await fetch(`${BASE}/masuk`)).ok, 120000, "dev server");

const axeSource = readFileSync(join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
const AXE_RUN = `(async () => {
  const r = await axe.run({ exclude: [["nextjs-portal"]] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
  return r.violations.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " :: " + (n.failureSummary || "").split("\\n").slice(0, 2).join(" | ")) }));
})()`;
async function checkAxe(label) {
  if (!(await evaluate(`typeof window.axe !== "undefined"`))) await evaluate(axeSource);
  const v = await evaluate(AXE_RUN);
  results.measurements[`axe ${label}`] = v;
  rec(`axe 0 pelanggaran: ${label}`, v.length === 0, v.map((x) => `${x.id}: ${x.nodes.join("; ")}`).join(" || "));
}
async function navigate(path) {
  await send("Page.navigate", { url: `${BASE}${path}` });
  await waitFor(() => evaluate(`document.readyState === "complete"`), 90000, `muat ${path}`);
  await evaluate(`document.fonts.ready.then(() => true)`);
}
async function setSession(userId) {
  await navigate("/masuk");
  await evaluate(`sessionStorage.clear(); sessionStorage.setItem(${q(SESSION_KEY)}, JSON.stringify({ userId: ${q(userId)}, loginAt: new Date().toISOString() }))`);
}
/** Menunggu halaman daftar siap (guard mengizinkan) atau dialihkan ke akses ditolak. */
const outcome = () =>
  waitFor(
    () =>
      evaluate(`(() => {
        if (location.pathname === "/akses-ditolak" && document.querySelector("h1")?.textContent === "Akses tidak tersedia") return "denied";
        return [...document.querySelectorAll('[data-slot="access-guard"][data-guard-status="allowed"]')].some((e) => e.checkVisibility()) ? "allowed" : null;
      })()`),
    20000,
    "hasil guard",
  ).catch(() => "timeout");
async function shotFull(name) {
  const h = await evaluate(`Math.min(document.documentElement.scrollHeight, 3000)`);
  const w = await evaluate(`innerWidth`);
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
}
async function overflowOk(label) {
  const o = await evaluate(`({ s: document.documentElement.scrollWidth, w: window.innerWidth })`);
  rec(`overflow halaman: ${label}`, o.s <= o.w + 1, `${o.s} <= ${o.w}`);
}

// Pembacaan DOM (hanya elemen yang TERLIHAT).
const READ_CARDS = (listLabel) => `(() => {
  const list = [...document.querySelectorAll('ul[data-slot="record-card-list"]')].find((u) => u.checkVisibility() && u.getAttribute("aria-label") === ${q(listLabel)});
  if (!list) return null;
  const lis = [...list.children];
  return { role: list.getAttribute("role"), liCount: lis.length, cards: lis.map((li) => { const c = li.querySelector('[data-slot="record-card"]'); const r = li.getBoundingClientRect(); const dts = [...c.querySelectorAll("dt")].map((d) => d.textContent.trim()); const dds = [...c.querySelectorAll("dd")].map((d) => d.textContent.trim()); return { id: c.getAttribute("data-record-id"), title: c.querySelector("h2,h3,h4")?.textContent.trim(), titleTag: c.querySelector("h2,h3,h4")?.tagName, labels: dts, values: dds, left: Math.round(r.left), width: Math.round(r.width), right: Math.round(r.right), interactive: c.querySelectorAll("a, button, input, select, textarea, [tabindex]").length, hoverClass: c.querySelectorAll('[class*="hover:"]').length + (c.className.includes("hover:") ? 1 : 0), avatarHidden: c.querySelector('[aria-hidden="true"]') ? true : false }; }) };
})()`;
const READ_TABLE = (tableLabel) => `(() => {
  const box = [...document.querySelectorAll('[data-slot="table-container"]')].find((b) => b.checkVisibility() && b.getAttribute("aria-label") === ${q(tableLabel)});
  if (!box) return null;
  return { headers: [...box.querySelectorAll("th")].map((th) => th.textContent.trim()), rows: [...box.querySelectorAll("tbody tr")].map((tr) => ({ id: tr.getAttribute("data-record-id"), cells: [...tr.querySelectorAll("td")].map((td) => td.textContent.replace(/\\s+/g, " ").trim()) })), scrollable: box.scrollWidth > box.clientWidth + 1 };
})()`;
const VISIBLE_HEADINGS = `[...document.querySelectorAll("main h1, main h2, main h3, main h4")].filter((h) => h.checkVisibility()).map((h) => Number(h.tagName[1]))`;
const HSCROLL_INSIDE_MAIN = `[...document.querySelectorAll("main *")].filter((e) => e.checkVisibility() && e.scrollWidth > e.clientWidth + 1 && ["auto", "scroll"].includes(getComputedStyle(e).overflowX)).map((e) => e.tagName + "." + (e.getAttribute("data-slot") || e.className).toString().slice(0, 40))`;
const headingsOk = (levels) => levels.length > 0 && levels[0] === 1 && levels.every((l, i) => i === 0 || l - levels[i - 1] <= 1);

async function checkListPage(page, vpName, vp, userId, shotName) {
  await setViewport(vp);
  await setSession(userId);
  await navigate(page.path);
  const got = await outcome();
  const tag = `${page.key} ${vpName} (${userId})`;
  rec(`${tag}: halaman terbuka (guard mengizinkan)`, got === "allowed", got);
  if (got !== "allowed") return;
  const h1 = await evaluate(`[...document.querySelectorAll("h1")].find((h) => h.checkVisibility())?.textContent.trim()`);
  rec(`${tag}: judul halaman ${page.h1}`, h1 === page.h1, h1);
  const levels = await evaluate(VISIBLE_HEADINGS);
  rec(`${tag}: hierarki heading berurutan`, headingsOk(levels), JSON.stringify(levels));
  rec(`${tag}: tidak ada wadah yang bisa digulir horizontal di dalam konten`, same(await evaluate(HSCROLL_INSIDE_MAIN), []), JSON.stringify(await evaluate(HSCROLL_INSIDE_MAIN)));
  await overflowOk(tag);

  if (vp.width < 1024) {
    // ---- kartu ----
    const data = await evaluate(READ_CARDS(page.listLabel));
    results.measurements[`kartu ${tag}`] = data;
    rec(`${tag}: daftar kartu terlihat sebagai ul[role=list] bernama "${page.listLabel}"`, !!data && data.role === "list", JSON.stringify(data && data.role));
    if (!data) return;
    rec(`${tag}: tabel tersembunyi`, (await evaluate(READ_TABLE(page.tableLabel))) === null);
    rec(`${tag}: jumlah kartu = jumlah baris sumber (${page.records.length}) dan satu li per kartu`, data.cards.length === page.records.length && data.liCount === page.records.length, `${data.cards.length}`);
    rec(`${tag}: urutan kartu sesuai data`, same(data.cards.map((c) => c.id), page.records.map((r) => r.id)), JSON.stringify(data.cards.map((c) => c.id)));
    const sectionOk = await evaluate(`(() => { const s = document.querySelector('[data-slot="records-mobile"]'); return !!s && s.checkVisibility() && s.querySelector("h2")?.textContent.trim() === ${q(page.section)} && s.textContent.includes(${q(page.count)}); })()`);
    rec(`${tag}: judul bagian "${page.section}" dan jumlah "${page.count}" tampil`, sectionOk);
    page.records.forEach((r, i) => {
      const c = data.cards[i];
      rec(`${tag}: kartu ${r.id} judul "${r.title}" (h3)`, c.title === r.title && c.titleTag === "H3", `${c.title} ${c.titleTag}`);
      rec(`${tag}: kartu ${r.id} memuat SELURUH field (${page.labels.join(", ")})`, same(c.labels, page.labels) && c.values.every((v, k) => matches(v, r.values[k])), JSON.stringify({ labels: c.labels, values: c.values }));
    });
    rec(`${tag}: kartu tidak interaktif (tanpa tautan/tombol/aksi) dan tanpa gaya hover`, data.cards.every((c) => c.interactive === 0 && c.hoverClass === 0), JSON.stringify(data.cards.map((c) => [c.interactive, c.hoverClass])));
    if (page.key === "anggota") rec(`${tag}: avatar inisial dekoratif (aria-hidden)`, data.cards.every((c) => c.avatarHidden));
    if (vp.width === 375) {
      const l0 = data.cards[0].left;
      const w0 = data.cards[0].width;
      rec(`${tag}: satu kolom (semua kartu selebar sama dan di dalam viewport)`, data.cards.every((c) => c.left === l0 && c.width === w0 && c.right <= 375), JSON.stringify(data.cards.map((c) => `${c.left}/${c.width}`)));
    } else {
      const lefts = [...new Set(data.cards.map((c) => c.left))];
      rec(`${tag}: dua kolom`, lefts.length === 2 && data.cards.every((c) => c.right <= 768), JSON.stringify(lefts));
    }
  } else {
    // ---- tabel ----
    const t = await evaluate(READ_TABLE(page.tableLabel));
    results.measurements[`tabel ${tag}`] = t;
    rec(`${tag}: tabel terlihat`, !!t);
    if (!t) return;
    rec(`${tag}: kartu tersembunyi`, (await evaluate(READ_CARDS(page.listLabel))) === null);
    rec(`${tag}: tabel memuat SEMUA kolom (${page.tableHeaders.join(", ")})`, same(t.headers, page.tableHeaders), JSON.stringify(t.headers));
    rec(`${tag}: tabel tanpa gulir horizontal (semua kolom terlihat)`, t.scrollable === false);
    rec(`${tag}: jumlah baris = ${page.records.length} dan urutan sesuai data`, same(t.rows.map((r) => r.id), page.records.map((r) => r.id)), JSON.stringify(t.rows.map((r) => r.id)));
    const cardTitle = await evaluate(`[...document.querySelectorAll('[data-slot="records-desktop"] h2')].find((h) => h.checkVisibility())?.textContent.trim()`);
    rec(`${tag}: header kartu tabel "${page.section}" tidak berubah`, cardTitle === page.section, cardTitle);
    page.records.forEach((r, i) => {
      const cells = t.rows[i].cells;
      const expected = [r.title, ...r.values];
      rec(`${tag}: baris ${r.id} memuat semua nilai`, expected.every((e) => cells.some((cell) => includesAny(cell, e))), JSON.stringify(cells));
    });
  }
  await checkAxe(tag);
  await shotFull(shotName ?? `${page.key}-${vpName}-${userId}`);
}

// ================= A. Owner (u-001): ketiga halaman di 375, 768, 1280 =================
for (const page of PAGES) for (const { n, v } of VPS) await checkListPage(page, n, v, "u-001");

// ================= B. Role relevan di 375 mobile + sentuhan =================
await checkListPage(LAPORAN, 375, VPS[0].v, "u-003"); // Mandor
await checkListPage(DOKUMEN, 375, VPS[0].v, "u-003");
await checkListPage(DOKUMEN, 375, VPS[0].v, "u-004"); // Anggota Tim
await checkListPage(ANGGOTA, 375, VPS[0].v, "u-002"); // Admin Kantor
await checkListPage(LAPORAN, 768, VPS[1].v, "u-002");

// ================= B2. Tugas (Langkah 3): TaskCard di bawah lg, tabel mulai lg =================
// Dataset dan daftar tetap SAMA untuk semua role pada tahap ini (6 tugas). Pembatasan lingkup per role dan tautan detail
// adalah pekerjaan U4-8; saat itu asersi "6 tugas untuk semua role" di bawah diganti dengan asersi lingkup per role.
const TUGAS = {
  key: "tugas",
  path: "/tugas",
  h1: "Tugas",
  section: "Semua Tugas",
  count: "6 tugas",
  listLabel: "Daftar tugas",
  tableLabel: "Daftar tugas",
  tableHeaders: ["Kode", "Judul", "Penanggung Jawab", "Prioritas", "Status", "Progres"],
  tasks: [
    { id: "t-001", code: "TSK-001", title: "Pembongkaran dinding partisi lantai 1", project: "PRJ-001 · Renovasi Gedung Kantor Batam", assignee: "Ahmad Rizal", priority: "Tinggi", status: "Selesai", progress: 100, deadline: null },
    { id: "t-002", code: "TSK-002", title: "Pengecekan sistem kelistrikan lama", project: "PRJ-001 · Renovasi Gedung Kantor Batam", assignee: "Dewi Lestari", priority: "Tinggi", status: "Dalam Progres", progress: 60, deadline: "Terlambat · 28 Feb 2026" },
    { id: "t-003", code: "TSK-003", title: "Pembersihan material sisa pembongkaran", project: "PRJ-001 · Renovasi Gedung Kantor Batam", assignee: "Eko Prasetyo", priority: "Sedang", status: "Belum Dimulai", progress: 0, deadline: "Terlambat · 5 Mar 2026" },
    { id: "t-004", code: "TSK-004", title: "Pembuatan pondasi footplate", project: "PRJ-002 · Pembangunan Gudang Logistik Tanjung Pinang", assignee: "Ahmad Rizal", priority: "Tinggi", status: "Dalam Progres", progress: 35, deadline: "Mendatang · 10 Apr 2026" },
    { id: "t-005", code: "TSK-005", title: "Pemesanan baja WF untuk struktur", project: "PRJ-002 · Pembangunan Gudang Logistik Tanjung Pinang", assignee: "Eko Prasetyo", priority: "Tinggi", status: "Belum Dimulai", progress: 0, deadline: "Mendatang · 25 Mar 2026" },
    { id: "t-006", code: "TSK-006", title: "Pemasangan keramik lobby", project: "PRJ-001 · Renovasi Gedung Kantor Batam", assignee: "Dewi Lestari", priority: "Sedang", status: "Belum Dimulai", progress: 0, deadline: "Mendatang · 1 Apr 2026" },
  ],
};
const READ_TASK_CARDS = `(() => {
  const list = [...document.querySelectorAll('ul[data-slot="record-card-list"]')].find((u) => u.checkVisibility() && u.getAttribute("aria-label") === ${q(TUGAS.listLabel)});
  if (!list) return null;
  const lis = [...list.children];
  return { role: list.getAttribute("role"), liCount: lis.length, cards: lis.map((li) => { const c = li.querySelector('[data-slot="task-card"]'); const r = li.getBoundingClientRect(); const d = c.querySelector('[data-slot="deadline-badge"]'); return { id: c.getAttribute("data-task-id"), code: c.querySelector("p")?.textContent.trim(), title: c.querySelector("h2,h3,h4")?.textContent.trim(), titleTag: c.querySelector("h2,h3,h4")?.tagName, text: c.textContent.replace(/\\s+/g, " ").trim(), badges: [...c.querySelectorAll('[data-slot="badge"]')].map((b) => b.textContent.replace(/\\s+/g, " ").trim()), progress: c.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow") ?? null, deadline: d ? d.textContent.replace(/\\s+/g, " ").trim() : null, left: Math.round(r.left), width: Math.round(r.width), right: Math.round(r.right), interactive: c.querySelectorAll("a, button, input, select, textarea, [tabindex]").length, hoverClass: c.querySelectorAll('[class*="hover:"]').length + (c.className.includes("hover:") ? 1 : 0) }; }) };
})()`;
const NOTICE_STATE = `(() => { const n = [...document.querySelectorAll('[data-slot="demo-data-notice"]')].find((e) => e.checkVisibility()); return n ? { visible: true, text: n.textContent.replace(/\\s+/g, " ").trim(), reference: !!n.querySelector('[data-slot="deadline-reference"]') } : { visible: false }; })()`;

async function checkTugasPage(vpName, vp, userId) {
  await setViewport(vp);
  await setSession(userId);
  await navigate(TUGAS.path);
  const got = await outcome();
  const tag = `tugas ${vpName} (${userId})`;
  rec(`${tag}: halaman terbuka (guard mengizinkan)`, got === "allowed", got);
  if (got !== "allowed") return;
  const h1 = await evaluate(`[...document.querySelectorAll("h1")].find((h) => h.checkVisibility())?.textContent.trim()`);
  rec(`${tag}: judul halaman ${TUGAS.h1}`, h1 === TUGAS.h1, h1);
  const levels = await evaluate(VISIBLE_HEADINGS);
  rec(`${tag}: hierarki heading berurutan`, headingsOk(levels), JSON.stringify(levels));
  rec(`${tag}: tidak ada wadah yang bisa digulir horizontal di dalam konten`, same(await evaluate(HSCROLL_INSIDE_MAIN), []), JSON.stringify(await evaluate(HSCROLL_INSIDE_MAIN)));
  await overflowOk(tag);
  const notice = await evaluate(NOTICE_STATE);

  if (vp.width < 1024) {
    const data = await evaluate(READ_TASK_CARDS);
    results.measurements[`kartu ${tag}`] = data;
    rec(`${tag}: daftar kartu tugas terlihat sebagai ul[role=list] bernama "${TUGAS.listLabel}"`, !!data && data.role === "list");
    if (!data) return;
    rec(`${tag}: tabel tersembunyi`, (await evaluate(READ_TABLE(TUGAS.tableLabel))) === null);
    rec(`${tag}: 6 kartu (dataset sama untuk semua role pada tahap ini) dan satu li per kartu`, data.cards.length === 6 && data.liCount === 6, `${data.cards.length}`);
    rec(`${tag}: urutan kartu sesuai data`, same(data.cards.map((c) => c.id), TUGAS.tasks.map((t) => t.id)), JSON.stringify(data.cards.map((c) => c.id)));
    const sectionOk = await evaluate(`(() => { const s = document.querySelector('[data-slot="records-mobile"]'); return !!s && s.checkVisibility() && s.querySelector("h2")?.textContent.trim() === ${q(TUGAS.section)} && s.textContent.includes(${q(TUGAS.count)}); })()`);
    rec(`${tag}: judul bagian "${TUGAS.section}" dan jumlah "${TUGAS.count}" tampil`, sectionOk);
    rec(`${tag}: DemoDataNotice dengan acuan tanggal demo (G10) tampil`, notice.visible && notice.reference && notice.text.includes("21 Maret 2026") && notice.text.includes("bukan tanggal hari ini") && notice.text.includes("memori tab ini"), JSON.stringify(notice).slice(0, 200));
    TUGAS.tasks.forEach((t, i) => {
      const c = data.cards[i];
      rec(`${tag}: kartu ${t.id} memuat kode, judul (h3), proyek, penanggung jawab, prioritas, status, progres`,
        c.code === t.code && c.title === t.title && c.titleTag === "H3" && c.text.includes(t.project) && c.text.includes(`Penanggung jawab: ${t.assignee}`) && c.badges.includes(`Prioritas ${t.priority}`) && c.badges.includes(t.status) && c.progress === String(t.progress),
        JSON.stringify({ code: c.code, title: c.title, badges: c.badges, progress: c.progress }));
      rec(`${tag}: kartu ${t.id} tenggat terhadap acuan demo ${t.deadline ?? "(tidak ditampilkan untuk tugas selesai)"}`, t.deadline === null ? c.deadline === null : c.deadline === t.deadline, String(c.deadline));
    });
    rec(`${tag}: kartu tidak interaktif (tanpa tautan/tombol/aksi) dan tanpa gaya hover (tautan detail = U4-8)`, data.cards.every((c) => c.interactive === 0 && c.hoverClass === 0), JSON.stringify(data.cards.map((c) => [c.interactive, c.hoverClass])));
    if (vp.width === 375) {
      const l0 = data.cards[0].left;
      const w0 = data.cards[0].width;
      rec(`${tag}: satu kolom (semua kartu selebar sama dan di dalam viewport)`, data.cards.every((c) => c.left === l0 && c.width === w0 && c.right <= 375), JSON.stringify(data.cards.map((c) => `${c.left}/${c.width}`)));
    } else {
      const lefts = [...new Set(data.cards.map((c) => c.left))];
      rec(`${tag}: dua kolom`, lefts.length === 2 && data.cards.every((c) => c.right <= 768), JSON.stringify(lefts));
    }
  } else {
    const t = await evaluate(READ_TABLE(TUGAS.tableLabel));
    results.measurements[`tabel ${tag}`] = t;
    rec(`${tag}: tabel terlihat`, !!t);
    if (!t) return;
    rec(`${tag}: kartu tersembunyi`, (await evaluate(READ_TASK_CARDS)) === null);
    rec(`${tag}: tabel tidak berubah: semua kolom (${TUGAS.tableHeaders.join(", ")})`, same(t.headers, TUGAS.tableHeaders), JSON.stringify(t.headers));
    rec(`${tag}: tabel tanpa gulir horizontal (semua kolom terlihat)`, t.scrollable === false);
    rec(`${tag}: 6 baris sesuai urutan data`, same(t.rows.map((r) => r.id), TUGAS.tasks.map((x) => x.id)), JSON.stringify(t.rows.map((r) => r.id)));
    rec(`${tag}: DemoDataNotice tidak tampil di desktop (tampilan tabel tidak berubah)`, notice.visible === false, JSON.stringify(notice));
    const cardTitle = await evaluate(`[...document.querySelectorAll('[data-slot="records-desktop"] h2')].find((h) => h.checkVisibility())?.textContent.trim()`);
    rec(`${tag}: header kartu tabel "${TUGAS.section}" tidak berubah`, cardTitle === TUGAS.section, cardTitle);
    TUGAS.tasks.forEach((task, i) => {
      const cells = t.rows[i].cells;
      const expected = [task.code, task.title, task.assignee, task.priority, task.status, `${task.progress}%`];
      rec(`${tag}: baris ${task.id} memuat semua nilai`, same(cells, expected), JSON.stringify(cells));
    });
  }
  await checkAxe(tag);
  await shotFull(`tugas-${vpName}-${userId}`);
}
for (const { n, v } of VPS) await checkTugasPage(n, v, "u-001");
await checkTugasPage(375, VPS[0].v, "u-003"); // Mandor: halaman awal setelah login
await checkTugasPage(375, VPS[0].v, "u-004"); // Anggota Tim: halaman awal setelah login
await checkTugasPage(768, VPS[1].v, "u-002"); // Admin Kantor

// ================= C. Akses menu dan guard tidak berubah =================
await setViewport(VPS[2].v);
for (const [userId, path, want] of [
  ["u-003", "/anggota", "denied"], // Mandor tidak melihat Anggota
  ["u-004", "/anggota", "denied"], // Anggota Tim tidak melihat Anggota
  ["u-004", "/laporan", "denied"], // Anggota Tim tidak melihat Laporan
  ["u-003", "/laporan", "allowed"],
  ["u-004", "/dokumen", "allowed"],
]) {
  await setSession(userId);
  await navigate(path);
  rec(`guard: ${userId} membuka ${path} → ${want} (tidak berubah)`, (await outcome()) === want);
}

// ================= D. Style guide: dokumentasi RecordCard =================
for (const { n, v } of [VPS[0], VPS[2]]) {
  await setViewport(v);
  await navigate("/style-guide");
  await sleep(500);
  const demo = await evaluate(`(() => { const s = document.querySelector("#kartu-data"); const cards = s ? [...s.querySelectorAll('[data-slot="record-card"]')].filter((c) => c.checkVisibility()) : []; return { cards: cards.length, titles: cards.map((c) => c.querySelector("h3")?.textContent.trim()), interactive: cards.reduce((a, c) => a + c.querySelectorAll("a, button, input, [tabindex]").length, 0) }; })()`);
  rec(`style-guide ${n}: #kartu-data menampilkan 3 contoh RecordCard tanpa elemen interaktif`, demo.cards === 3 && demo.interactive === 0, JSON.stringify(demo));
  await overflowOk(`style-guide ${n}`);
  await checkAxe(`style-guide ${n}`);
  await evaluate(`document.querySelector("#kartu-data").scrollIntoView()`);
  await sleep(200);
  await shotFull(`style-guide-${n}`);
}

await evaluate(`sessionStorage.clear()`);
writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
const total = results.checks.length;
console.log(results.failures.length ? `\n${results.failures.length} masalah dari ${total} pemeriksaan.` : `\nSemua ${total} pemeriksaan lolos.`);
cleanup();
process.exit(results.failures.length ? 1 : 0);
