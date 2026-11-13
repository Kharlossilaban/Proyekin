// Diagnostik race Tabs (scratchpad, bukan bagian repo): setelah pressKey("ArrowRight"), seberapa sering pembacaan LANGSUNG
// (pola lama check:u4-components) menangkap keadaan lama, dan berapa lama sampai tab + panel konsisten.
// Pemakaian: node diag-tabs-race.mjs <rate-throttle> <jumlah-percobaan>
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = "C:/proyekin_project/proyekin";
const { createBrowser, sleep, waitFor } = await import(pathToFileURL(`${ROOT}/scripts/lib/cdp.mjs`).href);
const RATE = Number(process.argv[2] ?? 6);
const TRIALS = Number(process.argv[3] ?? 20);
const PORT = 3730;
const BASE = `http://localhost:${PORT}`;
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT)], { cwd: ROOT, stdio: "ignore" });
const browser = await createBrowser({ cdpPort: 9730 });
const { send, evaluate, pressKey } = browser;
const cleanup = () => {
  try { dev.kill(); } catch {}
  browser.close();
};
process.on("exit", cleanup);
await waitFor(async () => (await fetch(`${BASE}/style-guide`)).ok, 120000, "dev server");
await send("Page.navigate", { url: `${BASE}/style-guide` });
await waitFor(() => evaluate(`document.readyState === "complete" && !!document.querySelector("h1")`), 90000, "muat");
await waitFor(() => evaluate(`(() => { const el = document.querySelector('#tabs [role="tab"]'); return !!el && Object.keys(el).some((k) => k.startsWith("__react")); })()`), 60000, "hidrasi");
await sleep(1000);

const SEL = `document.querySelector('#tabs [role="tab"][aria-selected="true"]').textContent.trim()`;
const PANEL = `[...document.querySelectorAll('#tabs [role="tabpanel"]')].filter((p) => p.checkVisibility()).map((p) => p.textContent.trim())`;
const readState = () => evaluate(`({ sel: ${SEL}, panels: ${PANEL}.length, panelHasTugas: (${PANEL})[0]?.includes("Tugas") ?? null })`);
const consistent = (s) => s.sel === "Tugas" && s.panelHasTugas === true;

await send("Emulation.setCPUThrottlingRate", { rate: RATE });
const rows = [];
for (let i = 0; i < TRIALS; i++) {
  // reset ke tab pertama dan tunggu sampai benar-benar aktif
  await evaluate(`document.querySelector('#tabs [role="tab"]').click(); document.querySelector('#tabs [role="tab"]').focus()`);
  await waitFor(async () => (await evaluate(SEL)) === "Ringkasan", 10000, "reset");
  await sleep(150);
  await evaluate(`document.querySelector('#tabs [role="tab"][aria-selected="true"]').focus()`);
  await pressKey("ArrowRight");
  const t0 = Date.now();
  const immediate = await readState(); // pola lama: baca langsung
  let settledMs = null;
  while (Date.now() - t0 < 5000) {
    if (consistent(await readState())) { settledMs = Date.now() - t0; break; }
    await sleep(10);
  }
  rows.push({ trial: i + 1, immediate, immediateOk: consistent(immediate), settledMs });
}
const stale = rows.filter((r) => !r.immediateOk);
const never = rows.filter((r) => r.settledMs === null);
console.log(JSON.stringify({
  rate: RATE,
  trials: TRIALS,
  baca_langsung_keadaan_lama: stale.length,
  tak_pernah_konsisten_dalam_5s: never.length,
  maks_ms_sampai_konsisten: Math.max(...rows.map((r) => r.settledMs ?? 0)),
  contoh_keadaan_lama: stale.slice(0, 3).map((r) => r.immediate),
}, null, 1));
cleanup();
process.exit(0);
