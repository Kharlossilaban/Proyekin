// Membandingkan pola LAMA vs BARU blok A3 (ArrowRight) dengan urutan round-trip yang sama seperti harness:
// lama = pressKey lalu sel() lalu panel()[0]; baru = pressKey lalu settleTab("Tugas") lalu asersi yang sama.
// Pemakaian: node diag-tabs-pattern.mjs <rate> <percobaan-per-pola>
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = "C:/proyekin_project/proyekin";
const { createBrowser, sleep, waitFor } = await import(pathToFileURL(`${ROOT}/scripts/lib/cdp.mjs`).href);
const RATE = Number(process.argv[2] ?? 1);
const TRIALS = Number(process.argv[3] ?? 40);
const PORT = 3731;
const BASE = `http://localhost:${PORT}`;
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT)], { cwd: ROOT, stdio: "ignore" });
const browser = await createBrowser({ cdpPort: 9731 });
const { send, evaluate, pressKey } = browser;
const cleanup = () => { try { dev.kill(); } catch {} browser.close(); };
process.on("exit", cleanup);
await waitFor(async () => (await fetch(`${BASE}/style-guide`)).ok, 120000, "dev server");
await send("Page.navigate", { url: `${BASE}/style-guide` });
await waitFor(() => evaluate(`document.readyState === "complete" && !!document.querySelector("h1")`), 90000, "muat");
await waitFor(() => evaluate(`(() => { const el = document.querySelector('#tabs [role="tab"]'); return !!el && Object.keys(el).some((k) => k.startsWith("__react")); })()`), 60000, "hidrasi");
await sleep(1000);

const sel = () => evaluate(`document.querySelector('#tabs [role="tab"][aria-selected="true"]').textContent.trim()`);
const panel = () => evaluate(`[...document.querySelectorAll('#tabs [role="tabpanel"]')].filter((p) => p.checkVisibility()).map((p) => p.textContent.trim())`);
// Sama dengan harness final: SATU evaluasi atomik untuk tab terpilih + jumlah panel terlihat.
const tabState = () =>
  evaluate(`({ selected: document.querySelector('#tabs [role="tab"][aria-selected="true"]')?.textContent.trim() ?? null, visiblePanels: [...document.querySelectorAll('#tabs [role="tabpanel"]')].filter((p) => p.checkVisibility()).length })`);
const settleTab = (expected) =>
  waitFor(async () => { const s = await tabState(); return s.selected === expected && s.visiblePanels === 1; }, 5000, `tab ${expected}`).catch(() => false);
const reset = async () => {
  await evaluate(`document.querySelector('#tabs [role="tab"]').click(); document.querySelector('#tabs [role="tab"]').focus()`);
  await waitFor(async () => (await sel()) === "Ringkasan" && (await panel()).length === 1, 10000, "reset");
  await evaluate(`document.querySelector('#tabs [role="tab"][aria-selected="true"]').focus()`);
};

await send("Emulation.setCPUThrottlingRate", { rate: RATE });
const out = { rate: RATE, percobaan: TRIALS };
for (const mode of ["lama", "baru"]) {
  let fail = 0;
  for (let i = 0; i < TRIALS; i++) {
    await reset();
    await pressKey("ArrowRight");
    if (mode === "baru") await settleTab("Tugas");
    const ok = (await sel()) === "Tugas" && (await panel())[0]?.includes("Tugas") === true;
    if (!ok) fail++;
  }
  out[mode] = `${fail} gagal dari ${TRIALS}`;
}
console.log(JSON.stringify(out));
cleanup();
process.exit(0);
