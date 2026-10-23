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

async function gotoGuide(vp, media = []) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 1,
    mobile: vp.mobile,
  });
  await send("Emulation.setEmulatedMedia", { features: media });
  await send("Page.navigate", { url: `${BASE}/style-guide` });
  await waitFor(() => evaluate(`document.readyState === "complete" && !!document.querySelector("h1")`), 60000, "load");
  await evaluate(`document.fonts.ready.then(() => true)`);
  await sleep(600);
  const injected = await evaluate(`typeof window.axe !== "undefined"`);
  if (!injected) await evaluate(axeSource);
}

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

writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
console.log(results.failures.length ? `\n${results.failures.length} masalah.` : "\nSemua pemeriksaan lolos.");
cleanup();
process.exit(results.failures.length ? 1 : 0);
