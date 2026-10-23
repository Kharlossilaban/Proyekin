// Pemeriksaan visual + aksesibilitas /style-guide di browser sungguhan (Chrome/Edge via CDP).
// Tanpa dependency tambahan selain axe-core. Jalankan: npm run check:browser [-- <folder-screenshot>]
//
// Mencakup: axe (WCAG 2.x A/AA) di 375/768/1280px, overflow horizontal, screenshot,
// navigasi keyboard + focus trap + Esc pada dialog, focus ring, dan prefers-reduced-motion.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(process.argv[2] ?? join(ROOT, ".browser-check"));
const APP_PORT = 3200;
const CDP_PORT = 9333;
const BASE = `http://localhost:${APP_PORT}`;
const VIEWPORTS = [
  { name: "375", width: 375, height: 800, mobile: false },
  { name: "768", width: 768, height: 1024, mobile: false },
  { name: "1280", width: 1280, height: 900, mobile: false },
];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);
const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) {
  console.error("Browser tidak ditemukan. Set CHROME_PATH.");
  process.exit(2);
}

mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = { viewports: [], keyboard: {}, reducedMotion: {}, failures: [] };
const fail = (msg) => {
  results.failures.push(msg);
  console.log("FAIL:", msg);
};

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      /* coba lagi */
    }
    await sleep(300);
  }
  throw new Error(`Timeout: ${label}`);
}

const procs = [];
function cleanup() {
  for (const p of procs) {
    try {
      p.kill();
    } catch {
      /* sudah berhenti */
    }
  }
}
process.on("exit", cleanup);

// 1) dev server
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(APP_PORT)], {
  cwd: ROOT,
  stdio: "ignore",
});
procs.push(dev);
await waitFor(async () => (await fetch(`${BASE}/style-guide`)).ok, 120000, "dev server");

// 2) browser
const profile = mkdtempSync(join(tmpdir(), "proyekin-chrome-"));
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-gpu",
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdio: "ignore" },
);
procs.push(chrome);
const targets = await waitFor(
  async () => (await fetch(`http://localhost:${CDP_PORT}/json`)).json(),
  30000,
  "chrome devtools",
);
const pageTarget = targets.find((t) => t.type === "page");
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
let nextId = 1;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve: ok, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else ok(msg.result);
  }
};
const send = (method, params = {}) =>
  new Promise((ok, reject) => {
    const id = nextId++;
    pending.set(id, { resolve: ok, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "evaluate error");
  return r.result.value;
};
const key = async (k, code = k, extra = {}) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, ...extra });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, ...extra });
};
const tab = (shift = false) =>
  key("Tab", "Tab", { windowsVirtualKeyCode: 9, modifiers: shift ? 8 : 0 });

await send("Page.enable");
await send("Runtime.enable");

const axeSource = readFileSync(join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
const AXE_RUN = `(async () => {
  const r = await axe.run({ exclude: [["nextjs-portal"]] }, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
  });
  return {
    passes: r.passes.length,
    incomplete: r.incomplete.map((i) => ({ id: i.id, nodes: i.nodes.length, sample: i.nodes.slice(0, 3).map((n) => n.target.join(" ") + " :: " + (n.any[0]?.message || "")) })),
    violations: r.violations.map((v) => ({
      id: v.id, impact: v.impact, help: v.help,
      nodes: v.nodes.slice(0, 4).map((n) => n.target.join(" ") + " :: " + (n.failureSummary || "").split("\\n").slice(0, 2).join(" | ")),
    })),
  };
})()`;

async function gotoPage(vp, path, media = []) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 1,
    mobile: vp.mobile,
  });
  await send("Emulation.setEmulatedMedia", { features: media });
  await send("Page.navigate", { url: `${BASE}${path}` });
  await waitFor(() => evaluate(`document.readyState === "complete" && !!document.querySelector("h1")`), 60000, "load");
  await evaluate(`document.fonts.ready.then(() => true)`);
  await sleep(600);
  const injected = await evaluate(`typeof window.axe !== "undefined"`);
  if (!injected) await evaluate(axeSource);
}
async function gotoGuide(vp, media = []) { return gotoPage(vp, "/style-guide", media); }

const APP_ROUTES = ["/", "/dashboard", "/proyek", "/tugas", "/laporan", "/dokumen", "/anggota", "/pengaturan"];

// 3) tiap viewport: axe + overflow + screenshot
for (const vp of VIEWPORTS) {
  await gotoGuide(vp);
  const axe = await evaluate(AXE_RUN);
  const overflow = await evaluate(
    `({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth })`,
  );
  const fontOk = await evaluate(
    `getComputedStyle(document.body).fontFamily + " | geist-loaded=" + [...document.fonts].some(f => /geist/i.test(f.family) && f.status === "loaded")`,
  );
  const metrics = await send("Page.getLayoutMetrics");
  const h = Math.ceil(metrics.cssContentSize.height);
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: vp.width, height: Math.min(h, 16000), scale: 1 },
  });
  writeFileSync(join(OUT, `style-guide-${vp.name}.png`), Buffer.from(shot.data, "base64"));
  const wide = await evaluate(`[...document.querySelectorAll("body *")].filter(e => e.getBoundingClientRect().right > window.innerWidth + 1 && ![...(function*(n){ while ((n = n.parentElement)) yield n; })(e)].some(a => getComputedStyle(a).overflowX !== "visible")).slice(0, 8).map(e => e.tagName + "." + String(e.className).slice(0, 60))`);
  const hOverflow = overflow.scrollWidth > overflow.innerWidth + 1;
  results.viewports.push({ viewport: vp.name, axe, overflow, hOverflow, wide, font: fontOk, pageHeight: h });
  if (axe.violations.length) fail(`axe @${vp.name}: ${axe.violations.map((v) => v.id).join(", ")}`);
  if (hOverflow) fail(`overflow horizontal @${vp.name}: ${overflow.scrollWidth} > ${overflow.innerWidth}`);
}

// 4) keyboard + dialog @1280
const desktop = VIEWPORTS[2];
await gotoGuide(desktop);
await evaluate(`document.querySelector("#dialog").scrollIntoView()`);

// focus ring muncul dengan keyboard
await evaluate(`document.querySelector("#dialog button").focus()`);
await tab(true);
await tab();
const ring = await evaluate(
  `(() => { const s = getComputedStyle(document.activeElement); return { text: document.activeElement.textContent.trim(), outlineWidth: s.outlineWidth, outlineStyle: s.outlineStyle }; })()`,
);
results.keyboard.focusRing = ring;
if (ring.outlineStyle === "none" || parseFloat(ring.outlineWidth) < 2) fail(`focus ring tidak terlihat: ${JSON.stringify(ring)}`);

// buka dialog dengan Enter
await evaluate(
  `[...document.querySelectorAll("#dialog button")].find(b => /Dialog informasi/.test(b.textContent)).focus()`,
);
await key("Enter", "Enter", { windowsVirtualKeyCode: 13, text: "\r" });
await sleep(500);
const opened = await evaluate(`(() => {
  const d = document.querySelector('[role="dialog"]');
  if (!d) return null;
  const labelId = d.getAttribute("aria-labelledby");
  return {
    ariaModal: d.getAttribute("aria-modal"),
    labelledby: !!(labelId && document.getElementById(labelId)),
    describedby: !!d.getAttribute("aria-describedby"),
    focusInside: d.contains(document.activeElement),
    title: document.getElementById(labelId)?.textContent,
  };
})()`);
results.keyboard.opened = opened;
if (!opened) fail("dialog tidak terbuka dengan Enter");
else {
  if (!opened.focusInside) fail("fokus tidak pindah ke dalam dialog");
  if (!opened.labelledby) fail("dialog tanpa aria-labelledby valid");
  results.keyboard.outsideInert = await evaluate(`(() => { const out = []; for (let n = document.querySelector("main"); n; n = n.parentElement) { out.push(n.tagName + ":" + [...n.attributes].filter(a => /inert|aria-hidden|data-base-ui/.test(a.name)).map(a => a.name + "=" + a.value).join(",")); } return out; })()`);
  const axeOpen = await evaluate(AXE_RUN);
  results.keyboard.axeDialogOpen = axeOpen;
  if (axeOpen.violations.length) fail(`axe dialog terbuka: ${axeOpen.violations.map((v) => v.id).join(", ")}`);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, "dialog-open-1280.png"), Buffer.from(shot.data, "base64"));

  // focus trap: Tab berkali-kali, fokus harus tetap di dalam dialog
  let escaped = false;
  for (let i = 0; i < 10; i++) {
    await tab();
    await sleep(80);
    const inside = await evaluate(`document.querySelector('[role="dialog"]').contains(document.activeElement)`);
    if (!inside) escaped = true;
  }
  results.keyboard.focusTrapHeld = !escaped;
  if (escaped) fail("fokus keluar dari dialog saat Tab (focus trap gagal)");

  await key("Escape", "Escape", { windowsVirtualKeyCode: 27 });
  await sleep(500);
  const closed = await evaluate(`({
    gone: !document.querySelector('[role="dialog"]'),
    backOnTrigger: /Dialog informasi/.test(document.activeElement.textContent || ""),
    active: document.activeElement.textContent.trim().slice(0, 30),
  })`);
  results.keyboard.closed = closed;
  if (!closed.gone) fail("dialog tidak tertutup dengan Esc");
  if (!closed.backOnTrigger) fail(`fokus tidak kembali ke pemicu (aktif: ${closed.active})`);
}

// 5) reduced motion
await gotoGuide(desktop, [{ name: "prefers-reduced-motion", value: "reduce" }]);
const rm = await evaluate(`(() => {
  const btn = document.querySelector("#tombol button");
  const s = getComputedStyle(btn);
  return {
    mediaMatches: matchMedia("(prefers-reduced-motion: reduce)").matches,
    transitionDuration: s.transitionDuration,
    spinnerAnimation: (() => { const sp = document.querySelector('#tombol svg.animate-spin'); return sp ? getComputedStyle(sp).animationName : "no-spinner"; })(),
  };
})()`);
results.reducedMotion = rm;
const td = parseFloat(rm.transitionDuration);
if (!rm.mediaMatches || td > 0.001) fail(`reduced-motion tidak diterapkan: ${JSON.stringify(rm)}`);

// 6) app routes: axe + overflow + screenshot di 375/768/1280
results.appRoutes = [];
for (const route of APP_ROUTES) {
  for (const vp of VIEWPORTS) {
    await gotoPage(vp, route);
    const axe = await evaluate(AXE_RUN);
    const overflow = await evaluate(
      `({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth })`,
    );
    const hOverflow = overflow.scrollWidth > overflow.innerWidth + 1;
    const safeName = route === "/" ? "landing" : route.slice(1);
    const shotName = `${safeName}-${vp.name}.png`;
    const metrics = await send("Page.getLayoutMetrics");
    const h = Math.ceil(metrics.cssContentSize.height);
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: vp.width, height: Math.min(h, 16000), scale: 1 },
    });
    writeFileSync(join(OUT, shotName), Buffer.from(shot.data, "base64"));
    results.appRoutes.push({ route, viewport: vp.name, axeViolations: axe.violations.length, hOverflow });
    if (axe.violations.length) fail(`axe ${route}@${vp.name}: ${axe.violations.map((v) => v.id + ": " + v.help).join(", ")}`);
    if (hOverflow) fail(`overflow ${route}@${vp.name}: ${overflow.scrollWidth} > ${overflow.innerWidth}`);
  }
}

// 7) keyboard: sidebar drawer @375
await gotoPage(VIEWPORTS[0], "/dashboard");
const hamburger = await evaluate(`(() => {
  const btn = document.querySelector('[aria-label="Buka navigasi"]');
  if (!btn) return null;
  btn.focus();
  return { found: true, ariaExpanded: btn.getAttribute("aria-expanded") };
})()`);
if (hamburger) {
  await key("Enter", "Enter", { windowsVirtualKeyCode: 13, text: "\r" });
  await sleep(500);
  const drawer = await evaluate(`(() => {
    const d = document.querySelector('[data-slot="sidebar-mobile"]');
    if (!d) return null;
    return { ariaModal: d.getAttribute("aria-modal"), label: d.getAttribute("aria-label") };
  })()`);
  results.keyboard.sidebarDrawer = drawer;
  if (!drawer) fail("sidebar drawer tidak terbuka di mobile");
}

// ---------- U3: halaman auth + alur demo ----------
const FLOWS_DIR = join(OUT, "flows");
mkdirSync(FLOWS_DIR, { recursive: true });
const SESSION_KEY = "proyekin-demo-session";
const slug = (route) => route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/-$/, "");
const q = (s) => JSON.stringify(s);

async function fullShot(file, vp) {
  const metrics = await send("Page.getLayoutMetrics");
  const h = Math.ceil(metrics.cssContentSize.height);
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: vp.width, height: Math.min(h, 16000), scale: 1 },
  });
  writeFileSync(file, Buffer.from(shot.data, "base64"));
}
const fill = (sel, value) =>
  evaluate(`(() => { const el = document.querySelector(${q(sel)}); if (!el) throw new Error("tidak ada: " + ${q(sel)});
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${q(value)});
    el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
const click = (sel) =>
  evaluate(`(() => { const el = document.querySelector(${q(sel)}); if (!el) throw new Error("tidak ada: " + ${q(sel)}); el.click(); return true; })()`);
const clickByText = (scope, re) =>
  evaluate(`(() => { const el = [...document.querySelectorAll(${q(scope)})].find(e => ${re}.test(e.textContent)); if (!el) throw new Error("tidak ada: " + ${q(scope)} + " " + ${q(String(re))}); el.click(); return true; })()`);
const pathNow = () => evaluate(`location.pathname + location.search`);
const waitPath = (p, label) => waitFor(async () => (await pathNow()) === p, 15000, label ?? `path ${p}`);
const text = () => evaluate(`document.body.innerText`);
async function reload() {
  await send("Page.reload");
  await waitFor(() => evaluate(`document.readyState === "complete" && !!document.querySelector("h1")`), 60000, "reload");
  await sleep(600);
}
const check = (name, ok, detail = "") => {
  results.flows.push({ name, ok: !!ok, detail });
  if (!ok) fail(`flow "${name}" ${detail}`);
};
async function flow(name, fn) {
  try {
    await fn();
  } catch (e) {
    check(name, false, `error: ${e.message}`);
  }
}
const SUBMIT = 'form button[type="submit"]';
const invalidState = (ids) =>
  evaluate(`(() => { const ids = ${q(ids)};
    return {
      invalid: [...document.querySelectorAll('[aria-invalid="true"]')].map(e => e.id),
      focus: document.activeElement.id,
      described: ids.every(id => { const d = document.getElementById(id)?.getAttribute("aria-describedby"); return !!d && d.split(" ").every(x => document.getElementById(x)); }),
      labelled: ids.every(id => !!document.querySelector('label[for="' + id + '"]')),
    }; })()`);
const loginUi = async (email, password = "kata-sandi-demo-1") => {
  await gotoPage(desktop, "/masuk");
  await fill("#email", email);
  await fill("#password", password);
  await click(SUBMIT);
  await waitPath("/dashboard", "redirect ke dashboard");
  await waitFor(() => evaluate(`!!document.querySelector('[data-slot="sidebar-desktop"]')`), 15000, "app shell");
};
const sidebarLinks = () =>
  evaluate(`[...document.querySelectorAll('[data-slot="sidebar-desktop"] nav a')].map(a => a.textContent.trim())`);

results.flows = [];
results.authRoutes = [];

// 8) axe + overflow + screenshot semua route auth di 3 viewport
const AUTH_ROUTES = ["/masuk", "/daftar", "/lupa-sandi", "/reset-sandi?token=demo-token", "/reset-sandi", "/akses-ditolak"];
for (const route of AUTH_ROUTES) {
  for (const vp of VIEWPORTS) {
    await gotoPage(vp, route);
    await evaluate(`sessionStorage.clear()`);
    const axe = await evaluate(AXE_RUN);
    const overflow = await evaluate(`({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth })`);
    const hOverflow = overflow.scrollWidth > overflow.innerWidth + 1;
    await fullShot(join(OUT, `auth-${slug(route)}-${vp.name}.png`), vp);
    results.authRoutes.push({ route, viewport: vp.name, axeViolations: axe.violations.length, hOverflow });
    if (axe.violations.length) fail(`axe ${route}@${vp.name}: ${axe.violations.map((v) => v.id + ": " + v.help).join(", ")}`);
    if (hOverflow) fail(`overflow ${route}@${vp.name}: ${overflow.scrollWidth} > ${overflow.innerWidth}`);
  }
}

// 9) login: validasi, aksesibilitas error, keyboard
await flow("login: validasi kosong", async () => {
  await gotoPage(desktop, "/masuk");
  await evaluate(`sessionStorage.clear()`);
  check("login: autofocus pada email", await evaluate(`document.activeElement.id === "email"`));
  await click(SUBMIT);
  await sleep(300);
  const s = await invalidState(["email", "password"]);
  check("login: 2 field ditandai aria-invalid", s.invalid.length === 2, JSON.stringify(s.invalid));
  check("login: fokus pindah ke error pertama", s.focus === "email", s.focus);
  check("login: aria-describedby terhubung ke pesan error", s.described);
  check("login: semua input punya label", s.labelled);
  await fullShot(join(FLOWS_DIR, "login-validasi-1280.png"), desktop);
});
await flow("login: email tidak terdaftar", async () => {
  await fill("#email", "tidak.ada@contoh.co.id");
  await fill("#password", "apa-saja");
  await click(SUBMIT);
  await waitFor(async () => /Email atau kata sandi salah/.test(await text()), 10000, "pesan salah");
  check("login: error generik tanpa membocorkan akun", true);
  check("login: tidak ada sesi tersimpan", (await evaluate(`sessionStorage.getItem(${q(SESSION_KEY)})`)) === null);
  await fullShot(join(FLOWS_DIR, "login-gagal-1280.png"), desktop);
});
await flow("login: urutan keyboard + toggle sandi", async () => {
  await gotoPage(desktop, "/masuk");
  await evaluate(`document.getElementById("email").focus()`);
  const order = [];
  for (let i = 0; i < 4; i++) {
    await tab();
    order.push(await evaluate(`(document.activeElement.getAttribute("aria-label") || document.activeElement.textContent || document.activeElement.id).trim().slice(0, 40)`));
  }
  check("login: urutan Tab email → sandi → toggle → lupa → masuk",
    order[0] === "password" && order[1] === "Tampilkan kata sandi" && /Lupa kata sandi/.test(order[2]) && order[3] === "Masuk",
    JSON.stringify(order));
  await evaluate(`document.querySelector('[aria-label="Tampilkan kata sandi"]').focus()`);
  await key("Enter", "Enter", { windowsVirtualKeyCode: 13, text: "\r" });
  await sleep(200);
  const t = await evaluate(`({ type: document.getElementById("password").type, label: document.activeElement.getAttribute("aria-label") })`);
  check("login: toggle sandi via keyboard", t.type === "text" && t.label === "Sembunyikan kata sandi", JSON.stringify(t));
});

// 10) login berhasil, refresh, role, logout, mode pengembangan
await flow("login: sukses → dashboard", async () => {
  await gotoPage(desktop, "/masuk");
  await fill("#email", "budi@proyekin.id");
  await fill("#password", "RAHASIA-uji-123");
  await click(SUBMIT);
  await sleep(150);
  const busy = await evaluate(`({ busy: document.querySelector(${q(SUBMIT)}).getAttribute("aria-busy"), disabled: document.getElementById("email").disabled })`);
  check("login: state loading (aria-busy + input disabled)", busy.busy === "true" && busy.disabled, JSON.stringify(busy));
  await waitPath("/dashboard", "redirect ke dashboard");
  await waitFor(() => evaluate(`!!document.querySelector('[data-slot="sidebar-desktop"]')`), 15000, "app shell");
  const s = await evaluate(`({
    sidebar: document.querySelector('[data-slot="sidebar-desktop"]').textContent,
    logout: [...document.querySelectorAll('[data-slot="sidebar-desktop"] button')].some(b => /Keluar/.test(b.textContent)),
    stored: sessionStorage.getItem(${q(SESSION_KEY)}) || "",
    notice: document.body.innerText.includes("Mode pengembangan"),
    local: Object.keys(localStorage).length,
  })`);
  check("dashboard: nama user dari sesi demo", /Budi Santoso/.test(s.sidebar));
  check("dashboard: tombol Keluar tersedia", s.logout);
  check("sesi: hanya userId + waktu, tanpa password", /userId/.test(s.stored) && !/RAHASIA|password|sandi/i.test(s.stored), s.stored);
  check("sesi: tidak memakai localStorage", s.local === 0);
  check("dashboard: tanpa notice mode pengembangan saat login", !s.notice);
  await fullShot(join(FLOWS_DIR, "dashboard-setelah-login-1280.png"), desktop);
  await reload();
  const after = await evaluate(`document.querySelector('[data-slot="sidebar-desktop"]')?.textContent || ""`);
  check("refresh: sesi demo bertahan di tab yang sama", /Budi Santoso/.test(after));
});
await flow("shell: axe saat login (3 viewport)", async () => {
  for (const vp of VIEWPORTS) {
    await gotoPage(vp, "/dashboard");
    const axe = await evaluate(AXE_RUN);
    const overflow = await evaluate(`document.documentElement.scrollWidth > window.innerWidth + 1`);
    await fullShot(join(FLOWS_DIR, `dashboard-login-${vp.name}.png`), vp);
    check(`shell login: axe 0 pelanggaran @${vp.name}`, axe.violations.length === 0, axe.violations.map((v) => v.id).join(","));
    check(`shell login: tanpa overflow @${vp.name}`, !overflow);
  }
});
await flow("logout", async () => {
  await gotoPage(desktop, "/dashboard");
  await clickByText('[data-slot="sidebar-desktop"] button', /Keluar/);
  await waitPath("/masuk", "redirect ke masuk");
  check("logout: sesi dihapus", (await evaluate(`sessionStorage.getItem(${q(SESSION_KEY)})`)) === null);
});
await flow("role: Mandor tanpa menu Pengaturan", async () => {
  await loginUi("ahmad@proyekin.id");
  const links = await sidebarLinks();
  check("role Mandor: menu Laporan ada, Pengaturan tidak ada", links.includes("Laporan") && !links.includes("Pengaturan"), JSON.stringify(links));
  check("role Mandor: tidak ada role Tukang", !/tukang/i.test(await text()));
  await evaluate(`sessionStorage.clear()`);
});
await flow("mode pengembangan tanpa sesi", async () => {
  await gotoPage(desktop, "/dashboard");
  const s = await evaluate(`({ notice: document.body.innerText.includes("Mode pengembangan"), logout: [...document.querySelectorAll("button")].some(b => /Keluar/.test(b.textContent)) })`);
  check("tanpa sesi: route aplikasi tetap bisa dibuka (akses developer)", s.notice && !s.logout, JSON.stringify(s));
  await fullShot(join(FLOWS_DIR, "dashboard-mode-pengembangan-1280.png"), desktop);
});
await flow("drawer mobile memuat Keluar", async () => {
  await gotoPage(VIEWPORTS[0], "/masuk");
  await evaluate(`sessionStorage.setItem(${q(SESSION_KEY)}, JSON.stringify({ userId: "u-001", loginAt: new Date().toISOString() }))`);
  await gotoPage(VIEWPORTS[0], "/dashboard");
  await click('[aria-label="Buka navigasi"]');
  await sleep(400);
  const has = await evaluate(`[...document.querySelectorAll('[data-slot="sidebar-mobile"] button')].some(b => /Keluar/.test(b.textContent))`);
  check("drawer mobile: tombol Keluar tersedia", has);
  await fullShot(join(FLOWS_DIR, "drawer-login-375.png"), VIEWPORTS[0]);
  await evaluate(`sessionStorage.clear()`);
});

// 11) registrasi Owner
await flow("registrasi Owner", async () => {
  await gotoPage(desktop, "/daftar");
  check("daftar: autofocus pada nama", await evaluate(`document.activeElement.id === "name"`));
  check("daftar: tanpa pemilihan role", await evaluate(`!document.querySelector('select, [role="combobox"], [role="listbox"], input[type="radio"]')`));
  check("daftar: menyatakan hanya untuk Owner", /hanya untuk Owner/.test(await text()));
  await click(SUBMIT);
  await sleep(300);
  const s = await invalidState(["name", "email", "password", "confirmation", "terms"]);
  check("daftar: 5 field tidak valid saat kosong", s.invalid.length === 5, JSON.stringify(s.invalid));
  check("daftar: fokus ke error pertama", s.focus === "name", s.focus);
  check("daftar: aria-describedby terhubung", s.described);
  await fullShot(join(FLOWS_DIR, "daftar-validasi-1280.png"), desktop);

  await fill("#password", "abc");
  await sleep(150);
  check("daftar: indikator kekuatan 1 dari 4", /1 dari 4/.test(await evaluate(`document.querySelector('[role="status"]').textContent`)));
  await fill("#password", "Abcdef12");
  await sleep(150);
  check("daftar: indikator kekuatan 4 dari 4", /4 dari 4/.test(await evaluate(`document.querySelector('[role="status"]').textContent`)));
  await fill("#confirmation", "Beda12345");
  await fill("#name", "Owner Baru");
  await fill("#email", "owner.baru@contoh.co.id");
  await click(SUBMIT);
  await sleep(300);
  check("daftar: konfirmasi tidak cocok ditolak", /tidak cocok/.test(await text()));
  await fill("#confirmation", "Abcdef12");
  await click("#terms");
  await click(SUBMIT);
  await sleep(150);
  check("daftar: state loading", (await evaluate(`document.querySelector(${q(SUBMIT)}).getAttribute("aria-busy")`)) === "true");
  await waitPath("/masuk?registered=1", "redirect setelah daftar");
  await waitFor(async () => /disimulasikan/.test(await text()), 10000, "pesan sukses daftar");
  check("daftar: pesan sukses menyatakan simulasi", /disimulasikan/.test(await text()));
  check("daftar: tidak ada data tersimpan", (await evaluate(`sessionStorage.length + localStorage.length`)) === 0);
  await fullShot(join(FLOWS_DIR, "masuk-setelah-daftar-1280.png"), desktop);
});

// 12) lupa + reset password
await flow("lupa password", async () => {
  await gotoPage(desktop, "/lupa-sandi");
  await fill("#email", "bukan-email");
  await click(SUBMIT);
  await sleep(300);
  check("lupa: email tidak valid ditolak", await evaluate(`!!document.getElementById("email-error")`));
  await fill("#email", "siapa.saja@contoh.co.id");
  await click(SUBMIT);
  await waitFor(async () => /Periksa email Anda/.test(await text()), 10000, "konfirmasi");
  await sleep(200);
  const t = await text();
  check("lupa: fokus pindah ke judul konfirmasi", await evaluate(`document.activeElement.tagName === "H1"`));
  check("lupa: tidak mengklaim email terkirim", !/telah dikirim|sudah dikirim|berhasil dikirim/i.test(t) && /tidak ada email yang benar-benar dikirim/i.test(t));
  await fullShot(join(FLOWS_DIR, "lupa-konfirmasi-1280.png"), desktop);
  await clickByText("a", /Buka halaman reset/);
  await waitPath("/reset-sandi?token=demo-token", "ke reset");
});
await flow("reset password", async () => {
  await waitFor(() => evaluate(`!!document.getElementById("password")`), 10000, "form reset");
  await fill("#password", "Abcdef12");
  await fill("#confirmation", "Beda12345");
  await click(SUBMIT);
  await sleep(300);
  const s = await invalidState(["confirmation"]);
  check("reset: konfirmasi tidak cocok ditolak + terhubung", s.invalid.includes("confirmation") && s.described && s.focus === "confirmation", JSON.stringify(s));
  await fullShot(join(FLOWS_DIR, "reset-validasi-1280.png"), desktop);
  await fill("#confirmation", "Abcdef12");
  await click(SUBMIT);
  await waitPath("/masuk?reset=1", "redirect setelah reset");
  await waitFor(async () => /Pengaturan ulang kata sandi disimulasikan/.test(await text()), 10000, "pesan sukses reset");
  check("reset: pesan sukses menyatakan simulasi", /Pengaturan ulang kata sandi disimulasikan/.test(await text()));
  await gotoPage(desktop, "/reset-sandi");
  check("reset: tanpa token → tautan tidak valid", /Tautan tidak valid/.test(await text()) && (await evaluate(`!!document.querySelector('a[href="/lupa-sandi"]')`)));
});

// 13) akses ditolak + navigasi dari landing
await flow("akses ditolak + landing", async () => {
  await gotoPage(desktop, "/akses-ditolak");
  check("akses ditolak: judul dan tombol kembali", /Akses tidak tersedia/.test(await text()) && (await evaluate(`[...document.querySelectorAll("button")].some(b => /Kembali ke halaman sebelumnya/.test(b.textContent))`)));
  await click('main a[href="/"]');
  await waitPath("/", "ke beranda");
  await click('header a[href="/masuk"]');
  await waitPath("/masuk", "landing → masuk");
  check("landing → login → beranda berfungsi", true);
});
await evaluate(`sessionStorage.clear()`);

writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
console.log(results.failures.length ? `\n${results.failures.length} masalah.` : "\nSemua pemeriksaan lolos.");
cleanup();
process.exit(results.failures.length ? 1 : 0);
