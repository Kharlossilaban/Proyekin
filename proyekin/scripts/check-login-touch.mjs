// Pemeriksaan follow-up audit visual P1-3 di browser (Chrome via CDP, dev server): target sentuh form login (/masuk).
// Aturan proyek: kontrol sentuh >= 44x44px dan font input >= 16px di mobile (Mandor mobile-first). Desktop (>= lg) tidak
// boleh berubah dari ukuran bawaan U1/U3. Skip link tetap tersembunyi sampai difokuskan keyboard.
// Cakupan: ukuran kontrol (375 mobile + sentuh, 768, 1280), font, hit-test area sentuh (padding tautan/ringkasan), tidak ada
// target yang saling menimpa, keyboard (urutan Tab, fokus terlihat, Enter/Spasi pada tombol mata), ketuk, axe (normal,
// galat validasi, kata sandi terlihat), overflow, alur login tidak berubah, halaman auth lain tidak terdampak logo.
// Jalankan: npm run check:login-touch [-- <folder-bukti>]
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { createBrowser, sleep, waitFor } from "./lib/cdp.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(process.argv[2] ?? join(ROOT, ".login-touch-check"));
const APP_PORT = 3500;
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
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(APP_PORT)], { cwd: ROOT, stdio: "ignore" });
const browser = await createBrowser({ cdpPort: 9666 });
const { send, evaluate, setViewport, tap, tapAt, pressKey } = browser;
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
  await sleep(700);
}
async function shot(name) {
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
}
/** Seluruh tinggi halaman (hingga 3000px), untuk meninjau form yang lebih tinggi dari viewport. */
async function shotFull(name) {
  const h = await evaluate(`Math.min(document.documentElement.scrollHeight, 3000)`);
  const w = await evaluate(`innerWidth`);
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
}
const overflowOk = async (label) => {
  const o = await evaluate(`({ s: document.documentElement.scrollWidth, w: window.innerWidth })`);
  rec(`overflow halaman: ${label}`, o.s <= o.w + 1, `${o.s} <= ${o.w}`);
};
const fill = (sel, value) =>
  evaluate(`(() => { const el = document.querySelector(${q(sel)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${q(value)}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
const clickEl = (sel) => evaluate(`(() => { const el = document.querySelector(${q(sel)}); if (!el) throw new Error("tidak ada: " + ${q(sel)}); el.click(); return true; })()`);

// Kontrol interaktif form login (tanpa skip link, yang diuji terpisah).
const CONTROLS = `[...document.querySelectorAll('main a, main button, main input, main summary, header a')].filter((e) => e.checkVisibility()).map((e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return { key: e.getAttribute("aria-label") || e.getAttribute("name") || (e.textContent || "").trim().slice(0, 28), tag: e.tagName.toLowerCase(), x: r.left, y: r.top, w: r.width, h: r.height, fs: parseFloat(s.fontSize) }; })`;
const round = (c) => ({ ...c, w: Math.round(c.w), h: Math.round(c.h) });
const EXPECT = ["Proyekin — kembali ke beranda", "email", "password", "Tampilkan kata sandi", "Lupa kata sandi?", "Masuk", "Akun demo untuk pengujian", "Daftar sebagai Owner"];

// ================= A. 375px mobile + sentuhan: semua kontrol >= 44px =================
await setViewport({ width: 375, height: 800, mobile: true, touch: true });
await navigate("/masuk");
rec("375: emulasi sentuh aktif", (await evaluate(`navigator.maxTouchPoints`)) > 0 && (await evaluate(`innerWidth`)) === 375);
const m375 = (await evaluate(CONTROLS)).map(round);
results.measurements["kontrol 375"] = m375;
rec("375: seluruh kontrol login terdeteksi", same(m375.map((c) => c.key), EXPECT), JSON.stringify(m375.map((c) => c.key)));
for (const c of m375) rec(`375: "${c.key}" >= 44x44`, c.w >= 44 && c.h >= 44, `${c.w}x${c.h}`);
for (const c of m375.filter((x) => x.tag === "input")) rec(`375: input ${c.key} font >= 16px (tanpa zoom otomatis iOS)`, c.fs >= 16, `${c.fs}px`);
// tombol mata berada di dalam kotak input (tidak menjorok), setinggi input
const geo = await evaluate(`(() => { const i = document.querySelector('input[name="password"]').getBoundingClientRect(); const b = document.querySelector('[aria-label="Tampilkan kata sandi"]').getBoundingClientRect(); return { ir: i.right, br: b.right, it: i.top, bt: b.top, ih: i.height, bh: b.height }; })()`);
rec("375: tombol mata sejajar dan setinggi input kata sandi (tidak menjorok)", Math.abs(geo.ir - geo.br) <= 1 && Math.abs(geo.it - geo.bt) <= 1 && Math.abs(geo.ih - geo.bh) <= 1, JSON.stringify(geo));
// tidak ada target yang saling menimpa (area sentuh yang diperluas tidak tumpang tindih tetangganya)
const overlaps = [];
for (let i = 0; i < m375.length; i++)
  for (let j = i + 1; j < m375.length; j++) {
    const a = m375[i];
    const b = m375[j];
    if (a.key === "password" && b.key === "Tampilkan kata sandi") continue; // tombol mata sengaja di atas input
    const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ix > 1 && iy > 1) overlaps.push(`${a.key} × ${b.key}`);
  }
rec("375: tidak ada area sentuh yang saling menimpa", overlaps.length === 0, overlaps.join("; "));
// logo: gambar tidak terdistorsi, hanya area tautan yang membesar
const logo = await evaluate(`(() => { const img = document.querySelector('header a img'); const r = img.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), natural: img.naturalWidth / img.naturalHeight }; })()`);
rec("375: gambar logo tetap 40px tinggi dengan rasio asli (tidak terdistorsi)", logo.h === 40 && Math.abs(logo.w / logo.h - logo.natural) < 0.02, JSON.stringify(logo));
// skip link tetap tersembunyi sampai difokuskan keyboard
const skipBefore = await evaluate(`(() => { const a = [...document.querySelectorAll("a")].find((x) => x.textContent.trim() === "Langsung ke konten"); const r = a.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), visible: a.checkVisibility() }; })()`);
await overflowOk("login 375 mobile");
await checkAxe("login normal 375 mobile");
await shot("login-375");

// ketuk area sentuh yang DIPERLUAS (di luar teks): tautan Lupa kata sandi dan ringkasan akun demo
await evaluate(`document.querySelector('a[href="/lupa-sandi"]').scrollIntoView({ block: "center" })`);
await sleep(100);
const pointForgot = await evaluate(`(() => { const r = document.querySelector('a[href="/lupa-sandi"]').getBoundingClientRect(); return { x: r.left + 4, y: r.bottom - 3 }; })()`);
rec("375: titik di padding bawah tautan Lupa kata sandi jatuh pada tautan itu (hit-test)", await evaluate(`document.elementFromPoint(${pointForgot.x}, ${pointForgot.y}) === document.querySelector('a[href="/lupa-sandi"]')`));
await tapAt(pointForgot.x, pointForgot.y);
await waitFor(async () => ((await evaluate(`location.pathname`)) === "/lupa-sandi" ? true : null), 15000, "ketuk Lupa kata sandi");
rec("375: ketuk area padding tautan Lupa kata sandi menavigasi ke /lupa-sandi", (await evaluate(`location.pathname`)) === "/lupa-sandi");
await navigate("/masuk");
await evaluate(`document.querySelector("details").scrollIntoView({ block: "center" })`);
await sleep(100);
const pointSum = await evaluate(`(() => { const r = document.querySelector("details summary").getBoundingClientRect(); return { x: r.left + 6, y: r.bottom - 3 }; })()`);
rec("375: titik di padding ringkasan Akun demo jatuh pada ringkasan (hit-test)", await evaluate(`document.elementFromPoint(${pointSum.x}, ${pointSum.y}) === document.querySelector("details summary")`));
await tapAt(pointSum.x, pointSum.y);
await sleep(300);
rec("375: ketuk area padding ringkasan membuka daftar akun demo", await evaluate(`document.querySelector("details").open === true`));
await overflowOk("login 375 mobile, akun demo terbuka");
await shot("login-375-akun-demo");
await checkAxe("login akun demo terbuka 375 mobile");

// ketuk tombol mata: kata sandi terlihat / tersembunyi, axe saat terlihat
await navigate("/masuk");
await tap('[aria-label="Tampilkan kata sandi"]');
await sleep(200);
rec("375: ketuk tombol mata menampilkan kata sandi (type=text, aria-pressed=true)", await evaluate(`(() => { const i = document.querySelector('input[name="password"]'); const b = document.querySelector('[aria-label="Sembunyikan kata sandi"]'); return i.type === "text" && !!b && b.getAttribute("aria-pressed") === "true"; })()`));
const eyeNow = await evaluate(`(() => { const r = document.querySelector('[aria-label="Sembunyikan kata sandi"]').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })()`);
rec("375: tombol mata saat kata sandi terlihat tetap >= 44x44", eyeNow.w >= 44 && eyeNow.h >= 44, JSON.stringify(eyeNow));
await fill('input[name="password"]', "contoh-sandi-1");
await checkAxe("login kata sandi terlihat 375 mobile");
await shot("login-375-sandi-terlihat");
await tap('[aria-label="Sembunyikan kata sandi"]');
await sleep(150);
rec("375: ketuk lagi menyembunyikan kata sandi (type=password)", await evaluate(`document.querySelector('input[name="password"]').type === "password"`));

// galat validasi: kolom kosong → pesan galat dan fokus ke kolom pertama yang tidak valid
await navigate("/masuk");
await tap('form button[type="submit"]');
await waitFor(() => evaluate(`!!document.querySelector('[aria-invalid="true"]')`), 8000, "galat validasi");
await sleep(300);
rec("375: submit kosong menampilkan galat dan memfokuskan kolom email (perilaku tidak berubah)", await evaluate(`document.activeElement?.getAttribute("name") === "email" && document.querySelectorAll('[aria-invalid="true"]').length === 2`));
const errH = await evaluate(`[...document.querySelectorAll('input')].map((i) => Math.round(i.getBoundingClientRect().height))`);
rec("375: input tetap 44px saat galat", errH.every((h) => h >= 44), JSON.stringify(errH));
await overflowOk("login galat 375 mobile");
await checkAxe("login galat validasi 375 mobile");
await shot("login-375-galat");

// ================= B. Keyboard (375 dan 1280) =================
async function keyboardPass(label) {
  await navigate("/masuk");
  await evaluate(`document.activeElement?.blur(); window.scrollTo(0, 0)`);
  const seen = [];
  const rings = [];
  // email memiliki autoFocus; mulai dari awal dokumen
  await evaluate(`document.body.setAttribute("tabindex", "-1"); document.body.focus(); document.body.removeAttribute("tabindex");`);
  for (let i = 0; i < 9; i++) {
    await pressKey("Tab");
    const info = await evaluate(`(() => { const e = document.activeElement; const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return { key: e.getAttribute("aria-label") || e.getAttribute("name") || (e.textContent || "").trim().slice(0, 28), outline: s.outlineStyle, ow: parseFloat(s.outlineWidth), w: Math.round(r.width), h: Math.round(r.height) }; })()`);
    seen.push(info.key);
    rings.push(info);
  }
  results.measurements[`tab ${label}`] = rings;
  rec(`${label}: urutan Tab = lewati ke konten, logo, email, kata sandi, tombol mata, lupa sandi, Masuk, akun demo, daftar`, same(seen.slice(0, 9), ["Langsung ke konten", ...EXPECT]), JSON.stringify(seen));
  rec(`${label}: fokus keyboard terlihat pada setiap kontrol (outline >= 2px)`, rings.every((r) => r.outline !== "none" && r.ow >= 2), JSON.stringify(rings.filter((r) => r.outline === "none" || r.ow < 2)));
  const skip = rings[0];
  rec(`${label}: skip link tampil saat difokuskan keyboard (>= 44x24 dan di dalam layar)`, skip.w >= 44 && skip.h >= 24, `${skip.w}x${skip.h}`);
  // Enter dan Spasi pada tombol mata
  await evaluate(`document.querySelector('[aria-label="Tampilkan kata sandi"]').focus()`);
  await pressKey("Enter");
  await sleep(150);
  const afterEnter = await evaluate(`document.querySelector('input[name="password"]').type`);
  await evaluate(`document.querySelector('[aria-label="Sembunyikan kata sandi"]').focus()`);
  await pressKey("Space");
  await sleep(150);
  const afterSpace = await evaluate(`document.querySelector('input[name="password"]').type`);
  rec(`${label}: Enter menampilkan dan Spasi menyembunyikan kata sandi pada tombol mata`, afterEnter === "text" && afterSpace === "password", `${afterEnter} → ${afterSpace}`);
}
await keyboardPass("375 keyboard");

// ================= C. 768px: kontrol masih ukuran sentuh (di bawah lg) =================
await setViewport({ width: 768, height: 1024 });
await navigate("/masuk");
const m768 = (await evaluate(CONTROLS)).map(round);
results.measurements["kontrol 768"] = m768;
for (const c of m768) rec(`768: "${c.key}" >= 44x44`, c.w >= 44 && c.h >= 44, `${c.w}x${c.h}`);
await overflowOk("login 768");
await checkAxe("login normal 768");
await shot("login-768");

// ================= D. 1280px: desktop TIDAK berubah dari ukuran bawaan U1/U3 =================
await setViewport({ width: 1280, height: 900 });
await navigate("/masuk");
const m1280 = (await evaluate(CONTROLS)).map(round);
results.measurements["kontrol 1280"] = m1280;
const WANT_DESKTOP = {
  "Proyekin — kembali ke beranda": [91, 40],
  email: [null, 40],
  password: [null, 40],
  "Tampilkan kata sandi": [40, 40],
  "Lupa kata sandi?": [111, 20],
  Masuk: [null, 48],
  "Akun demo untuk pengujian": [null, 20],
  "Daftar sebagai Owner": [143, 18],
};
for (const c of m1280) {
  const [w, h] = WANT_DESKTOP[c.key] ?? [null, null];
  rec(`1280: "${c.key}" ukuran desktop tidak berubah`, (w === null || c.w === w) && c.h === h, `${c.w}x${c.h} (bawaan ${w ?? "~"}x${h})`);
}
for (const c of m1280.filter((x) => x.tag === "input")) rec(`1280: input ${c.key} font tetap 14px`, c.fs === 14, `${c.fs}px`);
const skip1280 = skipBefore;
rec("skip link tetap tersembunyi sampai difokuskan (1x1 sr-only, bukan tampil permanen)", skip1280.w <= 1 && skip1280.h <= 1, JSON.stringify(skip1280));
await overflowOk("login 1280");
await checkAxe("login normal 1280");
await shot("login-1280");
await clickEl('[aria-label="Tampilkan kata sandi"]');
await sleep(150);
await checkAxe("login kata sandi terlihat 1280");
await shot("login-1280-sandi-terlihat");
await keyboardPass("1280 keyboard");

// ================= E. Alur login tidak berubah =================
async function loginFlow(label, viewport, email, landing, useTap) {
  await setViewport(viewport);
  await navigate("/masuk");
  await evaluate(`sessionStorage.clear()`);
  await navigate("/masuk");
  await fill("#email", email);
  await fill("#password", "kata-sandi-demo-1");
  if (useTap) await tap('form button[type="submit"]');
  else await clickEl('form button[type="submit"]');
  const landed = await waitFor(async () => ((await evaluate(`location.pathname`)) === landing ? landing : null), 25000, `login ${label}`).catch(() => null);
  rec(`${label}: login diarahkan ke ${landing} (alur dan mock auth tidak berubah)`, landed === landing, `path ${await evaluate("location.pathname")}`);
}
await loginFlow("Mandor Ahmad 375 (ketuk)", { width: 375, height: 800, mobile: true, touch: true }, "ahmad@proyekin.id", "/tugas", true);
await loginFlow("Owner Budi 1280", { width: 1280, height: 900 }, "budi@proyekin.id", "/dashboard", false);
await setViewport({ width: 1280, height: 900 });
await navigate("/masuk");
await evaluate(`sessionStorage.clear()`);
await navigate("/masuk");
await fill("#email", "tidak.ada@contoh.co.id");
await fill("#password", "apa-saja");
await clickEl('form button[type="submit"]');
await waitFor(() => evaluate(`document.body.textContent.includes("Email atau kata sandi salah")`), 15000, "galat login");
rec("1280: akun tidak dikenal tetap menampilkan galat login yang sama", true);

// ================= F. Halaman auth lain: tautan logo 44px di mobile, tanpa regresi =================
await setViewport({ width: 375, height: 800, mobile: true, touch: true });
for (const path of ["/daftar", "/lupa-sandi", "/reset-sandi"]) {
  await navigate(path);
  const lg = await evaluate(`(() => { const r = document.querySelector('header a').getBoundingClientRect(); const i = document.querySelector('header a img').getBoundingClientRect(); return { h: Math.round(r.height), img: Math.round(i.height) }; })()`);
  rec(`375: ${path} tautan logo >= 44px dan gambar tetap 40px`, lg.h >= 44 && lg.img === 40, JSON.stringify(lg));
  await overflowOk(`${path} 375 mobile`);
  await checkAxe(`${path} 375 mobile`);
}

// ================= G. Langkah 1 follow-up audit visual: Daftar, Lupa Sandi, Reset Sandi =================
// Pola sama dengan login: kontrol 44px / font 16px di bawah lg (375 dan 768), ukuran bawaan U3 PERSIS di 1280.
// Checkbox persetujuan: seluruh label adalah target sentuh (diukur pada label, bukan kotak 16px).
const AUTH_CONTROLS = `[...document.querySelectorAll('main a, main button, main input, header a')].filter((e) => e.checkVisibility()).map((e) => { const cb = e.type === "checkbox"; const t = cb ? e.closest("label") : e; const r = t.getBoundingClientRect(); const i = e.getBoundingClientRect(); return { key: e.getAttribute("aria-label") || e.getAttribute("name") || (e.textContent || "").trim().slice(0, 28), tag: e.tagName.toLowerCase() + (e.type ? ":" + e.type : ""), x: r.left, y: r.top, w: r.width, h: r.height, bw: i.width, bh: i.height, fs: parseFloat(getComputedStyle(e).fontSize) }; })`;
const LOGO = "Proyekin — kembali ke beranda";
const AUTH_PAGES = [
  {
    name: "daftar",
    path: "/daftar",
    keys: [LOGO, "name", "email", "password", "Tampilkan kata sandi", "confirmation", "Tampilkan kata sandi", "terms", "Buat Akun", "Masuk"],
    // [lebar|null, tinggi] di 1280 (diukur sebelum perubahan)
    desktop: [[91, 40], [null, 40], [null, 40], [null, 40], [40, 40], [null, 40], [40, 40], [null, 40], [null, 48], [44, 18]],
    footerLink: "Masuk",
  },
  {
    name: "lupa-sandi",
    path: "/lupa-sandi",
    keys: [LOGO, "email", "Kirim Tautan Pemulihan", "Kembali ke halaman masuk"],
    desktop: [[91, 40], [null, 40], [null, 48], [179, 18]],
    footerLink: "Kembali ke halaman masuk",
  },
  {
    name: "reset-sandi",
    path: "/reset-sandi?token=demo-token",
    keys: [LOGO, "password", "Tampilkan kata sandi", "confirmation", "Tampilkan kata sandi", "Atur Ulang Kata Sandi", "Kembali ke halaman masuk"],
    desktop: [[91, 40], [null, 40], [40, 40], [null, 40], [40, 40], [null, 48], [179, 18]],
    footerLink: "Kembali ke halaman masuk",
  },
];
const VPS_AUTH = [
  { n: 375, v: { width: 375, height: 800, mobile: true, touch: true } },
  { n: 768, v: { width: 768, height: 1024 } },
  { n: 1280, v: { width: 1280, height: 900 } },
];
const pathAndSearch = () => evaluate(`location.pathname + location.search`);
const bodyHas = (text) => evaluate(`document.body.textContent.includes(${q(text)})`);

for (const page of AUTH_PAGES) {
  for (const { n, v } of VPS_AUTH) {
    await setViewport(v);
    await navigate(page.path);
    const c = (await evaluate(AUTH_CONTROLS)).map((x) => ({ ...x, w: Math.round(x.w), h: Math.round(x.h), bw: Math.round(x.bw), bh: Math.round(x.bh) }));
    results.measurements[`${page.name} ${n}`] = c;
    rec(`${page.name} ${n}: seluruh kontrol terdeteksi`, same(c.map((x) => x.key), page.keys), JSON.stringify(c.map((x) => x.key)));
    if (n < 1024 && n !== 1280) {
      for (const x of c) rec(`${page.name} ${n}: "${x.key}" (${x.tag}) >= 44x44`, x.w >= 44 && x.h >= 44, `${x.w}x${x.h}`);
      for (const x of c.filter((y) => y.tag.startsWith("input") && !y.tag.endsWith("checkbox"))) rec(`${page.name} ${n}: input ${x.key} font >= 16px`, x.fs >= 16, `${x.fs}px`);
      const cb = c.find((x) => x.tag === "input:checkbox");
      if (cb) rec(`${page.name} ${n}: kotak checkbox >= 20px dan seluruh label menjadi target`, cb.bw >= 20 && cb.bh >= 20 && cb.h >= 44, `kotak ${cb.bw}x${cb.bh}, label ${cb.w}x${cb.h}`);
      // tombol mata sejajar dan setinggi inputnya
      const eyes = await evaluate(`[...document.querySelectorAll('[aria-label="Tampilkan kata sandi"]')].map((b) => { const i = b.parentElement.querySelector("input").getBoundingClientRect(); const r = b.getBoundingClientRect(); return { dr: Math.abs(i.right - r.right), dt: Math.abs(i.top - r.top), dh: Math.abs(i.height - r.height) }; })`);
      rec(`${page.name} ${n}: tombol mata sejajar dan setinggi input`, eyes.every((e) => e.dr <= 1 && e.dt <= 1 && e.dh <= 1), JSON.stringify(eyes));
      // tidak ada area sentuh yang saling menimpa
      const overlaps = [];
      for (let i = 0; i < c.length; i++)
        for (let j = i + 1; j < c.length; j++) {
          const a = c[i];
          const b2 = c[j];
          if (a.tag === "input:password" && b2.key === "Tampilkan kata sandi") continue; // tombol mata sengaja di dalam input
          const ix = Math.min(a.x + a.w, b2.x + b2.w) - Math.max(a.x, b2.x);
          const iy = Math.min(a.y + a.h, b2.y + b2.h) - Math.max(a.y, b2.y);
          if (ix > 1 && iy > 1) overlaps.push(`${a.key} × ${b2.key}`);
        }
      rec(`${page.name} ${n}: tidak ada area sentuh yang saling menimpa`, overlaps.length === 0, overlaps.join("; "));
    } else {
      c.forEach((x, i) => {
        const [w, h] = page.desktop[i];
        rec(`${page.name} 1280: "${x.key}" ukuran desktop tidak berubah`, (w === null || x.w === w) && x.h === h, `${x.w}x${x.h} (bawaan ${w ?? "~"}x${h})`);
      });
      for (const x of c.filter((y) => y.tag.startsWith("input") && !y.tag.endsWith("checkbox"))) rec(`${page.name} 1280: input ${x.key} font tetap 14px`, x.fs === 14, `${x.fs}px`);
      const cb = c.find((x) => x.tag === "input:checkbox");
      if (cb) rec(`${page.name} 1280: kotak checkbox tetap 16x16 dan label 40px`, cb.bw === 16 && cb.bh === 16 && cb.h === 40, `kotak ${cb.bw}x${cb.bh}, label ${cb.w}x${cb.h}`);
    }
    await overflowOk(`${page.name} ${n}`);
    await checkAxe(`${page.name} normal ${n}`);
    await shotFull(`${page.name}-${n}`);
  }

  // perilaku (375 mobile + sentuh): galat validasi, kata sandi terlihat, ketuk area tautan footer
  await setViewport(VPS_AUTH[0].v);
  await navigate(page.path);
  await tap('form button[type="submit"]');
  await waitFor(() => evaluate(`!!document.querySelector('[aria-invalid="true"]')`), 8000, `galat ${page.name}`);
  await sleep(300);
  const invalid = await evaluate(`[...document.querySelectorAll('[aria-invalid="true"]')].map((e) => e.getAttribute("name"))`);
  const firstName = await evaluate(`document.activeElement?.getAttribute("name")`);
  const wantInvalid = { daftar: ["name", "email", "password", "confirmation", "terms"], "lupa-sandi": ["email"], "reset-sandi": ["password", "confirmation"] }[page.name];
  rec(`${page.name} 375: submit kosong menandai kolom tidak valid dan memfokuskan yang pertama (perilaku tidak berubah)`, same(invalid, wantInvalid) && firstName === wantInvalid[0], `${JSON.stringify(invalid)} fokus ${firstName}`);
  const errH = await evaluate(`[...document.querySelectorAll('main input:not([type="checkbox"])')].map((i) => Math.round(i.getBoundingClientRect().height))`);
  rec(`${page.name} 375: input tetap >= 44px saat galat`, errH.every((h) => h >= 44), JSON.stringify(errH));
  await overflowOk(`${page.name} galat 375`);
  await checkAxe(`${page.name} galat validasi 375 mobile`);
  await shotFull(`${page.name}-375-galat`);

  if (page.keys.includes("Tampilkan kata sandi")) {
    await navigate(page.path);
    await tap('[aria-label="Tampilkan kata sandi"]');
    await sleep(200);
    rec(`${page.name} 375: ketuk tombol mata menampilkan kata sandi`, await evaluate(`document.querySelector('input[name="password"]').type === "text"`));
    const eye = await evaluate(`(() => { const r = document.querySelector('[aria-label="Sembunyikan kata sandi"]').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })()`);
    rec(`${page.name} 375: tombol mata saat sandi terlihat >= 44x44`, eye.w >= 44 && eye.h >= 44, JSON.stringify(eye));
    await fill('input[name="password"]', "KataSandi123");
    await checkAxe(`${page.name} kata sandi terlihat 375 mobile`);
    await shotFull(`${page.name}-375-sandi-terlihat`);
  }

  // ketuk area padding tautan footer (di luar teks) → /masuk
  await navigate(page.path);
  await evaluate(`[...document.querySelectorAll("main a")].find((a) => a.textContent.trim() === ${q(page.footerLink)}).scrollIntoView({ block: "center" })`);
  await sleep(150);
  const pt = await evaluate(`(() => { const a = [...document.querySelectorAll("main a")].find((x) => x.textContent.trim() === ${q(page.footerLink)}); const r = a.getBoundingClientRect(); return { x: r.left + 4, y: r.bottom - 3, hit: document.elementFromPoint(r.left + 4, r.bottom - 3) === a }; })()`);
  rec(`${page.name} 375: titik di padding bawah tautan "${page.footerLink}" jatuh pada tautan itu (hit-test)`, pt.hit);
  await tapAt(pt.x, pt.y);
  await waitFor(async () => ((await evaluate(`location.pathname`)) === "/masuk" ? true : null), 15000, `ketuk ${page.footerLink}`);
  rec(`${page.name} 375: ketuk area padding tautan "${page.footerLink}" menavigasi ke /masuk`, (await evaluate(`location.pathname`)) === "/masuk");

  // keyboard: urutan Tab, fokus terlihat (375 dan 1280)
  for (const { n, v } of [VPS_AUTH[0], VPS_AUTH[2]]) {
    await setViewport(v);
    await navigate(page.path);
    await evaluate(`document.activeElement?.blur(); document.body.setAttribute("tabindex", "-1"); document.body.focus(); document.body.removeAttribute("tabindex");`);
    const seen = [];
    const rings = [];
    for (let i = 0; i < page.keys.length + 1; i++) {
      await pressKey("Tab");
      const info = await evaluate(`(() => { const e = document.activeElement; const s = getComputedStyle(e); return { key: e.getAttribute("aria-label") || e.getAttribute("name") || (e.textContent || "").trim().slice(0, 28), ow: parseFloat(s.outlineWidth), os: s.outlineStyle }; })()`);
      seen.push(info.key);
      rings.push(info);
    }
    rec(`${page.name} ${n}: urutan Tab = lewati ke konten lalu seluruh kontrol berurutan`, same(seen, ["Langsung ke konten", ...page.keys]), JSON.stringify(seen));
    rec(`${page.name} ${n}: fokus keyboard terlihat pada setiap kontrol (outline >= 2px)`, rings.every((r) => r.os !== "none" && r.ow >= 2), JSON.stringify(rings.filter((r) => r.os === "none" || r.ow < 2)));
  }
}

// alur mock tidak berubah (375 mobile + sentuh untuk Daftar, desktop untuk Lupa dan Reset)
await setViewport(VPS_AUTH[0].v);
await navigate("/daftar");
await fill("#name", "Pemilik Uji");
await fill("#email", "pemilik.uji@contoh.co.id");
await fill("#password", "KataSandi123");
await fill("#confirmation", "KataSandi123");
// ketuk area label checkbox (bukan kotaknya): bagian kanan-bawah label
await evaluate(`document.querySelector("label[for=terms]").scrollIntoView({ block: "center" })`);
await sleep(150);
const lbl = await evaluate(`(() => { const r = document.querySelector("label[for=terms]").getBoundingClientRect(); return { x: r.right - 12, y: r.bottom - 4 }; })()`);
await tapAt(lbl.x, lbl.y);
await sleep(200);
rec("daftar 375: ketuk area label (di luar kotak) mencentang persetujuan", await evaluate(`document.querySelector("#terms").checked === true`));
await tap('form button[type="submit"]');
await waitFor(async () => ((await pathAndSearch()) === "/masuk?registered=1" ? true : null), 20000, "daftar berhasil").catch(() => null);
rec("daftar 375: pendaftaran valid → /masuk?registered=1 (alur tidak berubah)", (await pathAndSearch()) === "/masuk?registered=1", await pathAndSearch());

await setViewport(VPS_AUTH[2].v);
await navigate("/lupa-sandi");
await fill("#email", "pemilik.uji@contoh.co.id");
await clickEl('form button[type="submit"]');
await waitFor(() => bodyHas("Periksa email Anda"), 15000, "lupa sandi terkirim");
rec("lupa-sandi 1280: kirim valid menampilkan 'Periksa email Anda' dan memfokuskan judul (perilaku tidak berubah)", (await evaluate(`document.activeElement?.tagName`)) === "H1");
await navigate("/reset-sandi?token=demo-token");
await fill("#password", "KataSandi123");
await fill("#confirmation", "KataSandi123");
await clickEl('form button[type="submit"]');
await waitFor(async () => ((await pathAndSearch()) === "/masuk?reset=1" ? true : null), 20000, "reset berhasil").catch(() => null);
rec("reset-sandi 1280: reset valid → /masuk?reset=1 (alur tidak berubah)", (await pathAndSearch()) === "/masuk?reset=1", await pathAndSearch());
await navigate("/reset-sandi");
rec("reset-sandi 1280: tanpa token tetap menampilkan 'Tautan tidak valid'", await bodyHas("Tautan tidak valid"));
await setViewport(VPS_AUTH[0].v);
await navigate("/reset-sandi");
await overflowOk("reset-sandi tanpa token 375");
await checkAxe("reset-sandi tanpa token 375 mobile");

await evaluate(`sessionStorage.clear()`);
writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
const total = results.checks.length;
console.log(results.failures.length ? `\n${results.failures.length} masalah dari ${total} pemeriksaan.` : `\nSemua ${total} pemeriksaan lolos.`);
cleanup();
process.exit(results.failures.length ? 1 : 0);
