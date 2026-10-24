// Verifikasi route dinamis (spike U4-0) pada BUILD PRODUKSI: HTTP, prerender, dan navigasi klien di Chrome (CDP).
// Skrip ini membangun ulang aplikasi dengan U4_SPIKE=1 (mengaktifkan halaman uji /u4-spike), lalu menjalankan `next start`.
// Jalankan:  npm run check:dynamic-routes [-- <folder-bukti>]   (tambahkan --no-build bila build U4_SPIKE=1 sudah ada)
// Hasil ditulis ke <folder-bukti>/results.json beserta screenshot. Setelahnya jalankan `npm run build` biasa
// agar build lokal tidak memuat halaman uji.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const DEV = args.includes("--dev"); // hanya bagian browser; pemeriksaan HTTP/prerender hanya bermakna di produksi
const NO_BUILD = args.includes("--no-build") || DEV;
const OUT = resolve(args.find((a) => !a.startsWith("--")) ?? join(ROOT, ".dynamic-routes-check"));
const APP_PORT = 3300;
const CDP_PORT = 9444;
const BASE = `http://localhost:${APP_PORT}`;
const SESSION_KEY = "proyekin-demo-session";

const CHROME = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
]
  .filter(Boolean)
  .find((p) => existsSync(p));
if (!CHROME) {
  console.error("Browser tidak ditemukan. Set CHROME_PATH.");
  process.exit(2);
}
if (!NO_BUILD) {
  console.log("Build produksi dengan U4_SPIKE=1 ...");
  const build = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
    cwd: ROOT,
    env: { ...process.env, U4_SPIKE: "1" },
    stdio: "ignore",
  });
  if (build.status !== 0) {
    console.error("Build gagal (jalankan `npm run build` untuk melihat galat).");
    process.exit(2);
  }
}
if (!DEV && !existsSync(join(ROOT, ".next/BUILD_ID"))) {
  console.error("Build produksi tidak ditemukan.");
  process.exit(2);
}

mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = { http: [], browser: [], failures: [] };
const record = (bucket, name, ok, detail = "") => {
  results[bucket].push({ name, ok: !!ok, detail });
  if (!ok) {
    results.failures.push(`${name} ${detail}`);
    console.log("FAIL:", name, detail);
  } else console.log("ok:  ", name, detail);
};
async function waitFor(fn, ms, label) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      /* coba lagi */
    }
    await sleep(200);
  }
  throw new Error(`Timeout: ${label}`);
}

const procs = [];
const cleanup = () => procs.forEach((p) => { try { p.kill(); } catch { /* sudah berhenti */ } });
process.on("exit", cleanup);

// 1) server (produksi, atau dev dengan --dev)
procs.push(spawn(process.execPath, ["node_modules/next/dist/bin/next", DEV ? "dev" : "start", "-p", String(APP_PORT)], { cwd: ROOT, stdio: "ignore" }));
await waitFor(async () => (await fetch(`${BASE}/masuk`)).ok, 120000, DEV ? "next dev" : "next start");

// 2) HTTP: status dan isi HTML
async function get(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  const html = await res.text();
  return { status: res.status, html, prerender: res.headers.get("x-nextjs-prerender"), noindex: /name="robots"[^>]*noindex/.test(html) };
}
if (!DEV) {
const seedProject = await get("/proyek/p-001");
record("http", "GET /proyek/p-001 (seed): 200 + konten di HTML prerender", seedProject.status === 200 && seedProject.html.includes("Renovasi Gedung Kantor Batam") && seedProject.html.includes('data-spike="found"'), `status ${seedProject.status}, prerender=${seedProject.prerender}`);
const seedTask = await get("/tugas/t-001");
record("http", "GET /tugas/t-001 (seed): 200 + konten di HTML prerender", seedTask.status === 200 && seedTask.html.includes("Pembongkaran dinding partisi lantai 1") && seedTask.html.includes('data-spike="found"'), `status ${seedTask.status}`);
// ID segar (acak) agar status "permintaan pertama" tidak terpengaruh cache disk dari run sebelumnya.
// Next menyimpan hasil render runtime ke disk: permintaan pertama 200, berikutnya memakai salinan tersimpan.
const fresh = String(Math.floor(100 + Math.random() * 800)).padStart(3, "0");
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "");
results.httpUnknown = [];
for (const path of [`/proyek/p-8${fresh}`, `/tugas/t-8${fresh}`, `/proyek/abc-${fresh}`]) {
  const first = await get(path);
  const second = await get(path);
  const row = {
    path,
    firstStatus: first.status,
    repeatStatus: second.status,
    noindex: first.noindex && second.noindex,
    contentFoundInMarkup: /data-spike="found"/.test(markup(first.html)),
    notFoundUiInMarkup: /tidak ditemukan/i.test(markup(first.html)),
  };
  results.httpUnknown.push(row);
  record("http", `GET ${path} (ID segar tidak dikenal): tidak ada konten, noindex, status ${row.firstStatus} lalu ${row.repeatStatus}`, !row.contentFoundInMarkup && row.noindex && [200, 404].includes(row.firstStatus) && [200, 404].includes(row.repeatStatus));
}
const gating = await get("/u4-spike/guard-gating");
const hidden = await get("/u4-spike/guard-hidden");
results.guardHtml = {
  gatingInMarkup: markup(gating.html).includes("KONTEN-UJI-GUARD-GATING"),
  gatingInPayload: gating.html.includes("KONTEN-UJI-GUARD-GATING"),
  hiddenInMarkup: markup(hidden.html).includes("KONTEN-UJI-GUARD-HIDDEN"),
  hiddenInPayload: hidden.html.includes("KONTEN-UJI-GUARD-HIDDEN"),
  hiddenAttrOnWrapper: /data-spike-guard="hidden"[^>]*hidden/.test(hidden.html),
};
record("http", "Guard A (menahan): konten tidak ada di markup HTML prerender (hanya di payload RSC)", !results.guardHtml.gatingInMarkup && results.guardHtml.gatingInPayload);
record("http", "Guard B (menyembunyikan): konten ada di markup HTML prerender dan bertanda hidden", results.guardHtml.hiddenInMarkup && results.guardHtml.hiddenAttrOnWrapper);
}

// 3) browser
const profile = mkdtempSync(join(tmpdir(), "proyekin-dyn-"));
procs.push(spawn(CHROME, ["--headless=new", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu", "--hide-scrollbars", "about:blank"], { stdio: "ignore" }));
const targets = await waitFor(async () => (await fetch(`http://localhost:${CDP_PORT}/json`)).json(), 30000, "chrome devtools");
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
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
const send = (method, params = {}) => new Promise((ok, reject) => { const id = nextId++; pending.set(id, { resolve: ok, reject }); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "evaluate error");
  return r.result.value;
};
await send("Page.enable");
await send("Runtime.enable");

const viewport = (width, height) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
async function goto(path) {
  await send("Page.navigate", { url: `${BASE}${path}` });
  await waitFor(() => evaluate(`document.readyState === "complete" && !!document.querySelector("h1, [data-slot='empty-state']")`), 30000, `muat ${path}`);
  await sleep(500);
}
async function shot(name) {
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
}
const q = (s) => JSON.stringify(s);
const click = (sel) => evaluate(`(() => { const el = document.querySelector(${q(sel)}); if (!el) throw new Error("tidak ada: " + ${q(sel)}); el.click(); return true; })()`);
const path = () => evaluate(`location.pathname`);
const waitPath = (p) => waitFor(async () => (await path()) === p, 15000, `path ${p}`);
/** Yang benar-benar terlihat; halaman sebelumnya bisa tertinggal tersembunyi (React Activity). */
const visible = (sel) => evaluate(`[...document.querySelectorAll(${q(sel)})].filter(e => e.checkVisibility()).map(e => e.dataset.id || e.dataset.spike)`);
const navStatus = () => evaluate(`performance.getEntriesByType("navigation")[0]?.responseStatus ?? null`);
const MARK = "__u4Marker";
const setMark = () => evaluate(`window.${MARK} = "m" + Date.now(); window.${MARK}`);
const markIs = (m) => evaluate(`window.${MARK} === ${q(m)}`);
const setSession = (userId) => evaluate(`sessionStorage.setItem(${q(SESSION_KEY)}, JSON.stringify({ userId: ${q(userId)}, loginAt: new Date().toISOString() }))`);
const bro = (name, ok, detail = "") => record("browser", name, ok, detail);

await viewport(1280, 900);

// a) ID seed lewat URL langsung
await goto("/proyek/p-001");
bro("seed: /proyek/p-001 dibuka langsung", JSON.stringify(await visible('[data-spike="found"]')) === '["p-001"]');
await shot("seed-proyek-p-001-1280");
await goto("/tugas/t-001");
bro("seed: /tugas/t-001 dibuka langsung", JSON.stringify(await visible('[data-spike="found"]')) === '["t-001"]');

// b) ID runtime lewat navigasi klien (router.push)
await goto("/u4-spike");
const mark1 = await setMark();
await click('[data-spike-action="create-project-push"]');
await waitPath("/proyek/p-006");
await waitFor(async () => (await visible('[data-spike="found"]')).includes("p-006"), 15000, "p-006 ditemukan");
bro("runtime: proyek baru p-006 terbuka lewat router.push", true);
bro("runtime: tanpa muat ulang halaman (penanda window tetap ada)", await markIs(mark1));
await shot("runtime-proyek-p-006-1280");

await goto("/u4-spike");
await evaluate(`window.${MARK} = "x"`);
// goto() memuat ulang dokumen: store memori ikut reset → buat ulang urutan dari awal untuk uji task di sesi yang sama
const mark2 = await setMark();
await click('[data-spike-action="create-task-push"]');
await waitPath("/tugas/t-007");
await waitFor(async () => (await visible('[data-spike="found"]')).includes("t-007"), 15000, "t-007 ditemukan");
bro("runtime: tugas baru t-007 terbuka lewat router.push", await markIs(mark2));

// c) ID runtime lewat <Link> (klik tautan), lalu riwayat browser
await goto("/u4-spike");
const mark3 = await setMark();
await click('[data-spike-action="create-project-link"]');
await waitFor(() => evaluate(`!!document.querySelector("[data-spike-created]")`), 10000, "tautan dibuat");
await click("[data-spike-created]");
await waitPath("/proyek/p-006");
await waitFor(async () => (await visible('[data-spike="found"]')).includes("p-006"), 15000, "p-006 via Link");
bro("runtime: proyek baru terbuka lewat klik <Link>", await markIs(mark3));
await evaluate(`history.back()`);
await waitPath("/u4-spike");
await evaluate(`history.forward()`);
await waitPath("/proyek/p-006");
await waitFor(async () => (await visible('[data-spike="found"]')).includes("p-006"), 15000, "forward");
bro("runtime: tombol back lalu forward kembali ke ID runtime yang sama (store memori tetap)", await markIs(mark3));

// d) muat ulang dan URL langsung untuk ID runtime → hilang (J9)
await send("Page.reload");
await waitFor(() => evaluate(`document.readyState === "complete"`), 30000, "reload");
await sleep(800);
const afterReload = { notFound: await visible('[data-spike="not-found"]'), found: await visible('[data-spike="found"]'), status: await navStatus() };
bro("reload pada ID runtime: store reset, tampil state not-found", afterReload.notFound.length === 1 && afterReload.found.length === 0, `status dokumen ${afterReload.status}`);
results.reloadRuntimeId = afterReload;
await viewport(375, 800);
await sleep(300);
await shot("not-found-after-reload-375");
await viewport(1280, 900);
await goto("/proyek/p-006");
bro("URL langsung ke ID runtime (dokumen baru): state not-found", (await visible('[data-spike="not-found"]')).length === 1, `status dokumen ${await navStatus()}`);

// e) ID tidak dikenal: URL langsung dan navigasi klien
for (const [p, label] of [["/proyek/p-999", "proyek p-999"], ["/tugas/t-999", "tugas t-999"], ["/proyek/abc", "proyek abc"]]) {
  await goto(p);
  bro(`tidak dikenal (URL langsung): ${label} → not-found`, (await visible('[data-spike="not-found"]')).length === 1 && (await visible('[data-spike="found"]')).length === 0, `status dokumen ${await navStatus()}`);
}
await shot("not-found-p-999-1280");
await goto("/u4-spike");
const mark4 = await setMark();
await evaluate(`document.querySelector('a[href="/proyek/p-999"]').click()`);
await waitPath("/proyek/p-999");
await waitFor(async () => (await visible('[data-spike="not-found"]')).length === 1, 15000, "not-found via klien");
bro("tidak dikenal (navigasi klien): p-999 → not-found tanpa muat ulang", await markIs(mark4));
await evaluate(`history.back()`);
await waitPath("/u4-spike");
await evaluate(`document.querySelector('a[href="/proyek/p-001"]').click()`);
await waitPath("/proyek/p-001");
await waitFor(async () => (await visible('[data-spike="found"]')).includes("p-001"), 15000, "seed via klien");
bro("seed lewat navigasi klien setelah not-found: p-001 ditemukan", await markIs(mark4));

// f) guard tingkat halaman
await viewport(1280, 900);
await send("Page.navigate", { url: `${BASE}/masuk` });
await waitFor(() => evaluate(`document.readyState === "complete"`), 30000, "masuk");
await evaluate(`sessionStorage.clear()`);
for (const g of ["gating", "hidden"]) {
  await goto(`/u4-spike/guard-${g}`);
  await waitFor(async () => (await visible('[data-spike="guarded-content"]')).length === 1, 15000, `guard ${g} (tanpa sesi)`);
  bro(`guard ${g}: tanpa sesi (akses developer = Owner demo) konten tampil`, true);
}
await shot("guard-hidden-owner-demo-1280");

// Mandor: tidak boleh melihat konten; dialihkan ke /akses-ditolak
await evaluate(`sessionStorage.clear()`);
await setSession("u-003");
const OBSERVER = `(() => { window.__seenGuarded = false; const check = () => { if ([...document.querySelectorAll('[data-spike="guarded-content"]')].some(e => e.checkVisibility())) { window.__seenGuarded = true; try { sessionStorage.setItem("__seenGuarded", "1"); } catch {} } };
  new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true }); })();`;
const observer = await send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVER });
for (const g of ["gating", "hidden"]) {
  await evaluate(`sessionStorage.removeItem("__seenGuarded")`);
  await send("Page.navigate", { url: `${BASE}/u4-spike/guard-${g}` });
  await waitPath("/akses-ditolak");
  await waitFor(() => evaluate(`document.querySelector("h1")?.textContent === "Akses tidak tersedia"`), 15000, "akses ditolak");
  const seen = await evaluate(`sessionStorage.getItem("__seenGuarded")`);
  bro(`guard ${g}: Mandor dialihkan ke /akses-ditolak dan konten terlindung tidak pernah terlihat`, seen === null);
  await evaluate(`sessionStorage.setItem(${q(SESSION_KEY)}, JSON.stringify({ userId: "u-003", loginAt: "x" }))`);
}
// navigasi klien sebagai Mandor
await goto("/u4-spike");
const mark5 = await setMark();
await evaluate(`document.querySelector('a[href="/u4-spike/guard-hidden"]').click()`);
await waitPath("/akses-ditolak");
bro("guard hidden: navigasi KLIEN sebagai Mandor juga dialihkan, tanpa muat ulang dokumen", await markIs(mark5));
await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: observer.identifier });

// Owner dengan sesi: navigasi klien diizinkan
await evaluate(`sessionStorage.clear()`);
await setSession("u-001");
await goto("/u4-spike");
const mark6 = await setMark();
await evaluate(`document.querySelector('a[href="/u4-spike/guard-gating"]').click()`);
await waitPath("/u4-spike/guard-gating");
await waitFor(async () => (await visible('[data-spike="guarded-content"]')).length === 1, 15000, "Owner guard A");
bro("guard gating: Owner (sesi) lewat navigasi klien diizinkan tanpa muat ulang", await markIs(mark6));
await evaluate(`sessionStorage.clear()`);

writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
console.log(results.failures.length ? `\n${results.failures.length} masalah.` : "\nSemua pemeriksaan lolos.");
cleanup();
process.exit(results.failures.length ? 1 : 0);
