// Helper Chrome DevTools Protocol untuk skrip pemeriksaan baru (U4-2 dst.). Tidak mengubah skrip lama
// (browser-check.mjs, check-dynamic-routes.mjs) yang masih memuat salinan boilerplate sendiri.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function findChrome() {
  return [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ]
    .filter(Boolean)
    .find((p) => existsSync(p));
}

export async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      /* coba lagi */
    }
    await sleep(150);
  }
  throw new Error(`Timeout: ${label}`);
}

const KEYS = {
  Tab: { key: "Tab", code: "Tab", vk: 9 },
  Enter: { key: "Enter", code: "Enter", vk: 13, text: "\r" },
  Escape: { key: "Escape", code: "Escape", vk: 27 },
  Space: { key: " ", code: "Space", vk: 32, text: " " },
  End: { key: "End", code: "End", vk: 35 },
  Home: { key: "Home", code: "Home", vk: 36 },
  ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", vk: 37 },
  ArrowUp: { key: "ArrowUp", code: "ArrowUp", vk: 38 },
  ArrowRight: { key: "ArrowRight", code: "ArrowRight", vk: 39 },
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", vk: 40 },
};

/** Menjalankan Chrome headless dan menyambungkan CDP. */
export async function createBrowser({ chromePath = findChrome(), cdpPort }) {
  if (!chromePath) throw new Error("Browser tidak ditemukan. Set CHROME_PATH.");
  const profile = mkdtempSync(join(tmpdir(), "proyekin-cdp-"));
  const proc = spawn(
    chromePath,
    ["--headless=new", `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu", "--hide-scrollbars", "about:blank"],
    { stdio: "ignore" },
  );
  const targets = await waitFor(async () => (await fetch(`http://localhost:${cdpPort}/json`)).json(), 30000, "chrome devtools");
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let nextId = 1;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "evaluate error");
    return r.result.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");

  const pressKey = async (name, extra = {}) => {
    const k = KEYS[name];
    if (!k) throw new Error(`Tombol tidak dikenal: ${name}`);
    const base = { key: k.key, code: k.code, windowsVirtualKeyCode: k.vk, ...extra };
    await send("Input.dispatchKeyEvent", { type: "keyDown", ...base, ...(k.text ? { text: k.text } : {}) });
    await send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
  };

  return {
    send,
    evaluate,
    pressKey,
    /** Mengetik teks ke elemen yang sedang fokus. */
    insertText: (text) => send("Input.insertText", { text }),
    /** Mengatur viewport; `mobile` + `touch` mengaktifkan emulasi perangkat mobile dan sentuhan. */
    async setViewport({ width, height, mobile = false, touch = false }) {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
      await send("Emulation.setTouchEmulationEnabled", touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    },
    /** Ketuk titik viewport dengan event sentuh. */
    async tapAt(x, y) {
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    },
    /** Ketuk pusat elemen (digulir ke tengah dulu) dengan event sentuh. */
    async tap(selector) {
      const pt = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error("tidak ada: " + ${JSON.stringify(selector)}); el.scrollIntoView({ block: "center", inline: "center" }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      await sleep(80);
      const fresh = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: fresh.x ?? pt.x, y: fresh.y ?? pt.y }] });
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    },
    async close() {
      try {
        ws.close();
      } catch {
        /* sudah tertutup */
      }
      try {
        proc.kill();
      } catch {
        /* sudah berhenti */
      }
    },
  };
}
