// Pemeriksaan U4-6 di browser (Chrome via CDP, dev server): CRUD proyek di /proyek dan /proyek/[projectId].
// Persona: Budi (Owner), Siti (Admin Kantor principal p-001 dan p-002), Ahmad dan Eko (Mandor), Dewi (Anggota Tim).
// Semua harapan ditulis sebagai literal (sengaja bukan dihitung dari access.ts). Store mock ada di memori: muat ulang dokumen
// (navigate) mengembalikan seed; navigasi klien (klik tautan) mempertahankan perubahan.
// Cakupan:
//   A. hak per role: tombol Tambah (Owner saja di daftar), Ubah (Owner + Admin principal), Hapus (Owner), Mandor/Anggota Tim tanpa aksi,
//      Arsip tanpa aksi
//   B. TAMBAH (Owner): dialog, label, status tanpa Arsip, tanpa penetapan Admin, validasi (wajib/opsional/batas), fokus galat,
//      kode otomatis berurutan, opsional kosong, kirim ganda tertolak, hasil terlihat di detail DAN daftar, muat ulang = seed
//   C. UBAH (Owner dan Admin principal): data awal terisi, validasi, simpan, hasil di detail dan daftar, relasi (kode, Admin, tim,
//      tugas, progres) terjaga, batal tidak mengubah, Enter mengirim
//   D. HAPUS (Owner): ditolak dengan alasan jelas bila ada Task/ProjectMember/Admin principal (p-001, p-002, p-003 + tugas, proyek
//      runtime + tugas), tanpa kaskade (tugas dan tim tetap), konfirmasi untuk proyek tanpa keterkaitan, Batal/Esc tidak menghapus
//   E. tanpa anggaran/nominal Rp/Tukang di UI
//   F. responsif 1280/768/375 (overflow, axe 0 dengan dialog terbuka), 375 mobile:true + sentuhan (target >= 44px, font >= 16px)
// Representasi UI mock, BUKAN otorisasi. Jalankan: npm run check:u4-project-crud [-- <folder-bukti>]
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { createBrowser, sleep, waitFor } from "./lib/cdp.mjs";
import { findForbidden, UI_FORBIDDEN } from "./lib/no-budget.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(process.argv[2] ?? join(ROOT, ".u4-project-crud-check"));
const APP_PORT = 3530;
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

const ID = { budi: "u-001", siti: "u-002", ahmad: "u-003", dewi: "u-004", eko: "u-005" };
const ALL_P = ["p-001", "p-002", "p-003", "p-004", "p-005"];
const P1_TEAM = ["u-002", "u-003", "u-004", "u-005"];
const F = (n) => `[data-slot="project-form"] [name="${n}"]`;
const FIELD = { name: F("name"), client: F("client"), location: F("location"), start: F("startDate"), end: F("endDate"), status: F("status"), description: F("description") };
const ERR_TEXT = {
  nameRequired: "Nama proyek wajib diisi.",
  nameShort: "Nama proyek minimal 3 karakter.",
  clientRequired: "Nama klien wajib diisi.",
  endBeforeStart: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
};

// ---------------- server, browser, utilitas ----------------
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(APP_PORT)], { cwd: ROOT, stdio: "ignore" });
const browser = await createBrowser({ cdpPort: 9699 });
const { send, evaluate, setViewport, tap, pressKey, insertText } = browser;
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

// Next.js 16 menyimpan halaman sebelumnya tersembunyi di DOM: selalu pilih elemen yang TERLIHAT.
await send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__pick = (s) => [...document.querySelectorAll(s)].find((e) => e.checkVisibility()) ?? null;` });

async function navigate(path) {
  await send("Page.navigate", { url: `${BASE}${path}` });
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
const clickEl = (sel) => evaluate(`(() => { const el = [...document.querySelectorAll(${q(sel)})].find((x) => x.checkVisibility()) ?? __pick(${q(sel)}); if (!el) throw new Error("tidak ada: " + ${q(sel)}); el.click(); return true; })()`);
const clickText = (scope, text) => evaluate(`(() => { const el = [...document.querySelectorAll(${q(scope)})].find((b) => b.checkVisibility() && b.textContent.trim() === ${q(text)}); if (!el) throw new Error("tidak ada tombol: " + ${q(text)}); el.click(); return true; })()`);
const actionTexts = (scope) => evaluate(`[...document.querySelectorAll(${q(scope)})].filter((b) => b.checkVisibility()).map((b) => b.textContent.trim())`);
/** Mengisi kontrol terkendali React (input/textarea/select) lewat setter native + event. */
const setVal = (sel, value) =>
  evaluate(`(() => {
    const el = __pick(${q(sel)});
    if (!el) throw new Error("tidak ada: " + ${q(sel)});
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${q(value)});
    el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
    return el.value;
  })()`);
async function fillForm(values) {
  for (const [key, value] of Object.entries(values)) await setVal(FIELD[key], value);
}
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
const forbiddenIn = async (sel, label) => {
  const text = (await evaluate(`(__pick(${q(sel)}) ?? document.body).textContent`)) ?? "";
  const hits = findForbidden(text, UI_FORBIDDEN);
  rec(`${label}: tanpa kata anggaran atau nominal Rp`, hits.length === 0, hits.join(" | "));
  rec(`${label}: tanpa kata Tukang`, !/tukang/i.test(text));
};

// ---- navigasi dan pembacaan halaman ----
const listReady = () => waitVis('[data-slot="project-list"][data-state="ready"]', "daftar siap");
const detailReady = () => waitVis('[data-detail="found"][data-state="ready"]', "detail siap");
const openList = async (userId) => {
  await setSession(userId);
  await navigate("/proyek");
  await listReady();
};
const openDetail = async (userId, id) => {
  await setSession(userId);
  await navigate(`/proyek/${id}`);
  await detailReady();
};
const rowIds = () => evaluate(`[...document.querySelectorAll('[data-slot="project-row"]')].filter((e) => e.checkVisibility()).map((e) => e.getAttribute("data-project-id"))`);
const cardIds = () => evaluate(`[...document.querySelectorAll('[data-slot="project-card"]')].filter((e) => e.checkVisibility()).map((e) => e.getAttribute("data-project-id"))`);
const listIds = (mobile = false) => (mobile ? cardIds() : rowIds());
const rowText = (id, mobile = false) => textOf(mobile ? `[data-slot="project-card"][data-project-id="${id}"]` : `[data-slot="project-row"][data-project-id="${id}"]`);
const pathNow = () => evaluate(`location.pathname + location.search`);
const header = () => evaluate(`({ h1: __pick("main h1")?.textContent.trim(), eyebrow: __pick('[data-slot="page-header"] p')?.textContent.trim() })`);
const info = () => textOf('[data-slot="project-info"]');
const detailActions = () => actionTexts('[data-slot="page-header"] button');
async function clientToList(mobile = false) {
  await clickEl('[data-slot="back-link"]');
  await listReady();
  return listIds(mobile);
}
async function clientToDetail(id, mobile = false) {
  await clickEl(mobile ? `[data-slot="project-cards"] a[href="/proyek/${id}"]` : `[data-slot="project-table"] a[href="/proyek/${id}"]`);
  await detailReady();
}
async function selectTab(name, touch = false) {
  const sel = `[data-slot="tabs-tab"][data-tab="${name}"]`;
  if (touch) await tap(sel);
  else await clickEl(sel);
  await waitFor(() => evaluate(`__pick(${q(sel)})?.getAttribute("aria-selected") === "true"`), 8000, `tab ${name}`);
  await sleep(150);
}
const teamIds = () => evaluate(`[...document.querySelectorAll('[data-slot="project-team-row"], [data-slot="record-card"][data-user-id]')].filter((e) => e.checkVisibility()).map((e) => e.getAttribute("data-user-id"))`);

// ---- dialog ----
const DLG = { create: '[data-dialog="project-create"]', edit: '[data-dialog="project-edit"]', blocked: '[data-dialog="project-delete-blocked"]', confirm: '[role="dialog"]' };
async function openDialog(kind, triggerSel, touch = false) {
  if (touch) await tap(triggerSel);
  else await clickEl(triggerSel);
  await waitVis(DLG[kind], `dialog ${kind} terbuka`);
  await sleep(250);
}
async function closeDialogWithEsc(kind) {
  await pressKey("Escape");
  await waitGone(DLG[kind], `dialog ${kind} tertutup`);
}
const activeInfo = () => evaluate(`(() => { const a = document.activeElement; return { tag: a?.tagName, id: a?.id ?? "", name: a?.getAttribute?.("name") ?? "", action: a?.getAttribute?.("data-action") ?? "", text: (a?.textContent ?? "").trim().slice(0, 40), inDialog: !!a?.closest?.('[role="dialog"]') }; })()`);
const fieldError = (sel) => evaluate(`(() => { const el = __pick(${q(sel)}); if (!el) return null; const ids = (el.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean); const err = ids.map((i) => document.getElementById(i)).find((e) => e?.getAttribute("data-slot") === "field-error"); return { invalid: el.getAttribute("aria-invalid"), message: err ? err.textContent.trim() : null }; })()`);
const submitSel = '[data-slot="project-form"] button[type="submit"]';

// =====================================================================================
// A. Hak per role (aksi yang tampil)
// =====================================================================================
await setViewport({ width: 1280, height: 900 });
{
  await openList(ID.budi);
  rec("A budi: daftar menampilkan 5 proyek dan satu-satunya tombol adalah Tambah proyek", same(await rowIds(), ALL_P) && same(await actionTexts('[data-slot="project-list"] button'), ["Tambah proyek"]), JSON.stringify(await actionTexts('[data-slot="project-list"] button')));
  for (const key of ["siti", "ahmad", "eko", "dewi"]) {
    await openList(ID[key]);
    rec(`A ${key}: daftar tanpa tombol Tambah proyek atau aksi lain`, (await actionTexts('[data-slot="project-list"] button')).length === 0, JSON.stringify(await actionTexts('[data-slot="project-list"] button')));
  }
  const EXPECT = {
    budi: { "p-001": ["Ubah proyek", "Hapus proyek"], "p-002": ["Ubah proyek", "Hapus proyek"], "p-003": ["Ubah proyek", "Hapus proyek"], "p-004": ["Ubah proyek", "Hapus proyek"], "p-005": [] },
    siti: { "p-001": ["Ubah proyek"], "p-002": ["Ubah proyek"] },
    ahmad: { "p-001": [], "p-002": [] },
    eko: { "p-001": [], "p-002": [] },
    dewi: { "p-001": [] },
  };
  for (const [key, byProject] of Object.entries(EXPECT)) {
    for (const [pid, actions] of Object.entries(byProject)) {
      await openDetail(ID[key], pid);
      rec(`A ${key} ${pid}: aksi di header detail = ${actions.join(", ") || "tidak ada"}`, same(await detailActions(), actions), JSON.stringify(await detailActions()));
    }
  }
}

// =====================================================================================
// B. TAMBAH (Owner)
// =====================================================================================
await openList(ID.budi);
await openDialog("create", '[data-action="create-project"]');
{
  const dlg = DLG.create;
  rec("B dialog tambah: judul 'Tambah proyek' dan deskripsi menyebut kode otomatis", (await textOf(`${dlg} [data-slot="dialog-title"]`)) === "Tambah proyek" && (await textOf(`${dlg} [data-slot="dialog-description"]`)).includes("Kode proyek dibuat otomatis"));
  const act = await activeInfo();
  rec("B dialog tambah: fokus awal di dalam dialog pada kolom Nama proyek", act.inDialog && act.name === "name", JSON.stringify(act));
  const labels = await evaluate(`Object.fromEntries(${q(Object.entries(FIELD))}.map(([k, sel]) => { const el = __pick(sel); const l = el?.labels?.[0]; return [k, { label: l ? l.textContent.replace(/\\s+/g, " ").trim() : null, labels: el?.labels?.length ?? 0, required: el?.getAttribute("aria-required") === "true", idUnique: !!el?.id && document.querySelectorAll("#" + CSS.escape(el.id)).length === 1 }]; }))`);
  results.measurements["labels form"] = labels;
  rec("B dialog tambah: setiap kolom punya tepat satu label tertaut dan id unik; wajib = Nama proyek, Klien, Status; sisanya berlabel '(opsional)'",
    Object.values(labels).every((x) => x.labels === 1 && x.idUnique) &&
    labels.name.label.startsWith("Nama proyek") && labels.name.required &&
    labels.client.label.startsWith("Klien") && labels.client.required &&
    labels.status.label.startsWith("Status") && labels.status.required &&
    ["location", "start", "end", "description"].every((k) => labels[k].label.includes("(opsional)") && !labels[k].required), JSON.stringify(labels));
  const status = await evaluate(`(() => { const sel = __pick(${q(FIELD.status)}); return { options: [...sel.options].map((o) => [o.value, o.textContent.trim()]), value: sel.value }; })()`);
  rec("B dialog tambah: status Draf, Berjalan, Tertunda, Selesai (tanpa Arsip), bawaan Draf", same(status.options, [["DRAFT", "Draf"], ["ON_PROGRESS", "Berjalan"], ["PAUSED", "Tertunda"], ["COMPLETED", "Selesai"]]) && status.value === "DRAFT", JSON.stringify(status));
  const formText = await textOf('[data-slot="project-form"]');
  rec("B dialog tambah: tanpa kolom penetapan Admin Kantor (itu U4-7)", !/Admin Kantor|Admin principal|penanggung jawab/i.test(formText) && (await evaluate(`document.querySelectorAll('[data-slot="project-form"] [name="adminId"]').length`)) === 0, formText.slice(0, 120));
  const note = await textOf(`${dlg} [data-slot="demo-data-notice"]`);
  rec("B dialog tambah: catatan data demo menyebut memori tab, hilang saat dimuat ulang, tanpa server", !!note && note.includes("memori tab ini") && note.includes("Tidak ada data yang dikirim atau disimpan ke server"), note ?? "tidak ada");
  await forbiddenIn(dlg, "B dialog tambah");
  await checkAxe("dialog tambah kosong 1280");
  await checkOverflow("dialog tambah 1280");
  await shot("tambah-dialog-1280");

  // validasi: kosong
  await clickEl(submitSel);
  await waitFor(async () => (await fieldError(FIELD.name))?.message, 8000, "galat nama");
  const eName = await fieldError(FIELD.name);
  const eClient = await fieldError(FIELD.client);
  rec("B validasi kosong: Nama dan Klien menolak, galat tertaut aria-describedby + aria-invalid", eName.invalid === "true" && eName.message === ERR_TEXT.nameRequired && eClient.invalid === "true" && eClient.message === ERR_TEXT.clientRequired, JSON.stringify({ eName, eClient }));
  rec("B validasi kosong: kolom opsional tidak menolak", (await fieldError(FIELD.location)).invalid === null && (await fieldError(FIELD.description)).invalid === null && (await fieldError(FIELD.start)).invalid === null);
  await sleep(150);
  rec("B validasi kosong: fokus pindah ke galat pertama (Nama proyek)", (await activeInfo()).name === "name");
  rec("B validasi kosong: dialog tetap terbuka dan belum ada proyek baru", (await vis(DLG.create)) && (await evaluate(`location.pathname`)) === "/proyek");
  await checkAxe("dialog tambah dengan galat 1280");
  await shot("tambah-dialog-galat-1280");

  // validasi: nama pendek, tanggal terbalik
  await fillForm({ name: "ab", client: "PT Uji" });
  await clickEl(submitSel);
  await waitFor(async () => (await fieldError(FIELD.name))?.message === ERR_TEXT.nameShort, 8000, "galat nama pendek");
  rec("B validasi: nama 2 karakter ditolak (minimal 3); galat Klien hilang setelah diisi", (await fieldError(FIELD.client)).message === null);
  await fillForm({ name: "Gudang Uji Validasi", start: "2026-03-02", end: "2026-03-01" });
  await clickEl(submitSel);
  await waitFor(async () => (await fieldError(FIELD.end))?.message === ERR_TEXT.endBeforeStart, 8000, "galat tanggal");
  await sleep(150);
  rec("B validasi: tanggal selesai sebelum mulai ditolak dan fokus ke Tanggal selesai", (await activeInfo()).name === "endDate" && (await fieldError(FIELD.name)).message === null);
  await fillForm({ end: "" });
  // Esc menutup tanpa membuat proyek; fokus kembali ke pemicu
  await closeDialogWithEsc("create");
  const back = await activeInfo();
  rec("B Esc menutup dialog; fokus kembali ke tombol Tambah proyek; tidak ada proyek baru", back.action === "create-project" && same(await rowIds(), ALL_P), JSON.stringify(back));
}

// Batal menutup tanpa membuat; isian tidak bocor ke pembukaan berikutnya
await openDialog("create", '[data-action="create-project"]');
rec("B dialog dibuka ulang: form bersih (isian sebelumnya tidak bocor)", (await evaluate(`__pick(${q(FIELD.name)}).value`)) === "" && (await fieldError(FIELD.name)).invalid === null);
await clickText(`${DLG.create} button`, "Batal");
await waitGone(DLG.create, "dialog tertutup lewat Batal");
rec("B tombol Batal menutup dialog tanpa membuat proyek", same(await rowIds(), ALL_P));

// Buat #1: hanya kolom wajib; keyboard membuka dialog; kirim ganda
await evaluate(`__pick('[data-action="create-project"]').focus()`);
await pressKey("Enter");
await waitVis(DLG.create, "dialog terbuka lewat keyboard");
rec("B keyboard: Enter pada tombol Tambah proyek membuka dialog", true);
await fillForm({ name: "Gudang Uji Minimal", client: "PT Uji Minimal" });
{
  // Dua klik dalam satu tick (sebelum React merender keadaan memuat), lalu baca keadaan setelah render berikutnya.
  await evaluate(`(() => { const b = __pick(${q(submitSel)}); b.click(); b.click(); return true; })()`);
  const busy = await waitFor(() => evaluate(`(() => { const b = __pick(${q(submitSel)}); if (!b || b.getAttribute("aria-busy") !== "true") return null; return { busy: b.getAttribute("aria-busy"), disabledInputs: [...document.querySelectorAll('[data-slot="project-form"] input, [data-slot="project-form"] select, [data-slot="project-form"] textarea')].every((e) => e.disabled) }; })()`), 2000, "keadaan memuat").catch(() => ({ busy: null, disabledInputs: false }));
  rec("B simpan: tombol memuat (aria-busy) dan kolom terkunci selama menyimpan; klik ganda tidak dikirim dua kali", busy.busy === "true" && busy.disabledInputs, JSON.stringify(busy));
}
await waitFor(() => evaluate(`location.pathname === "/proyek/p-006"`), 20000, "navigasi ke detail proyek baru");
await detailReady();
{
  rec("B hasil: router.push ke detail proyek baru dengan penanda ?dibuat=1", (await pathNow()) === "/proyek/p-006?dibuat=1");
  const h = await header();
  rec("B hasil: judul dan kode otomatis PRJ-006", h.h1 === "Gudang Uji Minimal" && h.eyebrow === "PRJ-006", JSON.stringify(h));
  const notice = await textOf('[data-slot="created-notice"]');
  rec("B hasil: pesan sukses menyebut kode dan (simulasi)", notice === "Proyek PRJ-006 berhasil ditambahkan (simulasi).", notice ?? "tidak tampil");
  rec("B hasil: pesan sukses berperan status (diumumkan pembaca layar)", await evaluate(`__pick('[data-slot="created-notice"]')?.getAttribute("role") === "status"`));
  await sleep(200);
  rec("B hasil: fokus berada di pesan sukses setelah navigasi (pembaca layar membacanya)", await evaluate(`!!document.activeElement?.closest('[data-slot="created-notice"]') && document.activeElement.checkVisibility()`), JSON.stringify(await activeInfo()));
  const text = await info();
  rec("B hasil: ringkasan memuat klien, status Draf, dan kolom opsional kosong tampil '—'", [text.includes("PT Uji Minimal"), text.includes("Draf"), /Lokasi\s*—/.test(text), /Periode\s*—/.test(text), /Deskripsi\s*—/.test(text), text.includes("Belum ditetapkan")].every(Boolean), text);
  rec("B hasil: progres awal 0% dan tab Tugas (0)", (await evaluate(`__pick('[data-slot="project-info"] [role="progressbar"]').getAttribute("aria-valuenow")`)) === "0" && (await textOf('[data-tab="tugas"]')) === "Tugas (0)");
  rec("B hasil: Owner melihat aksi Ubah proyek dan Hapus proyek pada proyek baru", same(await detailActions(), ["Ubah proyek", "Hapus proyek"]));
  await forbiddenIn("main", "B detail proyek baru");
  await shot("tambah-hasil-detail-1280");
  await clickEl('[data-slot="created-notice"] button[aria-label="Tutup pesan"]');
  await waitGone('[data-slot="created-notice"]', "pesan ditutup");
  rec("B tombol Tutup pesan menghapus penanda ?dibuat=1 dan pesan", (await pathNow()) === "/proyek/p-006");
  await sleep(200);
  const afterDismiss = await evaluate(`(() => { const a = document.activeElement; return { tab: a?.getAttribute("data-slot") === "tabs-tab", selected: a?.getAttribute("aria-selected"), body: a === document.body }; })()`);
  rec("B setelah pesan ditutup: fokus pindah ke tab terpilih, tidak jatuh ke <body> (temuan code-review)", afterDismiss.tab && afterDismiss.selected === "true" && !afterDismiss.body, JSON.stringify(afterDismiss));
}
{
  const ids = await clientToList();
  rec("B daftar (navigasi klien): proyek baru terlihat; tepat 6 proyek (tidak ada duplikat dari klik ganda)", same(ids, [...ALL_P, "p-006"]), JSON.stringify(ids));
  const desc = await textOf('[data-slot="page-header"] p');
  const t = await rowText("p-006");
  rec("B daftar: ringkasan '6 proyek' dan baris PRJ-006 memuat nama, klien, status Draf", desc.startsWith("6 proyek") && ["PRJ-006", "Gudang Uji Minimal", "PT Uji Minimal", "Draf"].every((s) => t.includes(s)), `${desc} | ${t}`);
}

// Buat #2: semua kolom; ketik sungguhan (insertText) pada Nama
await openDialog("create", '[data-action="create-project"]');
await evaluate(`__pick(${q(FIELD.name)}).focus()`);
await insertText("Pembangunan Ruko Uji");
rec("B mengetik langsung di Nama proyek memperbarui kolom terkendali", (await evaluate(`__pick(${q(FIELD.name)}).value`)) === "Pembangunan Ruko Uji");
await fillForm({ client: "CV Maju Bersama", location: "Tanjung Pinang", start: "2026-04-01", end: "2026-10-31", status: "ON_PROGRESS", description: "Ruko dua lantai untuk uji." });
await clickEl(submitSel);
await waitFor(() => evaluate(`location.pathname === "/proyek/p-007"`), 20000, "navigasi proyek kedua");
await detailReady();
{
  const h = await header();
  const text = await info();
  rec("B hasil lengkap: kode PRJ-007 berurutan, nama, klien, lokasi, periode, status Berjalan, deskripsi", h.eyebrow === "PRJ-007" && h.h1 === "Pembangunan Ruko Uji" && ["CV Maju Bersama", "Tanjung Pinang", "1 Apr 2026 – 31 Okt 2026", "Berjalan", "Ruko dua lantai untuk uji."].every((s) => text.includes(s)), text);
}

// =====================================================================================
// C. UBAH (Owner pada proyek runtime p-007 — masih dalam sesi memori yang sama)
// =====================================================================================
await openDialog("edit", '[data-action="edit-project"]');
{
  const dlg = DLG.edit;
  rec("C dialog ubah: judul 'Ubah proyek', tombol 'Simpan perubahan', deskripsi menyebut kode/tim/tugas tidak berubah", (await textOf(`${dlg} [data-slot="dialog-title"]`)) === "Ubah proyek" && (await textOf(`${dlg} button[type="submit"]`)) === "Simpan perubahan" && (await textOf(`${dlg} [data-slot="dialog-description"]`)).includes("Kode proyek, tim, dan tugas tidak berubah"));
  const v = await evaluate(`Object.fromEntries(${q(Object.entries(FIELD))}.map(([k, sel]) => [k, __pick(sel).value]))`);
  rec("C dialog ubah: data awal terisi dari proyek", same(v, { name: "Pembangunan Ruko Uji", client: "CV Maju Bersama", location: "Tanjung Pinang", start: "2026-04-01", end: "2026-10-31", status: "ON_PROGRESS", description: "Ruko dua lantai untuk uji." }), JSON.stringify(v));
  rec("C dialog ubah: pilihan status tanpa Arsip", same(await evaluate(`[...__pick(${q(FIELD.status)}).options].map((o) => o.value)`), ["DRAFT", "ON_PROGRESS", "PAUSED", "COMPLETED"]));
  await checkAxe("dialog ubah 1280");
  await shot("ubah-dialog-1280");
  await fillForm({ name: "" });
  await clickEl(submitSel);
  await waitFor(async () => (await fieldError(FIELD.name))?.message === ERR_TEXT.nameRequired, 8000, "galat ubah");
  rec("C validasi ubah: nama dikosongkan ditolak; data proyek belum berubah", (await fieldError(FIELD.name)).invalid === "true");
  await clickText(`${dlg} button`, "Batal");
  await waitGone(dlg, "dialog ubah tertutup");
  rec("C Batal: judul proyek tetap sama", (await header()).h1 === "Pembangunan Ruko Uji");
}
await openDialog("edit", '[data-action="edit-project"]');
await fillForm({ name: "Pembangunan Ruko Uji (rev)", status: "PAUSED", location: "" });
await evaluate(`__pick(${q(FIELD.name)}).focus()`);
await pressKey("Enter");
await waitGone(DLG.edit, "dialog ubah tertutup setelah simpan", 20000);
{
  rec("C Enter di kolom mengirim form (keyboard)", true);
  const act = await activeInfo();
  rec("C setelah simpan: fokus kembali ke tombol Ubah proyek", act.action === "edit-project", JSON.stringify(act));
  await waitVis('[data-slot="saved-notice"]', "pesan disimpan tampil", 8000).catch(() => null);
  const notice = await textOf('[data-slot="saved-notice"]');
  const region = await evaluate(`(() => { const r = document.querySelector('[data-detail="found"] [data-slot="saved-notice-region"]'); const all = [...document.querySelectorAll('[data-detail="found"] [data-slot="saved-notice-region"]')].find((x) => x.closest('[data-detail="found"]').checkVisibility()); return all ? { role: all.getAttribute("role"), text: all.textContent.trim() } : null; })()`);
  rec("C setelah simpan: banner 'Perubahan proyek disimpan (simulasi).' tampil dan diumumkan lewat wilayah status persisten", notice === "Perubahan proyek disimpan (simulasi)." && region?.role === "status" && region.text === "Perubahan proyek disimpan (simulasi).", JSON.stringify({ notice, region }));
  const h = await header();
  const text = await info();
  rec("C detail diperbarui; kode PRJ-007 dan klien tetap; lokasi dikosongkan tampil '—'; status Tertunda", h.h1 === "Pembangunan Ruko Uji (rev)" && h.eyebrow === "PRJ-007" && text.includes("CV Maju Bersama") && /Lokasi\s*—/.test(text) && text.includes("Tertunda"), text);
  const ids = await clientToList();
  const t = await rowText("p-007");
  rec("C daftar diperbarui konsisten dengan detail (nama baru, status Tertunda)", same(ids, [...ALL_P, "p-006", "p-007"]) && t.includes("Pembangunan Ruko Uji (rev)") && t.includes("Tertunda"), t);
}

// =====================================================================================
// D1. HAPUS proyek runtime tanpa keterkaitan (Owner) — konfirmasi, loading, keadaan terhapus
// =====================================================================================
await clientToDetail("p-007");
await openDialog("confirm", '[data-action="delete-project"]');
{
  const dlg = '[role="dialog"]';
  rec("D1 konfirmasi hapus: judul menyebut kode; deskripsi menyebut akibat (simulasi, kembali setelah dimuat ulang)", (await textOf(`${dlg} [data-slot="dialog-title"]`)) === "Hapus proyek PRJ-007?" && (await textOf(`${dlg} [data-slot="dialog-description"]`)).includes("muncul kembali setelah halaman dimuat ulang"));
  const act = await activeInfo();
  rec("D1 konfirmasi hapus: fokus awal di Batal (aksi aman)", act.inDialog && act.text === "Batal", JSON.stringify(act));
  rec("D1 konfirmasi hapus: tombol konfirmasi menyebut aksinya", (await actionTexts(`${dlg} button`)).includes("Ya, hapus proyek"));
  await checkAxe("konfirmasi hapus 1280");
  await shot("hapus-konfirmasi-1280");
  await pressKey("Escape");
  await waitGone(dlg, "Esc menutup konfirmasi");
  rec("D1 Esc menutup konfirmasi tanpa menghapus; fokus kembali ke tombol Hapus proyek", (await activeInfo()).action === "delete-project" && (await header()).h1 === "Pembangunan Ruko Uji (rev)");
  await openDialog("confirm", '[data-action="delete-project"]');
  await clickText(`${dlg} button`, "Batal");
  await waitGone(dlg, "Batal menutup konfirmasi");
  rec("D1 Batal tidak menghapus", (await header()).h1 === "Pembangunan Ruko Uji (rev)");
  await openDialog("confirm", '[data-action="delete-project"]');
  await clickText(`${dlg} button`, "Ya, hapus proyek");
  const busy = await evaluate(`(() => { const bs = [...document.querySelectorAll('[role="dialog"] button')]; const ok = bs.find((b) => b.textContent.includes("Ya, hapus proyek")); const cancel = bs.find((b) => b.textContent.trim() === "Batal"); return { busy: ok?.getAttribute("aria-busy"), cancelDisabled: !!cancel && (cancel.disabled || cancel.getAttribute("data-disabled") !== null) }; })()`);
  rec("D1 saat menghapus: tombol memuat dan Batal terkunci", busy.busy === "true" && busy.cancelDisabled, JSON.stringify(busy));
  await waitVis('[data-detail="deleted"]', "keadaan terhapus");
  const del = await textOf('[data-detail="deleted"]');
  rec("D1 setelah hapus: pesan 'Proyek PRJ-007 dihapus (simulasi)' dan keterangan reload", !!del && del.includes("Proyek PRJ-007 dihapus (simulasi)") && del.includes("muncul kembali setelah halaman dimuat ulang"), del ?? "");
  const act2 = await activeInfo();
  rec("D1 setelah hapus: fokus dipindah ke judul keadaan terhapus; wilayah status untuk pembaca layar", act2.tag === "H1" && (await evaluate(`!!__pick('[data-detail="deleted"] [role="status"]')`)), JSON.stringify(act2));
  await checkAxe("keadaan terhapus 1280");
  await shot("hapus-berhasil-1280");
  await clickEl('[data-slot="back-link"]');
  await listReady();
  rec("D1 daftar setelah hapus: p-007 hilang; p-006 dan seed tetap (6 proyek)", same(await rowIds(), [...ALL_P, "p-006"]));
}

// D2. proyek runtime p-006 sekarang dihapus juga lewat jalur yang sama (tanpa keterkaitan) — dan muat ulang = seed (J9)
await navigate("/proyek");
await listReady();
rec("J9 muat ulang dokumen mengembalikan seed: tepat 5 proyek, tanpa p-006/p-007", same(await rowIds(), ALL_P));

// =====================================================================================
// D3. HAPUS ditolak: proyek seed dengan Task + ProjectMember + Admin principal (Owner)
// =====================================================================================
await openDetail(ID.budi, "p-001");
await openDialog("blocked", '[data-action="delete-project"]');
{
  const dlg = DLG.blocked;
  const items = await evaluate(`[...document.querySelectorAll('${dlg} [data-slot="delete-blockers"] li')].map((li) => [li.getAttribute("data-blocker"), li.textContent.trim()])`);
  rec("D3 p-001: dialog penolakan menyebut 4 tugas, 3 anggota tim, dan Admin penanggung jawab Siti Aminah", same(items, [["HAS_TASKS", "4 tugas masih tercatat di proyek ini."], ["HAS_MEMBERSHIPS", "3 anggota tim masih terdaftar di proyek ini."], ["IS_ADMIN_PRINCIPAL", "Admin Kantor penanggung jawab masih ditetapkan: Siti Aminah."]]), JSON.stringify(items));
  rec("D3 p-001: judul 'Proyek belum bisa dihapus' dan menegaskan tidak ada data yang dihapus", (await textOf(`${dlg} [data-slot="dialog-title"]`)) === "Proyek belum bisa dihapus" && (await textOf(`${dlg} [data-slot="dialog-description"]`)).includes("Tidak ada data yang dihapus"));
  const btns = await actionTexts(`${dlg} button`);
  rec("D3 p-001: dialog penolakan tanpa tombol hapus/konfirmasi (hanya Mengerti dan X Tutup)", btns.includes("Mengerti") && !btns.some((b) => /hapus/i.test(b)), JSON.stringify(btns));
  await checkAxe("hapus ditolak 1280");
  await shot("hapus-ditolak-1280");
  await clickText(`${dlg} button`, "Mengerti");
  await waitGone(dlg, "dialog penolakan tertutup");
  rec("D3 p-001: fokus kembali ke tombol Hapus proyek", (await activeInfo()).action === "delete-project");
  // tanpa kaskade: proyek, tugas, tim tetap utuh lewat navigasi klien
  const ids = await clientToList();
  rec("D3 p-001: setelah penolakan, 5 proyek tetap ada", same(ids, ALL_P));
  await clientToDetail("p-001");
  rec("D3 p-001: tab Tugas (4) tetap utuh", (await textOf('[data-tab="tugas"]')) === "Tugas (4)");
  await selectTab("tim");
  rec("D3 p-001: tim tetap 4 orang (Admin principal + 3 anggota)", same(await teamIds(), P1_TEAM), JSON.stringify(await teamIds()));
}
await openDetail(ID.budi, "p-002");
await openDialog("blocked", '[data-action="delete-project"]');
{
  const items = await evaluate(`[...document.querySelectorAll('${DLG.blocked} [data-slot="delete-blockers"] li')].map((li) => li.textContent.trim())`);
  rec("D3 p-002: menyebut 2 tugas, 2 anggota tim, dan Admin penanggung jawab", same(items, ["2 tugas masih tercatat di proyek ini.", "2 anggota tim masih terdaftar di proyek ini.", "Admin Kantor penanggung jawab masih ditetapkan: Siti Aminah."]), JSON.stringify(items));
}

// D4. Proyek seed p-003 awalnya dapat dihapus; setelah SATU tugas ditambahkan (lewat halaman uji) ditolak hanya karena tugas
await setSession(ID.budi);
await navigate("/u4-spike");
await waitVis('[data-spike-action="create-task-p003-push"]', "halaman uji siap");
await clickEl('[data-spike-action="create-task-p003-push"]');
await waitFor(() => evaluate(`location.pathname.startsWith("/tugas/")`), 20000, "tugas p-003 dibuat");
await clickEl('[data-slot="sidebar-desktop"] a[href="/proyek"]');
await listReady();
await clientToDetail("p-003");
await openDialog("blocked", '[data-action="delete-project"]');
{
  const items = await evaluate(`[...document.querySelectorAll('${DLG.blocked} [data-slot="delete-blockers"] li')].map((li) => [li.getAttribute("data-blocker"), li.textContent.trim()])`);
  rec("D4 p-003 setelah diberi 1 tugas: ditolak hanya karena tugas (tanpa anggota/Admin)", same(items, [["HAS_TASKS", "1 tugas masih tercatat di proyek ini."]]), JSON.stringify(items));
  await clickText(DLG.blocked + " button", "Mengerti");
  await waitGone(DLG.blocked, "dialog tertutup");
  rec("D4 p-003: proyek dan tugas tetap ada setelah penolakan", (await header()).eyebrow === "PRJ-003" && (await textOf('[data-tab="tugas"]')) === "Tugas (1)");
}
// D5. Proyek runtime dengan tugas (lewat halaman uji) ditolak
await clickEl('[data-slot="sidebar-desktop"] a[href="/u4-spike"]').catch(() => {});
await navigate("/u4-spike");
await waitVis('[data-spike-action="create-task-runtime-project-push"]', "halaman uji siap lagi");
await clickEl('[data-spike-action="create-task-runtime-project-push"]');
await waitFor(() => evaluate(`location.pathname.startsWith("/tugas/")`), 20000, "tugas di proyek runtime dibuat");
await clickEl('[data-slot="sidebar-desktop"] a[href="/proyek"]');
await listReady();
{
  const ids = await rowIds();
  const runtimeId = ids.find((id) => !ALL_P.includes(id));
  rec("D5 proyek runtime dari halaman uji terlihat untuk Owner", !!runtimeId, JSON.stringify(ids));
  await clientToDetail(runtimeId);
  await openDialog("blocked", '[data-action="delete-project"]');
  const items = await evaluate(`[...document.querySelectorAll('${DLG.blocked} [data-slot="delete-blockers"] li')].map((li) => li.textContent.trim())`);
  rec("D5 proyek runtime dengan 1 tugas: ditolak (tidak ada kaskade)", same(items, ["1 tugas masih tercatat di proyek ini."]), JSON.stringify(items));
  await clickText(DLG.blocked + " button", "Mengerti");
  await waitGone(DLG.blocked, "dialog tertutup");
}

// D6. Proyek seed tanpa keterkaitan (p-004) dihapus; proyek lain, tugas, dan tim tidak terdampak
await openDetail(ID.budi, "p-004");
await openDialog("confirm", '[data-action="delete-project"]');
await clickText('[role="dialog"] button', "Ya, hapus proyek");
await waitVis('[data-detail="deleted"]', "p-004 terhapus");
{
  rec("D6 p-004 (seed tanpa keterkaitan) terhapus dengan konfirmasi", (await textOf('[data-detail="deleted"]')).includes("Proyek PRJ-004 dihapus (simulasi)"));
  await clickEl('[data-slot="back-link"]');
  await listReady();
  rec("D6 daftar: p-004 hilang, empat proyek lain tetap", same(await rowIds(), ["p-001", "p-002", "p-003", "p-005"]));
  await clientToDetail("p-001");
  rec("D6 tanpa kaskade: p-001 tetap memiliki 4 tugas dan 4 anggota tim", (await textOf('[data-tab="tugas"]')) === "Tugas (4)" && (await (async () => { await selectTab("tim"); return same(await teamIds(), P1_TEAM); })()));
}

// =====================================================================================
// C2. UBAH oleh Admin principal (Siti) pada p-001: relasi terjaga
// =====================================================================================
await openDetail(ID.siti, "p-001");
const before = { progress: await evaluate(`__pick('[data-slot="project-info"] [role="progressbar"]').getAttribute("aria-valuenow")`) };
await openDialog("edit", '[data-action="edit-project"]');
{
  rec("C2 siti: dialog ubah tanpa kolom Admin Kantor penanggung jawab", !/Admin Kantor|Admin principal/i.test(await textOf('[data-slot="project-form"]')));
  await fillForm({ client: "PT. Klien Baru Siti", status: "PAUSED" });
  await clickEl(submitSel);
  await waitGone(DLG.edit, "dialog ubah siti tertutup", 20000);
  const text = await info();
  rec("C2 siti: klien dan status berubah di detail; kode PRJ-001 dan Admin Siti tetap", text.includes("PT. Klien Baru Siti") && text.includes("Tertunda") && text.includes("PRJ-001") && text.includes("Siti Aminah"), text);
  rec("C2 siti: progres tidak berubah", (await evaluate(`__pick('[data-slot="project-info"] [role="progressbar"]').getAttribute("aria-valuenow")`)) === before.progress && before.progress === "45");
  rec("C2 siti: tab Tugas (4) dan tim 4 orang dengan Siti sebagai penanggung jawab tetap utuh", (await textOf('[data-tab="tugas"]')) === "Tugas (4)" && (await (async () => { await selectTab("tim"); return same(await teamIds(), P1_TEAM) && (await textOf('[data-slot="project-team-row"][data-user-id="u-002"]')).includes("Penanggung jawab"); })()));
  const ids = await clientToList();
  const t = await rowText("p-001");
  const t2 = await rowText("p-002");
  rec("C2 siti: daftar memuat perubahan p-001 (klien, Tertunda) dan p-002 tidak berubah", same(ids, ["p-001", "p-002"]) && t.includes("PT. Klien Baru Siti") && t.includes("Tertunda") && t2.includes("CV. Jaya Abadi Logistics") && t2.includes("Berjalan"), `${t} | ${t2}`);
}

// =====================================================================================
// F. Responsif: 768 dan 375 (mobile + sentuhan)
// =====================================================================================
await setViewport({ width: 768, height: 900 });
await openList(ID.budi);
await openDialog("create", '[data-action="create-project"]');
await checkOverflow("dialog tambah 768");
await checkAxe("dialog tambah 768");
await shot("tambah-dialog-768");
await closeDialogWithEsc("create");
await clickEl('[data-slot="project-cards"] a[href="/proyek/p-001"]');
await detailReady();
await openDialog("blocked", '[data-action="delete-project"]');
await checkOverflow("hapus ditolak 768");
await checkAxe("hapus ditolak 768");
await shot("hapus-ditolak-768");
await pressKey("Escape");
await waitGone(DLG.blocked, "tertutup");
await checkOverflow("detail owner 768");

await setViewport({ width: 375, height: 800, mobile: true, touch: true });
await openList(ID.budi);
rec("F375 emulasi sentuh aktif", (await evaluate(`navigator.maxTouchPoints`)) > 0 && (await evaluate(`innerWidth`)) === 375);
{
  const geoBtn = await evaluate(`(() => { const r = __pick('[data-action="create-project"]').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })()`);
  rec("F375 owner: tombol Tambah proyek >= 44x44px", geoBtn.w >= 44 && geoBtn.h >= 44, JSON.stringify(geoBtn));
  await shot("daftar-owner-375");
  await openDialog("create", '[data-action="create-project"]', true);
  const geo = await evaluate(`(() => {
    const dlg = __pick('[data-dialog="project-create"]');
    const items = [...dlg.querySelectorAll("input, select, textarea, button")].filter((e) => e.checkVisibility());
    const box = (e) => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
    const dr = dlg.getBoundingClientRect();
    return {
      controls: items.map((e) => ({ id: e.id || e.getAttribute("aria-label") || e.textContent.trim(), tag: e.tagName, font: parseFloat(getComputedStyle(e).fontSize), ...box(e) })),
      dialog: { left: Math.round(dr.left), right: Math.round(dr.right), height: Math.round(dr.height) },
      scrollable: dlg.scrollHeight > dlg.clientHeight,
    };
  })()`);
  results.measurements["geo dialog tambah 375"] = geo;
  const small = geo.controls.filter((c) => c.h < 44 || c.w < 44);
  rec("F375 dialog tambah: semua kontrol dan tombol (termasuk X Tutup) >= 44x44px", small.length === 0, JSON.stringify(small));
  const smallFont = geo.controls.filter((c) => ["INPUT", "SELECT", "TEXTAREA"].includes(c.tag) && c.font < 16);
  rec("F375 dialog tambah: font input/select/textarea >= 16px (tanpa zoom otomatis iOS)", smallFont.length === 0, JSON.stringify(smallFont));
  rec("F375 dialog tambah: dialog muat di lebar layar dan dapat digulir di dalam dialog", geo.dialog.left >= 0 && geo.dialog.right <= 375 && geo.dialog.height <= 800);
  await checkOverflow("dialog tambah 375");
  await checkAxe("dialog tambah 375 mobile");
  await shot("tambah-dialog-375-atas");
  await evaluate(`__pick('[data-dialog="project-create"]').scrollTo(0, 99999)`);
  await sleep(150);
  await shot("tambah-dialog-375-bawah");
  // selesaikan alur dengan sentuhan
  await evaluate(`__pick('[data-dialog="project-create"]').scrollTo(0, 0)`);
  await fillForm({ name: "Proyek Uji Mobile", client: "PT Mobile" });
  await tap(submitSel);
  await waitFor(() => evaluate(`location.pathname.startsWith("/proyek/p-006")`), 20000, "navigasi mobile");
  await detailReady();
  rec("F375 owner: alur tambah proyek selesai dengan sentuhan (PRJ-006), pesan sukses tampil", (await header()).eyebrow === "PRJ-006" && (await textOf('[data-slot="created-notice"]')) === "Proyek PRJ-006 berhasil ditambahkan (simulasi).");
  const geoDetail = await evaluate(`(() => ({ actions: [...document.querySelectorAll('[data-slot="page-header"] button')].filter((b) => b.checkVisibility()).map((b) => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) }; }), close: (() => { const r = __pick('[data-slot="created-notice"] button').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })() }))()`);
  rec("F375 detail: tombol Ubah/Hapus proyek dan Tutup pesan >= 44x44px", geoDetail.actions.length === 2 && geoDetail.actions.every((a) => a.w >= 44 && a.h >= 44) && geoDetail.close.w >= 44 && geoDetail.close.h >= 44, JSON.stringify(geoDetail));
  await checkOverflow("detail owner 375");
  await checkAxe("detail owner dengan aksi 375 mobile");
  await shot("detail-owner-375");
  await openDialog("edit", '[data-action="edit-project"]', true);
  const smallEdit = await evaluate(`[...document.querySelectorAll('[data-dialog="project-edit"] input, [data-dialog="project-edit"] select, [data-dialog="project-edit"] textarea, [data-dialog="project-edit"] button')].filter((e) => e.checkVisibility()).map((e) => { const r = e.getBoundingClientRect(); return { id: e.id || e.getAttribute("aria-label") || e.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((c) => c.w < 44 || c.h < 44)`);
  rec("F375 dialog ubah: semua kontrol >= 44x44px", smallEdit.length === 0, JSON.stringify(smallEdit));
  await checkAxe("dialog ubah 375 mobile");
  await shot("ubah-dialog-375");
  await pressKey("Escape");
  await waitGone(DLG.edit, "dialog ubah tertutup");
  // hapus proyek baru lewat sentuhan
  await openDialog("confirm", '[data-action="delete-project"]', true);
  const geoConfirm = await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].filter((e) => e.checkVisibility()).map((e) => { const r = e.getBoundingClientRect(); return { t: e.getAttribute("aria-label") ?? e.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) }; })`);
  rec("F375 konfirmasi hapus: semua tombol >= 44x44px", geoConfirm.every((b) => b.w >= 44 && b.h >= 44), JSON.stringify(geoConfirm));
  await checkAxe("konfirmasi hapus 375 mobile");
  await shot("hapus-konfirmasi-375");
  await pressKey("Escape");
  await waitGone('[role="dialog"]', "konfirmasi tertutup");
}
await openDetail(ID.budi, "p-001");
await openDialog("blocked", '[data-action="delete-project"]', true);
{
  const geoB = await evaluate(`[...document.querySelectorAll('[data-dialog="project-delete-blocked"] button')].filter((e) => e.checkVisibility()).map((e) => { const r = e.getBoundingClientRect(); return { t: e.getAttribute("aria-label") ?? e.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) }; })`);
  rec("F375 hapus ditolak: tombol Mengerti dan X >= 44x44px", geoB.every((b) => b.w >= 44 && b.h >= 44), JSON.stringify(geoB));
  const titleClash = await evaluate(`(() => { const t = __pick('[data-dialog="project-delete-blocked"] [data-slot="dialog-title"]').getBoundingClientRect(); const x = __pick('[data-dialog="project-delete-blocked"] [aria-label="Tutup"]').getBoundingClientRect(); return t.right > x.left && t.bottom > x.top && t.top < x.bottom; })()`);
  rec("F375 hapus ditolak: judul tidak bertumpuk dengan tombol X", !titleClash);
  await checkAxe("hapus ditolak 375 mobile");
  await shot("hapus-ditolak-375");
  await checkOverflow("hapus ditolak 375");
}
// Admin principal 375: dapat menyelesaikan ubah proyek
await openDetail(ID.siti, "p-002");
await openDialog("edit", '[data-action="edit-project"]', true);
await fillForm({ client: "CV. Jaya Abadi (mobile)" });
await tap(submitSel);
await waitGone(DLG.edit, "dialog ubah siti 375 tertutup", 20000);
rec("F375 siti: ubah proyek p-002 selesai dengan sentuhan", (await info()).includes("CV. Jaya Abadi (mobile)"));
await shot("detail-siti-375");
// Mandor dan Anggota Tim 375: tanpa aksi
for (const [key, pid] of [["ahmad", "p-001"], ["dewi", "p-001"]]) {
  await openDetail(ID[key], pid);
  rec(`F375 ${key}: detail tanpa tombol aksi (Mandor/Anggota Tim tidak CRUD proyek)`, (await detailActions()).length === 0 && (await evaluate(`document.querySelectorAll("[data-action]").length`)) === 0);
  await checkOverflow(`detail ${key} 375`);
  // Diambil di dalam loop: sebelumnya diambil setelah loop sehingga file "ahmad" berisi tampilan Dewi.
  if (key === "ahmad") await shot("detail-ahmad-375");
}
await openList(ID.ahmad);
rec("F375 ahmad: daftar tanpa tombol Tambah proyek", (await actionTexts('[data-slot="project-list"] button')).length === 0);

await evaluate(`sessionStorage.clear()`);
writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
const total = results.checks.length;
console.log(results.failures.length ? `\n${results.failures.length} masalah dari ${total} pemeriksaan.` : `\nSemua ${total} pemeriksaan lolos.`);
cleanup();
process.exit(results.failures.length ? 1 : 0);
