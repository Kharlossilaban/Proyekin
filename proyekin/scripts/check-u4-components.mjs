// Pemeriksaan komponen bersama U4-2 di browser sungguhan (Chrome via CDP) pada halaman /style-guide (dev server).
// Mencakup: ukuran bawaan Input/Button tidak berubah, ukuran touch (>= 44px, font >= 16px), keyboard Tabs / grup
// radio / Select / ConfirmDialog (focus trap, Esc, fokus kembali), emulasi mobile 375px + sentuhan, target sentuh,
// kartu satu kolom, tab bergulir di dalam komponen, overflow 375/768/1280, dan axe (juga saat dialog terbuka).
// Jalankan: npm run check:u4-components [-- <folder-bukti>]
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { createBrowser, sleep, waitFor } from "./lib/cdp.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(process.argv[2] ?? join(ROOT, ".u4-components-check"));
const APP_PORT = 3400;
const BASE = `http://localhost:${APP_PORT}`;
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

const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(APP_PORT)], { cwd: ROOT, stdio: "ignore" });
const browser = await createBrowser({ cdpPort: 9555 });
const { send, evaluate, pressKey, tap, setViewport } = browser;
const cleanup = () => {
  try {
    dev.kill();
  } catch {
    /* sudah berhenti */
  }
  browser.close();
};
process.on("exit", cleanup);
process.on("unhandledRejection", (error) => {
  console.error("GALAT:", error instanceof Error ? error.message : error);
  process.exit(1);
});
await waitFor(async () => (await fetch(`${BASE}/style-guide`)).ok, 120000, "dev server");

const axeSource = readFileSync(join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
const AXE_RUN = `(async () => {
  const r = await axe.run({ exclude: [["nextjs-portal"]] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
  return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => n.target.join(" ") + " :: " + (n.failureSummary || "").split("\\n").slice(0, 2).join(" | ")) }));
})()`;

async function goto(path) {
  await send("Page.navigate", { url: `${BASE}${path}` });
  await waitFor(() => evaluate(`document.readyState === "complete" && !!document.querySelector("h1")`), 90000, `muat ${path}`);
  await evaluate(`document.fonts.ready.then(() => true)`);
  // tunggu hidrasi React (elemen klien memiliki properti __reactFiber)
  await waitFor(() => evaluate(`(() => { const el = document.querySelector('[data-demo="confirm-destructive"]'); return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber")); })()`), 60000, "hidrasi");
  if (!(await evaluate(`typeof window.axe !== "undefined"`))) await evaluate(axeSource);
  await sleep(400);
}
const visible = (sel) => evaluate(`[...document.querySelectorAll(${q(sel)})].filter((e) => e.checkVisibility()).length`);
const active = () =>
  evaluate(`(() => { const a = document.activeElement; const dlg = document.querySelector('[role="dialog"]'); return { tag: a.tagName.toLowerCase(), text: (a.textContent || "").trim().slice(0, 40), role: a.getAttribute("role"), id: a.id, demo: a.getAttribute("data-demo"), inDialog: !!dlg && dlg.contains(a) }; })()`);
const focus = (sel) => evaluate(`document.querySelector(${q(sel)}).focus()`);
const style = (sel, props) => evaluate(`(() => { const el = document.querySelector(${q(sel)}); const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { ${props.map((p) => `${p}: s.${p}`).join(", ")}, height: r.height, width: r.width }; })()`);
const px = (v) => parseFloat(v);
const noOverflow = () => evaluate(`({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth })`);
async function checkOverflow(label) {
  const o = await noOverflow();
  rec(`overflow halaman: ${label}`, o.scrollWidth <= o.innerWidth + 1, `${o.scrollWidth} <= ${o.innerWidth}`);
}
async function checkAxe(label) {
  const v = await evaluate(AXE_RUN);
  results.measurements[`axe ${label}`] = v;
  rec(`axe 0 pelanggaran: ${label}`, v.length === 0, v.map((x) => `${x.id}: ${x.nodes.join("; ")}`).join(" || "));
}
async function shotElement(sel, file) {
  const r = await evaluate(`(() => { const el = document.querySelector(${q(sel)}); el.scrollIntoView({ block: "start" }); const b = el.getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height }; })()`);
  const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: Math.ceil(r.w), height: Math.ceil(r.h), scale: 1 } });
  writeFileSync(join(OUT, `${file}.png`), Buffer.from(s.data, "base64"));
}
async function shotViewport(file) {
  const s = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `${file}.png`), Buffer.from(s.data, "base64"));
}

// ============ A. Desktop 1280 ============
await setViewport({ width: 1280, height: 900 });
await goto("/style-guide");

// A1. ukuran bawaan U1 TIDAK berubah
{
  const input = await style("#f-default", ["fontSize"]);
  rec("regresi: Input bawaan (U1) tinggi 40px, font 14px", Math.round(input.height) === 40 && px(input.fontSize) === 14, `${input.height}px / ${input.fontSize}`);
  const btn = await evaluate(`(() => { const out = {}; for (const t of ["Kecil", "Sedang", "Besar"]) { const b = [...document.querySelectorAll("#tombol button")].find((x) => x.textContent.trim() === t); const r = b.getBoundingClientRect(); out[t] = { h: r.height, fs: getComputedStyle(b).fontSize }; } const i = document.querySelector('#tombol button[aria-label="Tambah"]').getBoundingClientRect(); out.icon = { h: i.height, w: i.width }; return out; })()`);
  rec("regresi: Button sm/md/lg/icon tetap 36/40/48/40px", btn.Kecil.h === 36 && btn.Sedang.h === 40 && btn.Besar.h === 48 && btn.icon.h === 40 && btn.icon.w === 40, JSON.stringify(btn));
  rec("regresi: font Button sm/md 14px dan lg 16px (tidak berubah)", btn.Kecil.fs === "14px" && btn.Sedang.fs === "14px" && btn.Besar.fs === "16px", JSON.stringify([btn.Kecil.fs, btn.Sedang.fs, btn.Besar.fs]));
  const d = {
    input: await style("#tc-d-input", ["fontSize"]),
    select: await style("#tc-d-select", ["fontSize"]),
    textarea: await style("#tc-d-textarea", ["fontSize"]),
    button: await style('[data-demo="default"] button', ["fontSize"]),
  };
  rec("regresi: kontrol default di demo: Input/Select 40px & 14px, Textarea min 80px & 14px, Button 40px", Math.round(d.input.height) === 40 && Math.round(d.select.height) === 40 && d.textarea.height >= 80 && [d.input, d.select, d.textarea, d.button].every((x) => px(x.fontSize) === 14) && Math.round(d.button.height) === 40, JSON.stringify(d));
  results.measurements.defaultSizes = { input, btn, d };
}

// A2. ukuran touch
{
  const t = {
    input: await style("#tc-t-input", ["fontSize"]),
    select: await style("#tc-t-select", ["fontSize"]),
    textarea: await style("#tc-t-textarea", ["fontSize"]),
    button: await style('[data-demo="touch"] button', ["fontSize"]),
  };
  rec("touch: Input/Select/Textarea tinggi >= 44px dan font >= 16px", [t.input, t.select, t.textarea].every((x) => x.height >= 44 && px(x.fontSize) >= 16), JSON.stringify([t.input, t.select, t.textarea].map((x) => [x.height, x.fontSize])));
  rec("touch: Button tinggi >= 44px dan lebar >= 44px", t.button.height >= 44 && t.button.width >= 44, `${t.button.width}x${t.button.height}`);
  results.measurements.touchSizes = t;
}

// A3. keyboard Tabs
{
  await focus('#tabs [role="tab"][aria-selected="true"]');
  const sel = () => evaluate(`document.querySelector('#tabs [role="tab"][aria-selected="true"]').textContent.trim()`);
  const panel = () => evaluate(`[...document.querySelectorAll('#tabs [role="tabpanel"]')].filter((p) => p.checkVisibility()).map((p) => p.textContent.trim())`);
  rec("tabs: tab pertama aktif di awal", (await sel()) === "Ringkasan");
  await pressKey("ArrowRight");
  rec("tabs: ArrowRight memindah dan mengaktifkan tab berikutnya", (await sel()) === "Tugas" && (await panel())[0].includes("Tugas"), await sel());
  await pressKey("End");
  rec("tabs: End ke tab terakhir", (await sel()) === "Contoh tab keenam", await sel());
  await pressKey("Home");
  rec("tabs: Home ke tab pertama", (await sel()) === "Ringkasan", await sel());
  await pressKey("ArrowLeft");
  rec("tabs: ArrowLeft dari tab pertama berputar ke tab terakhir", (await sel()) === "Contoh tab keenam", await sel());
  await pressKey("Tab");
  const a = await active();
  rec("tabs: Tab dari daftar tab masuk ke panel", a.role === "tabpanel", JSON.stringify(a));
}

// A4. keyboard grup radio status
{
  const checked = () => evaluate(`document.querySelector('input[name="demo-status-tugas"]:checked').parentElement.textContent.trim()`);
  const result = () => evaluate(`document.querySelector('[data-demo="radio-result"]').textContent`);
  await focus('input[name="demo-status-tugas"]:checked');
  rec("radio: awal terpilih 'Dalam Progres'", (await checked()).startsWith("Dalam Progres"));
  await pressKey("ArrowDown");
  rec("radio: ArrowDown memilih opsi berikutnya dan memperbarui hasil", (await checked()).startsWith("Selesai") && (await result()).includes("Selesai"), await checked());
  await pressKey("ArrowUp");
  await pressKey("ArrowUp");
  rec("radio: ArrowUp memilih opsi sebelumnya", (await checked()).startsWith("Belum Dimulai") && (await result()).includes("Belum Dimulai"), await checked());
  const grp = await evaluate(`(() => { const f = document.querySelector('[data-slot="radio-card-group"]'); return { tag: f.tagName, legend: f.querySelector("legend")?.textContent, radios: f.querySelectorAll('input[type="radio"]').length }; })()`);
  rec("radio: fieldset + legend + 3 radio native", grp.tag === "FIELDSET" && !!grp.legend && grp.radios === 3, JSON.stringify(grp));
}

// A5. keyboard Select native
{
  await focus("#tc-t-select");
  const val = () => evaluate(`document.querySelector("#tc-t-select").value`);
  rec("select: awal 'b'", (await val()) === "b");
  await pressKey("ArrowDown");
  rec("select: ArrowDown memilih opsi berikutnya", (await val()) === "c", await val());
  await pressKey("ArrowUp");
  await pressKey("ArrowUp");
  rec("select: ArrowUp memilih opsi sebelumnya", (await val()) === "a", await val());
  const lab = await evaluate(`!!document.querySelector('label[for="tc-t-select"]')`);
  rec("select: terhubung dengan label", lab);
}

// A6. keyboard ConfirmDialog (destruktif)
{
  const TRIGGER = '[data-demo="confirm-destructive"]';
  await focus(TRIGGER);
  await pressKey("Enter");
  await waitFor(() => visible('[role="dialog"]'), 5000, "dialog terbuka");
  await sleep(300);
  let a = await active();
  rec("confirm: Enter pada pemicu membuka dialog; fokus awal di 'Batal' (aksi destruktif)", a.inDialog && a.text === "Batal", JSON.stringify(a));
  const meta = await evaluate(`(() => { const d = document.querySelector('[role="dialog"]'); return { title: d.querySelector('[data-slot="dialog-title"]')?.textContent, confirm: [...d.querySelectorAll("button")].map((b) => b.textContent.trim()) }; })()`);
  rec("confirm: judul dan teks aksi destruktif jelas", meta.title === "Hapus item contoh?" && meta.confirm.includes("Ya, hapus item contoh"), JSON.stringify(meta));
  // Jeda singkat setelah tiap Tab: pengalih fokus (focus guard) Base UI memindahkan fokus secara asinkron.
  const trail = [];
  let escaped = false;
  for (let i = 0; i < 8; i++) {
    await pressKey("Tab");
    await sleep(80);
    const cur = await active();
    trail.push(cur.text || cur.tag);
    if (!cur.inDialog) escaped = true;
  }
  rec("confirm: focus trap — 8x Tab tidak keluar dari dialog", !escaped, trail.join(" > "));
  const trailBack = [];
  let shiftEscaped = false;
  for (let i = 0; i < 4; i++) {
    await pressKey("Tab", { modifiers: 8 });
    await sleep(80);
    const cur = await active();
    trailBack.push(cur.text || cur.tag);
    if (!cur.inDialog) shiftEscaped = true;
  }
  rec("confirm: focus trap — Shift+Tab tidak keluar dari dialog", !shiftEscaped, trailBack.join(" > "));
  await checkAxe("1280 dengan ConfirmDialog terbuka");
  await shotViewport("confirm-dialog-1280");
  await pressKey("Escape");
  await waitFor(async () => (await visible('[role="dialog"]')) === 0, 5000, "dialog tertutup");
  await sleep(300);
  a = await active();
  rec("confirm: Esc menutup dialog dan fokus kembali ke pemicu", a.demo === "confirm-destructive", JSON.stringify(a));

  await pressKey("Enter");
  await waitFor(() => visible('[role="dialog"]'), 5000, "dialog terbuka lagi");
  await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.trim() === "Batal").click()`);
  await waitFor(async () => (await visible('[role="dialog"]')) === 0, 5000, "dialog tertutup (Batal)");
  await sleep(300);
  a = await active();
  rec("confirm: tombol Batal menutup dialog tanpa aksi dan fokus kembali ke pemicu", a.demo === "confirm-destructive" && (await evaluate(`document.querySelector('[data-demo="confirm-result"]').textContent`)) === "Belum ada aksi.", JSON.stringify(a));

  await pressKey("Enter");
  await waitFor(() => visible('[role="dialog"]'), 5000, "dialog terbuka (konfirmasi)");
  await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.includes("Ya, hapus item contoh")).click()`);
  await sleep(250);
  const busy = await evaluate(`(() => { const bs = [...document.querySelectorAll('[role="dialog"] button')]; const c = bs.find((b) => b.textContent.includes("Ya, hapus item contoh")); const cancel = bs.find((b) => b.textContent.trim() === "Batal"); return { busy: c.getAttribute("aria-busy"), cancelDisabled: cancel.hasAttribute("disabled") || cancel.getAttribute("data-disabled") !== null, closeBtn: !!document.querySelector('[role="dialog"] [aria-label="Tutup"]') }; })()`);
  rec("confirm: saat memproses tombol dikunci (aria-busy, Batal nonaktif, tombol X hilang)", busy.busy === "true" && busy.cancelDisabled && !busy.closeBtn, JSON.stringify(busy));
  await pressKey("Escape");
  await sleep(150);
  rec("confirm: Esc tidak menutup dialog saat memproses", (await visible('[role="dialog"]')) === 1);
  await waitFor(async () => (await visible('[role="dialog"]')) === 0, 8000, "dialog tertutup setelah konfirmasi");
  await sleep(300);
  a = await active();
  const res = await evaluate(`document.querySelector('[data-demo="confirm-result"]').textContent`);
  rec("confirm: konfirmasi menutup dialog, hasil menyebut simulasi tanpa perubahan data, fokus kembali ke pemicu", res.includes("(simulasi)") && res.includes("Tidak ada data yang berubah") && a.demo === "confirm-destructive", `${res} | ${JSON.stringify(a)}`);

  // varian non-destruktif
  await focus('[data-demo="confirm-neutral"]');
  await pressKey("Enter");
  await waitFor(() => visible('[role="dialog"]'), 5000, "dialog non-destruktif");
  await waitFor(async () => (await active()).inDialog, 2000, "fokus pindah ke dalam dialog").catch(() => {});
  const nd = await evaluate(`(() => { const d = document.querySelector('[role="dialog"]'); const c = [...d.querySelectorAll("button")].find((b) => b.textContent.includes("Ya, kirim contoh")); return { inDialog: d.contains(document.activeElement), primaryClass: c.className.includes("bg-primary") && !c.className.includes("bg-destructive") }; })()`);
  rec("confirm: varian non-destruktif memakai tombol utama (bukan merah) dan fokus di dalam dialog", nd.inDialog && nd.primaryClass, JSON.stringify(nd));
  await pressKey("Escape");
  await waitFor(async () => (await visible('[role="dialog"]')) === 0, 5000, "dialog non-destruktif tertutup");
}

// A7. axe + overflow 1280, tangkapan layar
await checkAxe("1280 halaman style-guide");
await checkOverflow("1280");
for (const [sel, name] of [["#kontrol-sentuh", "kontrol-sentuh"], ["#pola-halaman", "pola-halaman"], ["#pola-mobile", "pola-mobile"], ["#tabs", "tabs"]]) await shotElement(sel, `${name}-1280`);

// ============ B. Tablet 768 ============
await setViewport({ width: 768, height: 1024 });
await goto("/style-guide");
await checkOverflow("768");
await checkAxe("768 halaman style-guide");
await shotElement("#pola-halaman", "pola-halaman-768");

// ============ C. Mobile 375 (mobile:true + emulasi sentuh) ============
await setViewport({ width: 375, height: 800, mobile: true, touch: true });
await goto("/style-guide");
rec("mobile: emulasi sentuh aktif (maxTouchPoints > 0)", (await evaluate(`navigator.maxTouchPoints`)) > 0, String(await evaluate(`navigator.maxTouchPoints`)));
rec("mobile: lebar viewport 375px", (await evaluate(`window.innerWidth`)) === 375, String(await evaluate(`window.innerWidth`)));
await checkOverflow("375 (mobile)");
await checkAxe("375 mobile halaman style-guide");

// C1. target sentuh >= 44x44, font input >= 16px
const MEASURE = (region) => `(() => { const root = document.querySelector(${q(region)}); const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="tab"]'; return [...root.querySelectorAll(sel)].filter((e) => e.checkVisibility()).map((e) => { const card = e.tagName === "A" ? e.closest('[data-slot="task-card"]') : null; const host = card ?? e; const r = host.getBoundingClientRect(); return { tag: e.tagName.toLowerCase() + (e.type ? ":" + e.type : ""), name: (e.getAttribute("aria-label") || e.textContent || e.id || "").trim().slice(0, 36), viaCard: !!card, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }; }); })()`;
const REGIONS = ['#kontrol-sentuh [data-demo="touch"]', "#tabs", "#konfirmasi", "#pola-mobile"];
results.measurements.touchTargets = {};
for (const region of REGIONS) {
  const items = await evaluate(MEASURE(region));
  results.measurements.touchTargets[region] = items;
  const small = items.filter((i) => i.w < 44 || i.h < 44);
  rec(`target sentuh >= 44x44px di ${region} (${items.length} kontrol)`, items.length > 0 && small.length === 0, small.map((s) => `${s.name} ${s.w}x${s.h}`).join("; "));
}
{
  const fonts = await evaluate(`[...document.querySelectorAll('#kontrol-sentuh [data-demo="touch"] input, #kontrol-sentuh [data-demo="touch"] select, #kontrol-sentuh [data-demo="touch"] textarea')].map((e) => ({ id: e.id, fs: parseFloat(getComputedStyle(e).fontSize) }))`);
  results.measurements.touchFonts = fonts;
  rec("mobile: font input/select/textarea touch >= 16px", fonts.length === 3 && fonts.every((f) => f.fs >= 16), JSON.stringify(fonts));
  const gaps = await evaluate(`(() => { const labels = [...document.querySelectorAll('[data-slot="radio-card"]')].map((l) => l.getBoundingClientRect()); return labels.slice(1).map((r, i) => Math.round((r.top - labels[i].bottom) * 10) / 10); })()`);
  rec("mobile: jarak antar pilihan radio >= 8px", gaps.length === 2 && gaps.every((g) => g >= 8), JSON.stringify(gaps));
  const btnGap = await evaluate(`(() => { const bs = [...document.querySelectorAll('#kontrol-sentuh [data-demo="touch"] button')].map((b) => b.getBoundingClientRect()); return Math.round((bs[1].left - bs[0].right) * 10) / 10; })()`);
  rec("mobile: jarak antar tombol touch >= 8px", btnGap >= 8, `${btnGap}px`);
  const hoverOnly = await evaluate(`[...document.querySelectorAll('#kontrol-sentuh, #tabs, #konfirmasi, #pola-mobile')].some((r) => r.querySelector('[class*="group-hover"], [class*="peer-hover"]'))`);
  rec("mobile: tidak ada kontrol penting yang bergantung pada hover (group/peer-hover)", !hoverOnly);
}

// C2. kartu tugas satu kolom
{
  const cards = await evaluate(`[...document.querySelectorAll('[data-demo="task-card-list"] [data-slot="task-card"]')].map((c) => { const r = c.getBoundingClientRect(); return { l: Math.round(r.left), w: Math.round(r.width), t: Math.round(r.top + scrollY) }; })`);
  results.measurements.taskCards = cards;
  rec("mobile: 3 kartu tugas satu kolom (kiri dan lebar sama, bertumpuk ke bawah, tidak melebihi viewport)", cards.length === 3 && cards.every((c) => c.l === cards[0].l && c.w === cards[0].w && c.l + c.w <= 375) && cards[1].t > cards[0].t && cards[2].t > cards[1].t, JSON.stringify(cards));
  const content = await evaluate(`(() => { const c = document.querySelector('[data-demo="task-card-list"] [data-slot="task-card"]'); return { badges: c.querySelectorAll('[data-slot="badge"], [data-slot="deadline-badge"]').length, progress: !!c.querySelector('[role="progressbar"]'), deadline: c.querySelector('[data-slot="deadline-badge"]')?.textContent }; })()`);
  rec("mobile: kartu memuat status, prioritas, tenggat (acuan demo), dan progres", content.badges >= 3 && content.progress && /Terlambat|Mendatang/.test(content.deadline ?? ""), JSON.stringify(content));
}

// C3. tab bergulir di dalam komponen
{
  const sc = await evaluate(`(() => { const s = document.querySelector('#tabs [data-slot="tabs-scroll"]'); return { scrollWidth: s.scrollWidth, clientWidth: s.clientWidth }; })()`);
  rec("mobile: daftar tab lebih lebar dari kotaknya (bergulir di dalam komponen)", sc.scrollWidth > sc.clientWidth, JSON.stringify(sc));
  await tap('#tabs [role="tab"]:last-of-type');
  await sleep(300);
  const after = await evaluate(`({ selected: document.querySelector('#tabs [role="tab"][aria-selected="true"]').textContent.trim(), pageScrollX: window.scrollX, docOverflow: document.documentElement.scrollWidth > window.innerWidth + 1, tabsScroll: document.querySelector('#tabs [data-slot="tabs-scroll"]').scrollLeft })`);
  rec("mobile: ketuk tab terakhir mengaktifkannya; halaman tidak bergeser/overflow", after.selected === "Contoh tab keenam" && after.pageScrollX === 0 && !after.docOverflow, JSON.stringify(after));
  await tap('#tabs [role="tab"]:first-of-type');
  await sleep(200);
}

// C4. sentuhan pada grup radio
{
  await tap('[data-demo="radio-pattern"] [data-slot="radio-card"]:nth-of-type(3)');
  await sleep(200);
  const r = await evaluate(`({ checked: document.querySelector('input[name="demo-status-tugas"]:checked').parentElement.textContent.trim(), out: document.querySelector('[data-demo="radio-result"]').textContent })`);
  rec("mobile: ketuk kartu radio 'Selesai' memilihnya (sentuhan)", r.checked.startsWith("Selesai") && r.out.includes("Selesai"), JSON.stringify(r));
  await tap('[data-demo="radio-pattern"] [data-slot="radio-card"]:nth-of-type(1)');
  await sleep(200);
  rec("mobile: ketuk kartu radio 'Belum Dimulai' memilihnya", (await evaluate(`document.querySelector('input[name="demo-status-tugas"]:checked').parentElement.textContent.trim()`)).startsWith("Belum Dimulai"));
}

// C5. sentuhan pada kontrol touch
{
  await tap("#tc-t-input");
  await sleep(150);
  rec("mobile: ketuk Input touch memfokuskannya", (await active()).id === "tc-t-input");
  await browser.insertText("Teks sentuh");
  rec("mobile: teks dapat diketik ke Input touch", (await evaluate(`document.querySelector("#tc-t-input").value`)) === "Teks sentuh");
  await tap("#tc-t-select");
  await sleep(150);
  rec("mobile: ketuk Select touch memfokuskannya", (await active()).id === "tc-t-select");
  await pressKey("Escape");
}

// C6. sentuhan pada ConfirmDialog
{
  await tap('[data-demo="confirm-destructive"]');
  await waitFor(() => visible('[role="dialog"]'), 5000, "dialog terbuka (sentuh)");
  await sleep(350);
  const geo = await evaluate(`(() => { const d = document.querySelector('[role="dialog"]'); const r = d.getBoundingClientRect(); const bs = [...d.querySelectorAll('[data-slot="dialog-footer"] button')].map((b) => { const x = b.getBoundingClientRect(); return { t: b.textContent.trim(), w: Math.round(x.width), h: Math.round(x.height), l: Math.round(x.left) }; }); return { left: Math.round(r.left), right: Math.round(r.right), vw: innerWidth, bs }; })()`);
  results.measurements.dialogMobile = geo;
  rec("mobile: dialog di dalam viewport; tombol menumpuk, lebar penuh, tinggi >= 44px", geo.left >= 0 && geo.right <= geo.vw && geo.bs.length === 2 && geo.bs.every((b) => b.h >= 44 && b.w >= 44 && b.l === geo.bs[0].l && b.w === geo.bs[0].w), JSON.stringify(geo));
  await checkAxe("375 mobile dengan ConfirmDialog terbuka");
  await shotViewport("confirm-dialog-375");
  const resultBefore = await evaluate(`document.querySelector('[data-demo="confirm-result"]').textContent`);
  await tap('[role="dialog"] [data-slot="dialog-footer"] button:first-child');
  await waitFor(async () => (await visible('[role="dialog"]')) === 0, 5000, "dialog tertutup (sentuh Batal)");
  const afterCancel = await active();
  results.measurements.focusAfterTouchCancel = afterCancel;
  const resultAfter = await evaluate(`document.querySelector('[data-demo="confirm-result"]').textContent`);
  rec("mobile: ketuk 'Batal' menutup dialog tanpa menjalankan aksi (teks hasil tidak berubah)", resultAfter === resultBefore, `${JSON.stringify(resultBefore)} → ${JSON.stringify(resultAfter)}`);
  rec("mobile: setelah ketuk 'Batal' fokus kembali ke pemicu", afterCancel.demo === "confirm-destructive", JSON.stringify(afterCancel));
  await tap('[data-demo="confirm-destructive"]');
  await waitFor(() => visible('[role="dialog"]'), 5000, "dialog terbuka (sentuh) kedua");
  await sleep(300);
  await tap('[role="dialog"] [data-slot="dialog-footer"] button:last-child');
  await waitFor(async () => (await visible('[role="dialog"]')) === 0, 8000, "dialog tertutup (sentuh Konfirmasi)");
  const res = await evaluate(`document.querySelector('[data-demo="confirm-result"]').textContent`);
  rec("mobile: ketuk konfirmasi menutup dialog dan menampilkan hasil simulasi", res.includes("(simulasi)"), res);
}
await checkOverflow("375 (mobile) setelah semua interaksi");

for (const [sel, name] of [["#kontrol-sentuh", "kontrol-sentuh"], ["#tabs", "tabs"], ["#konfirmasi", "konfirmasi"], ["#pola-halaman", "pola-halaman"], ["#pola-mobile", "pola-mobile"]]) await shotElement(sel, `${name}-375`);

writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
const total = results.checks.length;
console.log(results.failures.length ? `\n${results.failures.length} masalah dari ${total} pemeriksaan.` : `\nSemua ${total} pemeriksaan lolos.`);
cleanup();
process.exit(results.failures.length ? 1 : 0);
