// Pemeriksaan U4-7 di browser (Chrome via CDP): kelola anggota proyek dan Admin penanggung jawab di tab Tim /proyek/[projectId].
// Persona: Budi (Owner), Siti (Admin Kantor, Admin principal p-001/p-002), Rina (Admin Kantor kedua, tanpa proyek), Ahmad dan Eko
// (Mandor), Dewi (Anggota Tim). Semua harapan ditulis sebagai literal (sengaja bukan dihitung dari access.ts).
// Store mock ada di memori tab: muat ulang dokumen (navigate) mengembalikan seed; navigasi klien mempertahankan perubahan.
// Cakupan:
//   A. hak per role (tombol yang tampil, kolom Aksi, email, tab Tim), Arsip, proyek Selesai, akses Rina
//   B. TAMBAH: dialog, kandidat (Mandor/Anggota Tim, dikelompokkan, tanpa email), validasi, kirim ganda, sukses, fokus, kandidat habis
//   C. KELUARKAN: blokir tugas (jumlah aktual, termasuk Selesai), konfirmasi, Batal/Esc, sukses, fokus
//   D. ADMIN: tetapkan, ganti (Admin aktif bukan kandidat), cabut; Ringkasan ikut berubah; akses Admin lama/baru (ganti persona
//      lewat UI tanpa muat ulang)
//   E. STALE (hook development `window.__PROYEKIN_TEST__`): kandidat sudah ditambahkan, anggota kini memegang tugas, anggota sudah
//      keluar, Admin berubah/dicabut, proyek menjadi Arsip, Admin principal kehilangan hak saat dialog terbuka
//   F. responsif 375 (mobile + sentuh) / 768 / 1280: overflow, axe 0 (juga dengan dialog terbuka), target sentuh >= 44px
//   G. PRODUCTION: hook tidak ada di keluaran build dan tidak tersedia di `next start` (lewati dengan --no-prod)
// Representasi UI mock, BUKAN otorisasi. Jalankan: npm run check:u4-project-members [-- <folder-bukti>] [--no-prod]
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { createBrowser, sleep, waitFor } from "./lib/cdp.mjs";
import { findForbidden, UI_FORBIDDEN } from "./lib/no-budget.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const OUT = resolve(args.find((a) => !a.startsWith("--")) ?? join(ROOT, ".u4-project-members-check"));
const RUN_PROD = !args.includes("--no-prod");
const APP_PORT = 3540;
const PROD_PORT = 3541;
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

const ID = { budi: "u-001", siti: "u-002", ahmad: "u-003", dewi: "u-004", eko: "u-005", rina: "u-006" };
const EMAIL = { budi: "budi@proyekin.id", siti: "siti@proyekin.id", rina: "rina@proyekin.id" };
const ALL_EMAILS = ["budi@proyekin.id", "siti@proyekin.id", "ahmad@proyekin.id", "dewi@proyekin.id", "eko@proyekin.id", "rina@proyekin.id"];
const P1_TEAM = ["u-002", "u-003", "u-004", "u-005"];
const ACCENT_RGB = "rgb(255, 243, 226)"; // token --color-highlight (#FFF3E2), dipakai lewat bg-accent

// ---------------- server, browser, utilitas ----------------
let dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(APP_PORT)], { cwd: ROOT, stdio: "ignore" });
let prod = null;
const browser = await createBrowser({ cdpPort: 9722 });
const { send, evaluate, setViewport, tap, pressKey } = browser;
const cleanup = () => {
  for (const p of [dev, prod]) {
    try {
      p?.kill();
    } catch {
      /* sudah berhenti */
    }
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

// Next.js 16 menyimpan halaman sebelumnya tersembunyi di DOM: selalu pilih elemen yang TERLIHAT.
await send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__pick = (s) => [...document.querySelectorAll(s)].find((e) => e.checkVisibility()) ?? null;` });

let base = BASE;
async function navigate(path) {
  await send("Page.navigate", { url: `${base}${path}` });
  await waitFor(() => evaluate(`document.readyState === "complete"`), 90000, `muat ${path}`);
  await evaluate(`document.fonts.ready.then(() => true)`);
}
async function setSession(userId) {
  await navigate("/masuk");
  await evaluate(`sessionStorage.clear(); ${userId ? `sessionStorage.setItem(${q(SESSION_KEY)}, JSON.stringify({ userId: ${q(userId)}, loginAt: new Date().toISOString() }))` : ""}`);
}
const vis = (sel) => evaluate(`[...document.querySelectorAll(${q(sel)})].some((e) => e.checkVisibility())`);
const waitVis = (sel, label, ms = 25000) => waitFor(() => vis(sel), ms, label);
const waitGone = (sel, label, ms = 15000) => waitFor(async () => !(await vis(sel)), ms, label);
const textOf = (sel) => evaluate(`(() => { const e = [...document.querySelectorAll(${q(sel)})].find((x) => x.checkVisibility()); return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; })()`);
const clickEl = (sel) => evaluate(`(() => { const el = __pick(${q(sel)}); if (!el) throw new Error("tidak ada: " + ${q(sel)}); el.click(); return true; })()`);
const setVal = (sel, value) =>
  evaluate(`(() => {
    const el = __pick(${q(sel)});
    if (!el) throw new Error("tidak ada: " + ${q(sel)});
    const proto = el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${q(value)});
    el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
    return el.value;
  })()`);
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
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
}
async function shotFull(name) {
  const m = await send("Page.getLayoutMetrics");
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: m.cssContentSize.width, height: Math.min(m.cssContentSize.height, 4000), scale: 1 } });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
}
const activeInfo = () => evaluate(`(() => { const a = document.activeElement; return { tag: a?.tagName, id: a?.id ?? "", action: a?.getAttribute?.("data-action") ?? "", user: a?.getAttribute?.("data-user-id") ?? "", text: (a?.textContent ?? "").trim().slice(0, 60), inDialog: !!a?.closest?.('[role="dialog"]') }; })()`);

// ---- detail proyek dan tab Tim ----
const detailReady = () => waitVis('[data-detail="found"][data-state="ready"]', "detail siap");
const openDetail = async (userId, id) => {
  await setSession(userId);
  await navigate(`/proyek/${id}`);
};
async function selectTab(name, touch = false) {
  const sel = `[data-slot="tabs-tab"][data-tab="${name}"]`;
  if (touch) await tap(sel);
  else await clickEl(sel);
  await waitFor(() => evaluate(`__pick(${q(sel)})?.getAttribute("aria-selected") === "true"`), 8000, `tab ${name}`);
  await sleep(150);
}
async function openTeam(userId, id) {
  await openDetail(userId, id);
  await detailReady();
  await selectTab("tim");
  await waitVis('[data-slot="project-team"]', "panel tim");
}
const teamIds = () => evaluate(`[...document.querySelectorAll('[data-slot="project-team-row"], [data-slot="record-card"][data-user-id]')].filter((e) => e.checkVisibility()).map((e) => e.getAttribute("data-user-id"))`);
const panelButtons = () => evaluate(`(() => { const p = __pick('[data-slot="project-team"]'); return p ? [...p.querySelectorAll("button")].filter((b) => b.checkVisibility() && b.getAttribute("aria-label") !== "Tutup pesan").map((b) => b.textContent.replace(/\\s+/g, " ").trim()) : null; })()`);
const panelText = () => textOf('[data-slot="project-team"]');
const waitAnnounced = (text) => waitFor(async () => ((await evaluate(`document.querySelector('[data-slot="team-notice-region"]')?.textContent ?? ""`)) === text ? true : null), 8000, `pengumuman: ${text}`).then(() => true).catch(() => false);
const DIALOG = '[role="dialog"]';
const dialogInfo = () =>
  evaluate(`(() => {
    const d = __pick(${q(DIALOG)});
    if (!d) return null;
    const sel = d.querySelector("select");
    return {
      slot: d.getAttribute("data-dialog"),
      title: d.querySelector('[data-slot="dialog-title"]')?.textContent.trim(),
      description: d.querySelector('[data-slot="dialog-description"]')?.textContent.replace(/\\s+/g, " ").trim(),
      buttons: [...d.querySelectorAll("button")].filter((b) => b.checkVisibility() && b.getAttribute("aria-label") !== "Tutup").map((b) => b.textContent.trim()),
      alerts: [...d.querySelectorAll('[role="alert"]')].map((a) => a.textContent.replace(/\\s+/g, " ").trim()),
      fieldErrors: [...d.querySelectorAll('[data-slot="field-error"]:not([role="alert"])')].map((a) => a.textContent.trim()),
      groups: sel ? [...sel.querySelectorAll("optgroup")].map((g) => [g.label, [...g.querySelectorAll("option")].map((o) => o.textContent.trim())]) : null,
      options: sel ? [...sel.querySelectorAll("option")].map((o) => o.textContent.trim()) : null,
      value: sel ? sel.value : null,
      invalid: sel ? sel.getAttribute("aria-invalid") : null,
      text: d.textContent.replace(/\\s+/g, " ").trim(),
    };
  })()`);
async function openAction(sel, touch = false) {
  if (touch) await tap(sel);
  else await clickEl(sel);
  await waitVis(DIALOG, `dialog dari ${sel}`);
  await sleep(300);
}
const dialogButton = (text) =>
  evaluate(`(() => { const d = __pick(${q(DIALOG)}); const b = [...d.querySelectorAll("button")].find((x) => x.checkVisibility() && x.textContent.trim() === ${q(text)}); if (!b) throw new Error("tidak ada tombol dialog: " + ${q(text)}); b.click(); return true; })()`);
const submitDialog = () => evaluate(`(() => { const d = __pick(${q(DIALOG)}); const b = d.querySelector('button[type="submit"]'); b.click(); return true; })()`);
const waitDialogGone = (label) => waitGone(DIALOG, label, 10000);
const hook = (expr) => evaluate(`(() => { const h = window.__PROYEKIN_TEST__; if (!h) throw new Error("hook uji tidak tersedia"); return JSON.parse(JSON.stringify(${expr} ?? null)); })()`);
const waitHook = () => waitFor(() => evaluate(`!!window.__PROYEKIN_TEST__`), 15000, "hook uji development");
const summaryAdmin = async () => {
  await selectTab("ringkasan");
  const t = await textOf('[data-slot="project-info"]');
  await selectTab("tim");
  return t;
};
const tasksTab = () => textOf('[data-tab="tugas"]');

// =====================================================================================
// A. Hak per role (1280)
// =====================================================================================
await setViewport({ width: 1280, height: 900 });
{
  await openTeam(ID.budi, "p-001");
  rec("A budi p-001: tim Admin lalu anggota (urutan tetap)", same(await teamIds(), P1_TEAM), JSON.stringify(await teamIds()));
  rec("A budi p-001: tombol tim — Tambah anggota, Ganti/Cabut Admin Siti, Keluarkan dari proyek untuk tiap anggota",
    same(await panelButtons(), ["Tambah anggota", "Ganti Admin Siti Aminah", "Cabut Admin Siti Aminah", "Keluarkan dari proyek Ahmad Rizal", "Keluarkan dari proyek Dewi Lestari", "Keluarkan dari proyek Eko Prasetyo"]), JSON.stringify(await panelButtons()));
  const head = await evaluate(`[...__pick('[data-slot="project-team-table"]').querySelectorAll("th")].map((th) => th.textContent.trim())`);
  rec("A budi p-001: kolom tabel Nama, Peran, Email, Aksi", same(head, ["Nama", "Peran", "Email", "Aksi"]), JSON.stringify(head));
  const row = await evaluate(`(() => { const r = __pick('[data-slot="project-team-row"][data-user-id="u-002"]'); return { principal: r.getAttribute("data-admin-principal"), bg: getComputedStyle(r).backgroundColor, text: r.textContent }; })()`);
  rec("A budi p-001: baris Admin berlatar Warm Highlight dan berteks 'Penanggung jawab' (tidak hanya warna)", row.principal === "true" && row.bg === ACCENT_RGB && row.text.includes("Penanggung jawab"), JSON.stringify({ principal: row.principal, bg: row.bg }));
  const tw = await evaluate(`(() => { const c = __pick('[data-slot="project-team-table"] [data-slot="table-container"]'); return { scroll: c.scrollWidth, client: c.clientWidth }; })()`);
  rec("A budi p-001: tabel tim (4 kolom) muat tanpa gulir horizontal di 1280", tw.scroll <= tw.client + 1, JSON.stringify(tw));
  await checkAxe("budi p-001 tim 1280");
  await checkOverflow("budi p-001 tim 1280");
  await shot("tim-owner-p001-1280");

  await openTeam(ID.siti, "p-001");
  rec("A siti (Admin principal) p-001: hanya Tambah anggota; tanpa Ganti/Cabut/Keluarkan", same(await panelButtons(), ["Tambah anggota"]), JSON.stringify(await panelButtons()));
  const sHead = await evaluate(`[...__pick('[data-slot="project-team-table"]').querySelectorAll("th")].map((th) => th.textContent.trim())`);
  rec("A siti p-001: tanpa kolom Aksi (tabel sama seperti U4-5)", same(sHead, ["Nama", "Peran", "Email"]), JSON.stringify(sHead));
  await shot("tim-siti-p001-1280");
  await openTeam(ID.siti, "p-002");
  rec("A siti p-002: hanya Tambah anggota", same(await panelButtons(), ["Tambah anggota"]), JSON.stringify(await panelButtons()));

  for (const [key, id] of [["ahmad", "p-001"], ["eko", "p-002"]]) {
    await openTeam(ID[key], id);
    const t = await panelText();
    rec(`A ${key} (Mandor) ${id}: tab Tim tanpa tombol, tanpa kolom Aksi, tanpa email`, same(await panelButtons(), []) && !t.includes("Aksi") && !t.includes("@") && !ALL_EMAILS.some((e) => t.includes(e)), JSON.stringify(await panelButtons()));
  }
  await openDetail(ID.dewi, "p-001");
  await detailReady();
  rec("A dewi (Anggota Tim) p-001: tanpa tab Tim dan tanpa panel tim", !(await vis('[data-tab="tim"]')) && !(await vis('[data-slot="project-team"]')));

  await openDetail(ID.rina, "p-001");
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/akses-ditolak" ? true : null), 20000, "rina ditolak");
  rec("A rina (Admin Kantor tanpa proyek): /proyek/p-001 → /akses-ditolak", (await evaluate(`location.pathname`)) === "/akses-ditolak");
  await setSession(ID.rina);
  await navigate("/proyek");
  await waitVis('[data-slot="project-list"][data-state="ready"]', "daftar rina");
  rec("A rina: daftar proyek kosong (tidak ada proyek yang ditanganinya)", (await evaluate(`[...document.querySelectorAll('[data-slot="project-row"], [data-slot="project-card"]')].filter((e) => e.checkVisibility()).length`)) === 0);

  await openTeam(ID.budi, "p-005");
  const arch = await panelText();
  rec("A budi p-005 (Arsip): tanpa tombol apa pun di tab Tim, tanpa slot Tetapkan Admin", same(await panelButtons(), []) && !(await vis('[data-slot="admin-vacant"]')), JSON.stringify(await panelButtons()));
  rec("A budi p-005 (Arsip): state kosong lama dan catatan Arsip tampil", arch.includes("Belum ada tim di proyek ini") && arch.includes("Belum ada Admin Kantor penanggung jawab atau anggota yang terdaftar di proyek ini.") && (await vis('[data-slot="archived-note"]')));
  await shot("tim-owner-p005-arsip-1280");

  await openTeam(ID.budi, "p-003");
  rec("A budi p-003 (tanpa Admin, tanpa anggota): Tambah anggota + slot kosong dengan Tetapkan Admin", same(await panelButtons(), ["Tambah anggota", "Tetapkan Admin"]) && /^Admin Kantor penanggung jawab belum ditetapkan.s?Tetapkan Admin$/.test(await textOf('[data-slot="admin-vacant"]')), JSON.stringify(await panelButtons()));
  const vacantBorder = await evaluate(`getComputedStyle(__pick('[data-slot="admin-vacant"]')).borderTopStyle`);
  rec("A budi p-003: slot Admin kosong bergaris putus-putus", vacantBorder === "dashed", vacantBorder);
  rec("A budi p-003: state kosong mengarahkan ke tombol yang tersedia", (await panelText()).includes("Tetapkan Admin penanggung jawab dan tambahkan Mandor atau Anggota Tim dengan tombol di atas."));
  await checkAxe("budi p-003 tim kosong 1280");
  await shot("tim-owner-p003-kosong-1280");

  await openTeam(ID.budi, "p-004");
  rec("A budi p-004 (Selesai): aksi tetap tersedia (tidak dikunci)", same(await panelButtons(), ["Tambah anggota", "Tetapkan Admin"]), JSON.stringify(await panelButtons()));
}

// =====================================================================================
// B. Tambah anggota (Owner p-003; Admin principal p-001/p-002)
// =====================================================================================
{
  await openTeam(ID.budi, "p-003");
  await openAction('[data-action="add-member"]');
  let d = await dialogInfo();
  rec("B tambah: dialog berjudul 'Tambah anggota proyek' dengan konteks proyek", d.slot === "member-add" && d.title === "Tambah anggota proyek" && d.description === "Pilih Mandor atau Anggota Tim untuk proyek PRJ-003 Pengerjaan Jalan Akses Pelabuhan.", JSON.stringify(d));
  rec("B tambah: kandidat dikelompokkan Mandor / Anggota Tim, hanya nama (tanpa email, tanpa Admin/Owner)", same(d.groups, [["Mandor", ["Ahmad Rizal", "Eko Prasetyo"]], ["Anggota Tim", ["Dewi Lestari"]]]) && !d.text.includes("@") && !/Siti|Rina|Budi/.test(d.options.join(" ")), JSON.stringify(d.groups));
  rec("B tambah: tombol Batal dan 'Tambahkan ke proyek'; catatan data demo tampil", same(d.buttons, ["Batal", "Tambahkan ke proyek"]) && d.text.includes("Data demo"), JSON.stringify(d.buttons));
  await checkAxe("dialog tambah anggota 1280");
  await shot("dialog-tambah-anggota-1280");
  await submitDialog();
  await sleep(200);
  d = await dialogInfo();
  const act = await activeInfo();
  rec("B tambah: tanpa pilihan → galat 'Pilih satu Mandor atau Anggota Tim.', aria-invalid, fokus ke pilihan", same(d.fieldErrors, ["Pilih satu Mandor atau Anggota Tim."]) && d.invalid === "true" && act.tag === "SELECT", JSON.stringify({ e: d.fieldErrors, inv: d.invalid, act }));
  await shot("dialog-tambah-validasi-1280");
  await setVal(`${DIALOG} select`, ID.ahmad);
  // kirim ganda: dua klik dalam satu tick
  await evaluate(`(() => { const b = __pick('${DIALOG} button[type="submit"]'); b.click(); b.click(); return true; })()`);
  await sleep(120);
  const busy = await evaluate(`(() => { const b = __pick('${DIALOG} button[type="submit"]'); return b ? { busy: b.getAttribute("aria-busy"), selectDisabled: __pick('${DIALOG} select')?.disabled, cancelDisabled: [...__pick(${q(DIALOG)}).querySelectorAll("button")].find((x) => x.textContent.trim() === "Batal")?.disabled } : null; })()`);
  rec("B tambah: saat menyimpan tombol memuat (aria-busy), pilihan dan Batal nonaktif", !!busy && busy.busy === "true" && busy.selectDisabled && busy.cancelDisabled, JSON.stringify(busy));
  await waitDialogGone("dialog tambah tertutup");
  rec("B tambah: sukses diumumkan '(simulasi)'", await waitAnnounced("Ahmad Rizal ditambahkan ke tim proyek (simulasi)."));
  rec("B tambah: kirim ganda tidak menggandakan keanggotaan (Ahmad satu kali)", same(await teamIds(), ["u-003"]), JSON.stringify(await teamIds()));
  await sleep(400);
  rec("B tambah: fokus kembali ke 'Tambah anggota'", (await activeInfo()).action === "add-member", JSON.stringify(await activeInfo()));
  rec("B tambah: slot Admin kosong tetap; teks tim tanpa Admin", await vis('[data-slot="admin-vacant"]'));
  await shot("tim-tambah-sukses-1280");
  rec("B tambah: data tugas tidak berubah (Tugas (0))", (await tasksTab()) === "Tugas (0)", await tasksTab());

  for (const id of [ID.eko, ID.dewi]) {
    await openAction('[data-action="add-member"]');
    await setVal(`${DIALOG} select`, id);
    await submitDialog();
    await waitDialogGone("dialog tambah tertutup");
  }
  rec("B tambah: ketiga kandidat ditambahkan berurutan", same(await teamIds(), ["u-003", "u-005", "u-004"]), JSON.stringify(await teamIds()));
  await openAction('[data-action="add-member"]');
  d = await dialogInfo();
  rec("B tambah: kandidat habis → penjelasan tanpa form, hanya tombol Tutup", d.text.includes("Semua Mandor dan Anggota Tim sudah terdaftar di proyek ini.") && d.options === null && same(d.buttons, ["Tutup"]), JSON.stringify(d));
  await shot("dialog-tambah-kosong-1280");
  await dialogButton("Tutup");
  await waitDialogGone("dialog kosong tertutup");

  await openTeam(ID.siti, "p-001");
  await openAction('[data-action="add-member"]');
  d = await dialogInfo();
  rec("B siti p-001: semua kandidat sudah anggota → keadaan kosong", d.text.includes("Semua Mandor dan Anggota Tim sudah terdaftar di proyek ini."), d.text);
  await pressKey("Escape");
  await waitDialogGone("dialog tertutup Esc");
  await openTeam(ID.siti, "p-002");
  await openAction('[data-action="add-member"]');
  d = await dialogInfo();
  rec("B siti p-002: kandidat hanya Dewi Lestari (Anggota Tim)", same(d.groups, [["Anggota Tim", ["Dewi Lestari"]]]), JSON.stringify(d.groups));
  await setVal(`${DIALOG} select`, ID.dewi);
  await submitDialog();
  await waitDialogGone("dialog tambah siti");
  rec("B siti p-002: Admin principal berhasil menambah Dewi", same(await teamIds(), ["u-002", "u-003", "u-005", "u-004"]) && (await waitAnnounced("Dewi Lestari ditambahkan ke tim proyek (simulasi).")), JSON.stringify(await teamIds()));
  rec("B siti p-002: Admin principal tetap tanpa tombol Keluarkan untuk anggota baru", same(await panelButtons(), ["Tambah anggota"]), JSON.stringify(await panelButtons()));
}

// =====================================================================================
// C. Keluarkan anggota (Owner)
// =====================================================================================
{
  await openTeam(ID.budi, "p-001");
  await openAction(`[data-action="remove-member"][data-user-id="${ID.dewi}"]`);
  let d = await dialogInfo();
  rec("C blokir: Dewi (2 tugas) — dialog tanpa tombol konfirmasi, menyebut jumlah dan bahwa tidak ada data yang diubah",
    d.slot === "member-remove-blocked" && d.title === "Dewi Lestari belum dapat dikeluarkan" && d.description === "Dewi Lestari tidak dapat dikeluarkan karena masih tercatat sebagai penanggung jawab 2 tugas di proyek ini. Tidak ada data yang diubah." && same(d.buttons, ["Mengerti"]), JSON.stringify(d));
  rec("C blokir: tidak menawarkan penugasan ulang (fitur U4-9)", !/tugaskan ulang|alihkan/i.test(d.text), d.text);
  await checkAxe("dialog blokir keluarkan 1280");
  await shot("dialog-keluarkan-blokir-1280");
  await dialogButton("Mengerti");
  await waitDialogGone("dialog blokir tertutup");
  await sleep(400);
  rec("C blokir: fokus kembali ke tombol Keluarkan milik Dewi; tim tidak berubah", (await activeInfo()).user === ID.dewi && same(await teamIds(), P1_TEAM), JSON.stringify(await activeInfo()));
  await openAction(`[data-action="remove-member"][data-user-id="${ID.ahmad}"]`);
  d = await dialogInfo();
  rec("C blokir: Ahmad (1 tugas Selesai) tetap diblokir dan disebut sudah selesai", d.description === "Ahmad Rizal tidak dapat dikeluarkan karena masih tercatat sebagai penanggung jawab 1 tugas di proyek ini (tugas tersebut sudah selesai). Tidak ada data yang diubah.", d.description);
  await pressKey("Escape");
  await waitDialogGone("dialog blokir Esc");

  // konfirmasi pada anggota tanpa tugas (navigasi klien mempertahankan store: tambahkan dulu di p-003)
  await openTeam(ID.budi, "p-003");
  await openAction('[data-action="add-member"]');
  await setVal(`${DIALOG} select`, ID.ahmad);
  await submitDialog();
  await waitDialogGone("tambah Ahmad");
  await openAction(`[data-action="remove-member"][data-user-id="${ID.ahmad}"]`);
  d = await dialogInfo();
  const first = await activeInfo();
  rec("C konfirmasi: judul, akibat (akses hilang, akun/tugas/data tetap, simulasi), tombol Batal dan 'Keluarkan dari proyek'",
    d.title === "Keluarkan Ahmad Rizal dari proyek?" && d.description === "Ahmad Rizal tidak lagi dapat membuka proyek PRJ-003 dan namanya hilang dari tim. Akun dan perannya tidak berubah, dan tidak ada tugas atau data lain yang dihapus. Perubahan ini hanya simulasi dan hilang saat halaman dimuat ulang." && same(d.buttons, ["Batal", "Keluarkan dari proyek"]), JSON.stringify(d));
  rec("C konfirmasi: fokus awal di Batal (aksi destruktif)", first.inDialog && first.text === "Batal", JSON.stringify(first));
  await checkAxe("dialog konfirmasi keluarkan 1280");
  await shot("dialog-keluarkan-konfirmasi-1280");
  await dialogButton("Batal");
  await waitDialogGone("batal keluarkan");
  rec("C batal: tidak ada perubahan", same(await teamIds(), ["u-003"]));
  await openAction(`[data-action="remove-member"][data-user-id="${ID.ahmad}"]`);
  await dialogButton("Keluarkan dari proyek");
  await sleep(120);
  const busy = await evaluate(`(() => { const b = [...__pick(${q(DIALOG)}).querySelectorAll("button")].find((x) => x.textContent.includes("Keluarkan dari proyek")); return b?.getAttribute("aria-busy"); })()`);
  rec("C keluarkan: tombol konfirmasi memuat saat memproses", busy === "true", String(busy));
  await waitDialogGone("keluarkan selesai");
  rec("C keluarkan: sukses diumumkan '(simulasi)'", await waitAnnounced("Ahmad Rizal dikeluarkan dari tim proyek (simulasi)."));
  await sleep(450);
  rec("C keluarkan: anggota hilang dari tim; fokus ke judul 'Tim proyek'", same(await teamIds(), []) && (await activeInfo()).id === "tim-proyek", JSON.stringify(await activeInfo()));
  rec("C keluarkan: tanpa kaskade (Tugas (0) tetap; akun Ahmad tetap ada sebagai kandidat)", (await tasksTab()) === "Tugas (0)");
  await openAction('[data-action="add-member"]');
  rec("C keluarkan: Ahmad kembali menjadi kandidat (akun global tidak dihapus)", (await dialogInfo()).options.includes("Ahmad Rizal"));
  await pressKey("Escape");
  await waitDialogGone("tutup");
}

// =====================================================================================
// D. Admin penanggung jawab: tetapkan, ganti, cabut; akses Admin lama/baru
// =====================================================================================
{
  await openTeam(ID.budi, "p-003");
  await openAction('[data-action="assign-admin"]');
  let d = await dialogInfo();
  rec("D tetapkan: dialog, kandidat hanya Admin Kantor (Siti, Rina), tombol 'Tetapkan Admin'", d.slot === "admin-assign" && d.title === "Tetapkan Admin penanggung jawab" && same(d.options, ["Pilih Admin Kantor", "Siti Aminah", "Rina Wulandari"]) && same(d.buttons, ["Batal", "Tetapkan Admin"]), JSON.stringify(d));
  await submitDialog();
  await sleep(200);
  rec("D tetapkan: tanpa pilihan → 'Pilih satu Admin Kantor.'", same((await dialogInfo()).fieldErrors, ["Pilih satu Admin Kantor."]));
  await setVal(`${DIALOG} select`, ID.rina);
  rec("D tetapkan: akibat disebut sesuai pilihan", (await textOf('[data-slot="admin-consequence"]')) === "Rina Wulandari akan dapat membuka dan mengubah data proyek ini serta menambah anggota.", await textOf('[data-slot="admin-consequence"]'));
  await checkAxe("dialog tetapkan Admin 1280");
  await shot("dialog-tetapkan-admin-1280");
  await submitDialog();
  await waitDialogGone("tetapkan selesai");
  rec("D tetapkan: sukses diumumkan", await waitAnnounced("Rina Wulandari ditetapkan sebagai Admin penanggung jawab (simulasi)."));
  await sleep(450);
  rec("D tetapkan: Rina menjadi baris pertama dengan Penanggung jawab; slot kosong hilang; fokus ke 'Ganti Admin'",
    same(await teamIds(), ["u-006"]) && !(await vis('[data-slot="admin-vacant"]')) && (await activeInfo()).action === "replace-admin", JSON.stringify({ ids: await teamIds(), act: await activeInfo() }));
  rec("D tetapkan: tim berisi Admin tanpa anggota menampilkan keterangan", (await textOf('[data-slot="team-no-members"]')) === "Belum ada Mandor atau Anggota Tim di proyek ini.");
  rec("D tetapkan: Ringkasan menampilkan Admin baru", (await summaryAdmin()).includes("Rina Wulandari"));
  await shot("tim-tetapkan-sukses-1280");

  await openTeam(ID.budi, "p-001");
  await openAction('[data-action="replace-admin"]');
  d = await dialogInfo();
  rec("D ganti: 'Admin saat ini: Siti Aminah.'; kandidat tanpa Admin aktif (hanya Rina)", d.slot === "admin-replace" && d.description === "Admin saat ini: Siti Aminah." && same(d.options, ["Pilih Admin Kantor", "Rina Wulandari"]) && same(d.buttons, ["Batal", "Ganti Admin"]), JSON.stringify(d));
  await setVal(`${DIALOG} select`, ID.rina);
  rec("D ganti: akibat menyebut Admin lama kehilangan akses dan role tidak berubah", (await textOf('[data-slot="admin-consequence"]')) === "Setelah diganti, Siti Aminah tidak lagi dapat membuka proyek ini. Rina Wulandari menjadi penanggung jawab dan dapat membuka serta mengubah data proyek ini. Akun dan peran keduanya tidak berubah.");
  await shot("dialog-ganti-admin-1280");
  await submitDialog();
  await waitDialogGone("ganti selesai");
  rec("D ganti: sukses diumumkan", await waitAnnounced("Admin penanggung jawab diganti dari Siti Aminah ke Rina Wulandari (simulasi)."));
  rec("D ganti: satu Admin (Rina) di baris pertama; anggota tetap; tugas tetap", same(await teamIds(), ["u-006", "u-003", "u-004", "u-005"]) && (await tasksTab()) === "Tugas (4)", JSON.stringify(await teamIds()));
  rec("D ganti: Ringkasan menampilkan Rina Wulandari", (await summaryAdmin()).includes("Rina Wulandari"));

  // Akses setelah perubahan Admin: berganti persona lewat UI (navigasi klien; store memori tetap).
  // TEMUAN TERPISAH (bukan U4-7, dilaporkan ke Owner): di `next dev`, login KEDUA lewat UI tanpa muat ulang tertahan di /masuk
  // (router.push ke /dashboard tidak selesai) — terbukti juga untuk Budi tanpa membuka tab Tim. Karena itu setiap skenario di
  // bawah memakai SATU login UI setelah muat ulang dokumen.
  async function uiLogin(email, landing) {
    await evaluate(`(() => { const b = [...document.querySelectorAll('[data-slot="sidebar-desktop"] button')].find((x) => x.checkVisibility() && x.textContent.trim() === "Keluar"); if (!b) throw new Error("tidak ada tombol Keluar"); b.click(); return true; })()`);
    await waitFor(async () => ((await evaluate(`location.pathname`)) === "/masuk" ? true : null), 15000, "keluar");
    await waitFor(() => evaluate(`(() => { const el = document.querySelector("#email"); return !!el && el.checkVisibility() && Object.keys(el).some((k) => k.startsWith("__react")); })()`), 30000, "form login terhidrasi");
    // Form login dapat dipasang ulang (remount) sesaat setelah navigasi (Suspense useSearchParams), sehingga isian bisa hilang.
    // Isi, verifikasi, kirim, dan ulangi bila masih di /masuk (maksimal 4 kali); kegagalan tetap dilaporkan lewat timeout.
    let landed = false;
    for (let i = 0; i < 4 && !landed; i++) {
      await setVal("#email", email);
      await setVal("#password", "kata-sandi-demo-1");
      await sleep(300);
      if ((await evaluate(`__pick("#email").value`)) !== email) continue;
      await clickEl('form button[type="submit"]');
      landed = await waitFor(async () => ((await evaluate(`location.pathname`)) === landing ? true : null), 8000, `login ${email}`).then(() => true).catch(() => false);
    }
    results.measurements[`login ${email}`] = landed;
    if (!landed) {
      await shot(`login-gagal-${email.split("@")[0]}`);
      results.measurements[`login ${email} diagnosis`] = await evaluate(`({ path: location.pathname, email: __pick("#email")?.value, text: document.querySelector("main")?.textContent.replace(/\s+/g, " ").slice(0, 600) })`);
      console.log("DIAGNOSIS", JSON.stringify(results.measurements[`login ${email} diagnosis`]));
      throw new Error(`Timeout: login ${email}`);
    }
  }
  const clientList = async () => {
    await clickEl('[data-slot="sidebar-desktop"] a[href="/proyek"]');
    await waitVis('[data-slot="project-list"][data-state="ready"]', "daftar proyek");
    return evaluate(`[...document.querySelectorAll('[data-slot="project-row"]')].filter((e) => e.checkVisibility()).map((e) => e.getAttribute("data-project-id"))`);
  };
  const logoutText = await evaluate(`[...document.querySelectorAll('[data-slot="sidebar-desktop"] button')].find((x) => x.checkVisibility() && x.textContent.trim() === "Keluar")?.textContent.trim()`);
  rec("D akses: tombol Keluar ditemukan untuk berganti persona tanpa muat ulang", logoutText === "Keluar", logoutText);
  await uiLogin(EMAIL.siti, "/dashboard");
  rec("D akses: setelah diganti, Siti (Admin lama) tidak lagi melihat p-001; p-002 tetap", same(await clientList(), ["p-002"]));

  // Ganti lagi dari seed (muat ulang), lalu masuk sebagai Rina (Admin baru)
  await openTeam(ID.budi, "p-001");
  await openAction('[data-action="replace-admin"]');
  await setVal(`${DIALOG} select`, ID.rina);
  await submitDialog();
  await waitDialogGone("ganti (kedua)");
  await uiLogin(EMAIL.rina, "/dashboard");
  rec("D akses: Rina (Admin baru) melihat p-001", same(await clientList(), ["p-001"]));
  await clickEl('[data-slot="project-table"] a[href="/proyek/p-001"]');
  await detailReady();
  await selectTab("tim");
  rec("D akses: Rina (Admin principal baru) hanya mendapat Tambah anggota", same(await panelButtons(), ["Tambah anggota"]), JSON.stringify(await panelButtons()));

  // Cabut (dari seed: Siti), lalu masuk sebagai Siti
  await openTeam(ID.budi, "p-001");
  await openAction('[data-action="revoke-admin"]');
  d = await dialogInfo();
  const first = await activeInfo();
  rec("D cabut: konfirmasi menyebut nama, akibat akses, akun/role/anggota/tugas tetap; tombol Batal dan 'Cabut Admin'",
    d.title === "Cabut Siti Aminah sebagai Admin penanggung jawab?" && d.description === "Siti Aminah tidak lagi dapat membuka proyek PRJ-001. Proyek tidak memiliki Admin penanggung jawab sampai Anda menetapkan yang baru. Akun dan peran Admin Kantor Siti Aminah tidak berubah, dan anggota serta tugas proyek tetap utuh. Perubahan ini hanya simulasi dan hilang saat halaman dimuat ulang." && same(d.buttons, ["Batal", "Cabut Admin"]), JSON.stringify(d));
  rec("D cabut: fokus awal di Batal (aksi destruktif)", first.inDialog && first.text === "Batal", JSON.stringify(first));
  await checkAxe("dialog cabut Admin 1280");
  await shot("dialog-cabut-admin-1280");
  await dialogButton("Cabut Admin");
  await waitDialogGone("cabut selesai");
  rec("D cabut: sukses diumumkan", await waitAnnounced("Siti Aminah tidak lagi menjadi Admin penanggung jawab (simulasi)."));
  await sleep(450);
  rec("D cabut: slot kosong kembali; anggota dan tugas tetap; fokus ke 'Tetapkan Admin'", (await vis('[data-slot="admin-vacant"]')) && same(await teamIds(), ["u-003", "u-004", "u-005"]) && (await tasksTab()) === "Tugas (4)" && (await activeInfo()).action === "assign-admin", JSON.stringify({ ids: await teamIds(), act: await activeInfo() }));
  rec("D cabut: Ringkasan 'Belum ditetapkan'", (await summaryAdmin()).includes("Belum ditetapkan"));
  await shot("tim-cabut-sukses-1280");
  await uiLogin(EMAIL.siti, "/dashboard");
  rec("D akses: setelah dicabut, Siti tidak lagi melihat p-001 (p-002 tetap; akun dan role tetap Admin Kantor)", same(await clientList(), ["p-002"]));
}

// =====================================================================================
// E. Stale (hook development): data atau hak berubah saat dialog terbuka
// =====================================================================================
{
  await openTeam(ID.budi, "p-003");
  await waitHook();
  rec("E hook uji tersedia di development", true);
  // E1. kandidat sudah ditambahkan pihak lain saat dipilih
  await openAction('[data-action="add-member"]');
  await setVal(`${DIALOG} select`, ID.ahmad);
  await hook(`h.addProjectMember("p-003", "u-003")`);
  await sleep(250);
  let d = await dialogInfo();
  rec("E1 stale tambah: pilihan yang sudah tidak tersedia dikosongkan dengan pesan 'Pilih lagi'", d.value === "" && d.fieldErrors.includes("Pilihan sebelumnya sudah tidak tersedia. Pilih lagi.") && !d.options.includes("Ahmad Rizal"), JSON.stringify(d));
  // E2. kandidat ditambahkan pihak lain SAAT menyimpan (dalam jeda simulasi)
  await setVal(`${DIALOG} select`, ID.eko);
  await submitDialog();
  await hook(`h.addProjectMember("p-003", "u-005")`);
  await waitFor(async () => ((await dialogInfo())?.alerts.length ? true : null), 8000, "galat stale");
  d = await dialogInfo();
  rec("E2 stale tambah: ditolak dengan pesan spesifik; dialog tetap terbuka; keanggotaan tidak ganda",
    same(d.alerts, ["Eko Prasetyo sudah terdaftar di proyek ini. Tidak ada data yang diubah. Pilih anggota lain."]) && (await hook(`h.snapshot().members.filter((m) => m.projectId === "p-003" && m.userId === "u-005").length`)) === 1, JSON.stringify(d.alerts));
  await shot("dialog-tambah-stale-1280");
  await pressKey("Escape");
  await waitDialogGone("tutup stale tambah");

  // E3. anggota kini memegang tugas saat konfirmasi terbuka
  await openAction(`[data-action="remove-member"][data-user-id="${ID.ahmad}"]`);
  rec("E3 awal: Ahmad (tanpa tugas) → dialog konfirmasi", (await dialogInfo()).title === "Keluarkan Ahmad Rizal dari proyek?");
  await hook(`h.createTask({ projectId: "p-003", title: "Tugas uji stale", status: "TODO", priority: "LOW", progress: 0, assigneeId: "u-003" })`);
  await sleep(200);
  rec("E3 stale: dialog tidak berganti jenis saat store berubah", (await dialogInfo()).title === "Keluarkan Ahmad Rizal dari proyek?");
  await dialogButton("Keluarkan dari proyek");
  await waitFor(async () => ((await dialogInfo())?.alerts.length ? true : null), 8000, "galat stale keluarkan");
  d = await dialogInfo();
  rec("E3 stale keluarkan: ditolak dengan jumlah tugas aktual; anggota tetap; tugas tidak dihapus",
    same(d.alerts, ["Ahmad Rizal tidak dapat dikeluarkan karena masih tercatat sebagai penanggung jawab 1 tugas di proyek ini. Tidak ada data yang diubah."]) && (await hook(`h.snapshot().members.some((m) => m.projectId === "p-003" && m.userId === "u-003")`)) === true, JSON.stringify(d.alerts));
  await shot("dialog-keluarkan-stale-tugas-1280");
  await dialogButton("Batal");
  await waitDialogGone("batal stale");

  // E4. anggota sudah dikeluarkan pihak lain saat konfirmasi terbuka
  await openAction(`[data-action="remove-member"][data-user-id="${ID.eko}"]`);
  await hook(`h.removeProjectMember("p-003", "u-005")`);
  await sleep(200);
  rec("E4 stale: dialog tetap terbuka walau baris anggota sudah hilang", (await dialogInfo())?.title === "Keluarkan Eko Prasetyo dari proyek?");
  await dialogButton("Keluarkan dari proyek");
  await waitFor(async () => ((await dialogInfo())?.alerts.length ? true : null), 8000, "galat sudah keluar");
  rec("E4 stale keluarkan: 'sudah tidak terdaftar', tanpa perubahan", same((await dialogInfo()).alerts, ["Eko Prasetyo sudah tidak terdaftar di proyek ini. Tidak ada data yang diubah."]));
  await dialogButton("Batal");
  await waitDialogGone("batal sudah keluar");

  // E5. Admin berubah saat dialog Tetapkan terbuka
  await openAction('[data-action="assign-admin"]');
  await setVal(`${DIALOG} select`, ID.siti);
  await hook(`h.setProjectAdmin("p-003", "u-006")`);
  await sleep(250);
  rec("E5 stale: dialog Tetapkan tetap terbuka walau slot kosong sudah hilang", (await dialogInfo())?.slot === "admin-assign");
  await submitDialog();
  await waitFor(async () => ((await dialogInfo())?.alerts.length ? true : null), 8000, "galat admin berubah");
  rec("E5 stale tetapkan: 'sudah berubah menjadi Rina Wulandari', Admin tidak diganti", same((await dialogInfo()).alerts, ["Admin penanggung jawab sudah berubah menjadi Rina Wulandari. Periksa lagi sebelum melanjutkan. Tidak ada data yang diubah."]) && (await hook(`h.snapshot().projects.find((p) => p.id === "p-003").adminId`)) === "u-006");
  await shot("dialog-tetapkan-stale-1280");
  await pressKey("Escape");
  await waitDialogGone("tutup stale tetapkan");

  // E6. Admin sudah dicabut saat konfirmasi Cabut terbuka
  await openAction('[data-action="revoke-admin"]');
  await hook(`h.setProjectAdmin("p-003", null)`);
  await sleep(200);
  await dialogButton("Cabut Admin");
  await waitFor(async () => ((await dialogInfo())?.alerts.length ? true : null), 8000, "galat sudah dicabut");
  rec("E6 stale cabut: 'sudah tidak memiliki Admin penanggung jawab', tanpa perubahan", same((await dialogInfo()).alerts, ["Proyek ini sudah tidak memiliki Admin penanggung jawab. Tidak ada data yang diubah."]));
  await dialogButton("Batal");
  await waitDialogGone("batal stale cabut");

  // E7. proyek menjadi Arsip saat dialog Tambah terbuka
  await openAction('[data-action="add-member"]');
  await setVal(`${DIALOG} select`, ID.dewi);
  await hook(`h.updateProject("p-003", { ...h.snapshot().projects.find((p) => p.id === "p-003"), status: "ARCHIVED" })`);
  await sleep(250);
  await submitDialog();
  await waitFor(async () => ((await dialogInfo())?.alerts.length ? true : null), 8000, "galat Arsip");
  rec("E7 stale Arsip: ditolak 'sudah berstatus Arsip'; Dewi tidak ditambahkan", same((await dialogInfo()).alerts, ["Proyek ini sudah berstatus Arsip dan hanya dapat dibaca. Tidak ada data yang diubah."]) && (await hook(`h.snapshot().members.some((m) => m.projectId === "p-003" && m.userId === "u-004")`)) === false);
  await pressKey("Escape");
  await waitDialogGone("tutup stale Arsip");
  rec("E7 setelah Arsip: semua tombol tim hilang", same(await panelButtons(), []), JSON.stringify(await panelButtons()));

  // E8. Admin principal kehilangan hak saat dialog terbuka (Owner mengganti Admin di tab lain → disimulasikan lewat hook)
  await openTeam(ID.siti, "p-002");
  await waitHook();
  await openAction('[data-action="add-member"]');
  await setVal(`${DIALOG} select`, ID.dewi);
  await hook(`h.setProjectAdmin("p-002", "u-006")`);
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/akses-ditolak" ? true : null), 15000, "siti dialihkan").catch(() => null);
  const after = await evaluate(`location.pathname`);
  rec("E8 stale akses: Admin principal yang diganti dialihkan ke Akses Ditolak; anggota tidak ditambahkan", after === "/akses-ditolak" && (await hook(`h.snapshot().members.some((m) => m.projectId === "p-002" && m.userId === "u-004")`)) === false, after);
}

// =====================================================================================
// F. Responsif: 375 (mobile + sentuh), 768
// =====================================================================================
{
  await setViewport({ width: 375, height: 800, mobile: true, touch: true });
  await openTeam(ID.budi, "p-001");
  const cards = await evaluate(`[...document.querySelectorAll('[data-slot="project-team-cards"] [data-slot="record-card"]')].filter((e) => e.checkVisibility()).map((c) => ({ id: c.getAttribute("data-user-id"), last: c.lastElementChild?.getAttribute("data-slot"), bg: getComputedStyle(c).backgroundColor }))`);
  rec("F 375 budi: kartu (bukan tabel), Admin pertama berlatar Warm Highlight, area aksi di bawah tiap kartu", same(cards.map((c) => c.id), P1_TEAM) && cards[0].bg === ACCENT_RGB && cards.every((c) => c.last === "record-card-actions") && !(await vis('[data-slot="project-team-table"]')), JSON.stringify(cards));
  const sizes = await evaluate(`[...__pick('[data-slot="project-team"]').querySelectorAll("button")].filter((b) => b.checkVisibility()).map((b) => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; })`);
  rec("F 375 budi: semua tombol tim >= 44x44px", sizes.length === 6 && sizes.every((s) => s.w >= 44 && s.h >= 44), JSON.stringify(sizes));
  await checkOverflow("budi p-001 tim 375");
  await checkAxe("budi p-001 tim 375");
  await shotFull("tim-owner-p001-375");
  await openAction(`[data-action="remove-member"][data-user-id="${ID.dewi}"]`, true);
  await checkOverflow("dialog blokir 375");
  await checkAxe("dialog blokir 375");
  const mbtn = await evaluate(`[...__pick(${q(DIALOG)}).querySelectorAll("button")].filter((b) => b.checkVisibility()).map((b) => { const r = b.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); })`);
  rec("F 375: tombol dialog (termasuk X) >= 44px", mbtn.every((s) => s >= 44), JSON.stringify(mbtn));
  await shot("dialog-keluarkan-blokir-375");
  await pressKey("Escape");
  await waitDialogGone("tutup 375");
  // p-001 tidak punya kandidat (semua sudah anggota); dialog dengan pilihan diuji di p-003.
  await openTeam(ID.budi, "p-003");
  await openAction('[data-action="add-member"]', true);
  await checkOverflow("dialog tambah 375");
  await checkAxe("dialog tambah 375");
  const fs = await evaluate(`(() => { const s = __pick('${DIALOG} select'); const r = s.getBoundingClientRect(); return { h: Math.round(r.height), fs: parseFloat(getComputedStyle(s).fontSize) }; })()`);
  rec("F 375: pilihan kandidat 44px, font >= 16px", fs.h >= 44 && fs.fs >= 16, JSON.stringify(fs));
  await shot("dialog-tambah-anggota-375");
  await pressKey("Escape");
  await waitDialogGone("tutup tambah 375");

  await openTeam(ID.ahmad, "p-001");
  const mt = await panelText();
  rec("F 375 ahmad (Mandor): read-only — tanpa tombol, tanpa email", same(await panelButtons(), []) && !mt.includes("@"), JSON.stringify(await panelButtons()));
  await checkOverflow("ahmad p-001 tim 375");
  await checkAxe("ahmad p-001 tim 375");
  await shotFull("tim-mandor-p001-375");

  await setViewport({ width: 768, height: 1024 });
  await openTeam(ID.budi, "p-001");
  const two = await evaluate(`(() => { const cs = [...document.querySelectorAll('[data-slot="project-team-cards"] [data-slot="record-card"]')].filter((e) => e.checkVisibility()).map((c) => Math.round(c.getBoundingClientRect().top)); return cs; })()`);
  rec("F 768 budi: kartu dua kolom (dua kartu sebaris)", two.length === 4 && two[0] === two[1] && two[2] === two[3], JSON.stringify(two));
  await checkOverflow("budi p-001 tim 768");
  await checkAxe("budi p-001 tim 768");
  await shotFull("tim-owner-p001-768");
  await openAction('[data-action="replace-admin"]');
  await checkOverflow("dialog ganti 768");
  await checkAxe("dialog ganti 768");
  await shot("dialog-ganti-admin-768");
  await pressKey("Escape");
  await waitDialogGone("tutup 768");

  await setViewport({ width: 1280, height: 900 });
  await openTeam(ID.budi, "p-001");
  const text = await evaluate(`document.querySelector("main").textContent`);
  const hits = findForbidden(text, UI_FORBIDDEN);
  rec("F: tanpa kata anggaran/nominal Rp, tanpa Tukang, tanpa istilah 'Admin principal' di UI", hits.length === 0 && !/tukang/i.test(text) && !/principal/i.test(text), hits.join(" | "));
}

// =====================================================================================
// G. Production: hook uji tidak ada di build dan tidak tersedia pada `next start`
// =====================================================================================
if (RUN_PROD) {
  try {
    dev.kill();
  } catch {
    /* sudah berhenti */
  }
  dev = null;
  await sleep(1500);
  console.log("Build production (npm run build) ...");
  const build = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], { cwd: ROOT, encoding: "utf8", env: { ...process.env, NODE_ENV: "production", U4_SPIKE: "" } });
  rec("G build production berhasil", build.status === 0, (build.stderr || "").slice(-400));
  const walk = (dir) => readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name));
  const served = [...walk(join(ROOT, ".next/static")), ...walk(join(ROOT, ".next/server")).filter((f) => f.endsWith(".js") || f.endsWith(".html") || f.endsWith(".rsc") || f.endsWith(".body"))];
  const leak = served.filter((f) => !f.endsWith(".map") && /__PROYEKIN_TEST__|installDevTestHooks|dev-test-hooks/.test(readFileSync(f, "utf8")));
  rec(`G keluaran build (${served.length} berkas .next/static + .next/server) tanpa penanda hook uji`, served.length > 0 && leak.length === 0, leak.slice(0, 5).join(", "));
  prod = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PROD_PORT)], { cwd: ROOT, stdio: "ignore" });
  base = `http://localhost:${PROD_PORT}`;
  await waitFor(async () => (await fetch(`${base}/masuk`)).ok, 120000, "next start");
  await setSession(ID.budi);
  await navigate("/proyek/p-001");
  await detailReady();
  await sleep(1500);
  rec("G next start: window.__PROYEKIN_TEST__ tidak terdefinisi di halaman detail", (await evaluate(`typeof window.__PROYEKIN_TEST__`)) === "undefined");
  rec("G next start: tidak ada route debug publik (/u4-spike 404 di build biasa)", (await (await fetch(`${base}/u4-spike`)).status) === 404);
} else {
  rec("G production dilewati (--no-prod) — WAJIB dijalankan sebelum klaim PASS", false);
}

writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
const total = results.checks.length;
console.log(results.failures.length ? `\n${results.failures.length} masalah dari ${total} pemeriksaan.` : `\nSemua ${total} pemeriksaan lolos.`);
process.exit(results.failures.length ? 1 : 0);
