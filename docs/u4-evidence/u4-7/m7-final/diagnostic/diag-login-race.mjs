// Diagnostik race hidrasi login (scratchpad, bukan bagian repo).
// Membandingkan pola lama check:u4-access (isi setelah readyState) vs pola baru (tunggu hidrasi + nilai diterima React)
// dengan CPU Chrome diperlambat. Jalankan: node diag-login-race.mjs <rate> <trials>
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = "C:/proyekin_project/proyekin";
const { createBrowser, sleep, waitFor } = await import(pathToFileURL(`${ROOT}/scripts/lib/cdp.mjs`).href);
const RATE = Number(process.argv[2] ?? 6);
const TRIALS = Number(process.argv[3] ?? 4);
const PORT = 3710;
const BASE = `http://localhost:${PORT}`;
const dev = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT)], { cwd: ROOT, stdio: "ignore" });
const browser = await createBrowser({ cdpPort: 9710 });
const { send, evaluate } = browser;
const cleanup = () => { try { dev.kill(); } catch {} browser.close(); };
process.on("exit", cleanup);
await waitFor(async () => (await fetch(`${BASE}/masuk`)).ok, 120000, "dev server");
await send("Page.navigate", { url: `${BASE}/masuk` });
await waitFor(() => evaluate(`document.readyState === "complete"`), 90000, "warmup");
await sleep(2000);

const q = JSON.stringify;
const hydrated = (sel) => `(() => { const el = document.querySelector(${q(sel)}); return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps")); })()`;
const reactValue = (sel) => `(() => { const el = document.querySelector(${q(sel)}); const k = el && Object.keys(el).find((x) => x.startsWith("__reactProps")); return k ? el[k].value : null; })()`;
const fill = (sel, v) => evaluate(`(() => { const el = document.querySelector(${q(sel)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${q(v)}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);

await send("Emulation.setCPUThrottlingRate", { rate: RATE });
const out = [];
for (const mode of ["lama", "baru"]) {
  for (let i = 0; i < TRIALS; i++) {
    await evaluate(`sessionStorage.clear()`);
    await send("Page.navigate", { url: `${BASE}/masuk?t=${Date.now()}` });
    await waitFor(() => evaluate(`document.readyState === "complete"`), 90000, "muat");
    await evaluate(`document.fonts.ready.then(() => true)`);
    await waitFor(() => evaluate(`!!document.querySelector("#email")`), 30000, "#email ada");
    if (mode === "baru") {
      await waitFor(() => evaluate(`${hydrated("#email")} && ${hydrated("#password")}`), 60000, "hidrasi");
    }
    const hydratedAtFill = await evaluate(hydrated("#email"));
    await fill("#email", "siti@proyekin.id");
    await fill("#password", "kata-sandi-demo-1");
    if (mode === "baru") {
      await waitFor(async () => (await evaluate(reactValue("#email"))) === "siti@proyekin.id" && (await evaluate(reactValue("#password"))) === "kata-sandi-demo-1", 15000, "nilai diterima React");
    }
    await evaluate(`document.querySelector('form button[type="submit"]').click()`);
    const landed = await waitFor(async () => ((await evaluate(`location.pathname`)) === "/dashboard" ? true : null), 20000, "login").catch(() => false);
    const after = await evaluate(`({ path: location.pathname, email: document.querySelector("#email")?.value ?? null, err: document.querySelector("#email-error, [id$='email-error']")?.textContent ?? null, alert: [...document.querySelectorAll('[role="alert"]')].map((e) => e.textContent.trim()).filter(Boolean).join(" | ") })`);
    const row = { mode, trial: i + 1, rate: RATE, hydratedAtFill, landed, ...after };
    out.push(row);
    console.log(JSON.stringify(row));
  }
}
const sum = (m) => { const r = out.filter((x) => x.mode === m); return `${m}: ${r.filter((x) => x.landed).length}/${r.length} login berhasil; hydratedAtFill=false pada ${r.filter((x) => !x.hydratedAtFill).length}`; };
console.log(sum("lama"));
console.log(sum("baru"));
cleanup();
process.exit(0);
