// Apakah langkah `Tab` terakhir blok A3 (fokus masuk ke panel) juga balapan? Urutan seperti harness:
// reset -> ArrowLeft (berputar ke tab terakhir) -> settleTab -> Tab -> baca activeElement SEGERA (tanpa penantian).
// Pemakaian: node diag-tabs-tabkey.mjs <rate> <percobaan>
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = "C:/proyekin_project/proyekin";
const { createBrowser, sleep, waitFor } = await import(pathToFileURL(`${ROOT}/scripts/lib/cdp.mjs`).href);
const RATE = Number(process.argv[2] ?? 1);
const TRIALS = Number(process.argv[3] ?? 40);
const PORT = 3732;
const BASE = `http://localhost:${PORT}`;
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT)], { cwd: ROOT, stdio: "ignore" });
const browser = await createBrowser({ cdpPort: 9732 });
const { send, evaluate, pressKey } = browser;
const cleanup = () => { try { dev.kill(); } catch {} browser.close(); };
process.on("exit", cleanup);
await waitFor(async () => (await fetch(`${BASE}/style-guide`)).ok, 120000, "dev server");
await send("Page.navigate", { url: `${BASE}/style-guide` });
await waitFor(() => evaluate(`document.readyState === "complete" && !!document.querySelector("h1")`), 90000, "muat");
await waitFor(() => evaluate(`(() => { const el = document.querySelector('#tabs [role="tab"]'); return !!el && Object.keys(el).some((k) => k.startsWith("__react")); })()`), 60000, "hidrasi");
await sleep(1000);

const tabState = () =>
  evaluate(`({ selected: document.querySelector('#tabs [role="tab"][aria-selected="true"]')?.textContent.trim() ?? null, visiblePanels: [...document.querySelectorAll('#tabs [role="tabpanel"]')].filter((p) => p.checkVisibility()).length })`);
const settleTab = (expected) =>
  waitFor(async () => { const s = await tabState(); return s.selected === expected && s.visiblePanels === 1; }, 5000, `tab ${expected}`).catch(() => false);
const reset = async () => {
  await evaluate(`document.querySelector('#tabs [role="tab"]').click(); document.querySelector('#tabs [role="tab"]').focus()`);
  await settleTab("Ringkasan");
  await evaluate(`document.querySelector('#tabs [role="tab"][aria-selected="true"]').focus()`);
};
const active = () => evaluate(`(() => { const a = document.activeElement; return { role: a.getAttribute("role"), text: (a.textContent || "").trim().slice(0, 30) }; })()`);

await send("Emulation.setCPUThrottlingRate", { rate: RATE });
let fail = 0;
const bad = [];
for (let i = 0; i < TRIALS; i++) {
  await reset();
  await pressKey("ArrowLeft");
  await settleTab("Contoh tab keenam");
  await pressKey("Tab");
  const a = await active();
  if (a.role !== "tabpanel") { fail++; bad.push(a); }
}
console.log(JSON.stringify({ rate: RATE, percobaan: TRIALS, langkah_Tab_bukan_tabpanel: fail, contoh: bad.slice(0, 3) }));
cleanup();
process.exit(0);
