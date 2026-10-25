// Pemeriksaan terarah fondasi U4-1 tanpa browser dan tanpa dependency baru:
// relasi seed, tenggat terhadap tanggal acuan demo, store memori, lima role resmi, dan matriks izin UI (access.ts).
// Jalankan: npm run check:u4-foundation
//
// Matriks izin di bawah adalah SALINAN TERPISAH dari rencana U4 final (bagian 2), ditulis sebagai literal,
// bukan dihitung dari access.ts, agar perubahan izin yang tidak disengaja tertangkap.
import "./lib/register-ts.mjs";

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const load = (rel) => import(pathToFileURL(join(SRC, rel)).href);

const failures = [];
let passed = 0;
function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    return;
  }
  failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log("FAIL:", name, detail);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const eq = (name, actual, expected) => check(name, same(actual, expected), `diharapkan ${JSON.stringify(expected)}, hasil ${JSON.stringify(actual)}`);

const mock = await load("data/mock.ts");
const roles = await load("lib/roles.ts");
const labels = await load("lib/labels.ts");
const demo = await load("lib/demo-date.ts");
const access = await load("lib/access.ts");
const store = await load("lib/mock-store.ts");

const { MOCK_USERS, MOCK_PROJECTS, MOCK_TASKS, MOCK_REPORTS, MOCK_DOCUMENTS, MOCK_PROJECT_MEMBERS, MOCK_TEAM_MEMBERS } = mock;
const data = { users: store.SEED.users, projects: store.SEED.projects, members: store.SEED.members, tasks: store.SEED.tasks };
const ids = (arr) => arr.map((x) => x.id);
const walk = (dir) => readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name));
/** Kode tanpa komentar (agar komentar penjelas tidak dianggap pemakaian API). */
const codeOf = (rel) => readFileSync(join(SRC, rel), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

// ---------- 1. lima role resmi, konstanta pilihan, label ----------
const FIVE = ["OWNER", "ADMIN", "MANDOR", "ANGGOTA", "GUEST"];
eq("role: ALL_ROLES tepat lima role resmi", roles.ALL_ROLES, FIVE);
eq("role: ROLE_LABELS memiliki lima kunci yang sama", Object.keys(labels.ROLE_LABELS), FIVE);
eq("role: nilai label", Object.values(labels.ROLE_LABELS), ["Owner", "Admin Kantor", "Mandor", "Anggota Tim", "Guest"]);
eq("role: ROLE_TONES memiliki lima kunci yang sama", Object.keys(labels.ROLE_TONES), FIVE);
check("role: seluruh pengguna seed berperan salah satu dari lima role", MOCK_USERS.every((u) => FIVE.includes(u.role)));
eq("role: ADMIN_PRINCIPAL_ROLE = Admin Kantor", roles.ADMIN_PRINCIPAL_ROLE, "ADMIN");
eq("role: PROJECT_MEMBER_ROLES = Mandor, Anggota Tim", roles.PROJECT_MEMBER_ROLES, ["MANDOR", "ANGGOTA"]);
eq("role: TASK_ASSIGNEE_ROLES = Mandor, Anggota Tim", roles.TASK_ASSIGNEE_ROLES, ["MANDOR", "ANGGOTA"]);
check("role: daftar pilihan adalah konstanta terpisah (bukan referensi yang sama)", roles.PROJECT_MEMBER_ROLES !== roles.TASK_ASSIGNEE_ROLES && roles.PROJECT_MEMBER_ROLES !== roles.ALL_ROLES);
eq("role: ORG_ROLE_OPTIONS memiliki kunci per role pelaku", Object.keys(roles.ORG_ROLE_OPTIONS), FIVE);
eq("role: Owner boleh menambah Admin, Mandor, Anggota", roles.ORG_ROLE_OPTIONS.OWNER, ["ADMIN", "MANDOR", "ANGGOTA"]);
eq("role: Admin hanya boleh menambah Mandor dan Anggota", roles.ORG_ROLE_OPTIONS.ADMIN, ["MANDOR", "ANGGOTA"]);
eq("role: Mandor/Anggota/Guest tidak boleh menambah role apa pun", [roles.ORG_ROLE_OPTIONS.MANDOR, roles.ORG_ROLE_OPTIONS.ANGGOTA, roles.ORG_ROLE_OPTIONS.GUEST], [[], [], []]);
const pickLists = [roles.PROJECT_MEMBER_ROLES, roles.TASK_ASSIGNEE_ROLES, ...Object.values(roles.ORG_ROLE_OPTIONS)];
check("role: Guest dan Owner tidak pernah menjadi pilihan di daftar pilihan mana pun", pickLists.every((l) => !l.includes("GUEST") && !l.includes("OWNER")));
const tukang = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f)).filter((f) => /tukang/i.test(readFileSync(f, "utf8")));
eq("role: tidak ada kata 'Tukang' di src", tukang.map((f) => f.replace(SRC, "")), []);
eq("label: status tugas TODO (bug getStatusLabel lama mengembalikan 'TODO')", labels.getTaskStatusLabel("TODO"), "Belum Dimulai");
eq("label: status tugas IN_PROGRESS", labels.getTaskStatusLabel("IN_PROGRESS"), "Dalam Progres");
eq("label: status proyek PAUSED", labels.getProjectStatusLabel("PAUSED"), "Tertunda");
eq("label: prioritas HIGH", labels.getTaskPriorityLabel("HIGH"), "Tinggi");
eq("label: status laporan dan dokumen dipertahankan", [labels.getReportStatusLabel("SUBMITTED"), labels.getDocumentStatusLabel("ARKIP")], ["Terkirim", "Arsip"]);
eq("label: kunci tak dikenal dikembalikan apa adanya", labels.getTaskStatusLabel("XYZ"), "XYZ");
check("label: Arsip tidak dapat dipilih di form proyek (J7)", !labels.PROJECT_STATUS_OPTIONS.includes("ARCHIVED") && labels.PROJECT_STATUS_OPTIONS.length === 4);
check("label: setiap status/prioritas memiliki label dan nada", ["PROJECT_STATUS", "TASK_STATUS", "TASK_PRIORITY"].every((p) => same(Object.keys(labels[`${p}_LABELS`]), Object.keys(labels[`${p}_TONES`]))));
check("label: setiap DenyReason memiliki teks", ["ROLE", "ARCHIVED", "HAS_TASKS", "HAS_MEMBERSHIPS", "IS_ADMIN_PRINCIPAL", "PROTECTED_ACCOUNT"].every((r) => !!labels.DENY_REASON_LABELS[r]));

// ---------- 2. relasi seed ----------
eq("seed: jumlah pengguna/proyek/tugas", [MOCK_USERS.length, MOCK_PROJECTS.length, MOCK_TASKS.length], [5, 5, 6]);
eq("seed: Admin principal per proyek (adminId)", MOCK_PROJECTS.map((p) => p.adminId ?? null), ["u-002", "u-002", null, null, null]);
check("seed: Admin principal berperan Admin Kantor", MOCK_PROJECTS.filter((p) => p.adminId).every((p) => MOCK_USERS.find((u) => u.id === p.adminId)?.role === "ADMIN"));
eq("seed: managerId lama tetap utuh (legacy)", MOCK_PROJECTS.map((p) => p.managerId), ["u-002", "u-002", "u-001", "u-001", "u-001"]);
eq("seed: keanggotaan PRJ-001", MOCK_PROJECT_MEMBERS.filter((m) => m.projectId === "p-001").map((m) => m.userId), ["u-003", "u-004", "u-005"]);
eq("seed: keanggotaan PRJ-002", MOCK_PROJECT_MEMBERS.filter((m) => m.projectId === "p-002").map((m) => m.userId), ["u-003", "u-005"]);
eq("seed: PRJ-003..005 tanpa anggota (state kosong)", MOCK_PROJECT_MEMBERS.filter((m) => ["p-003", "p-004", "p-005"].includes(m.projectId)), []);
check("seed: keanggotaan unik, proyek dan pengguna ada, role Mandor/Anggota", new Set(MOCK_PROJECT_MEMBERS.map((m) => `${m.projectId}|${m.userId}`)).size === MOCK_PROJECT_MEMBERS.length &&
  MOCK_PROJECT_MEMBERS.every((m) => MOCK_PROJECTS.some((p) => p.id === m.projectId) && roles.PROJECT_MEMBER_ROLES.includes(MOCK_USERS.find((u) => u.id === m.userId)?.role)));
check("seed: Admin principal bukan anggota proyek (field terpisah)", !MOCK_PROJECT_MEMBERS.some((m) => m.userId === "u-002"));
check("seed: setiap tugas punya proyek dan penanggung jawab valid (Mandor/Anggota anggota proyek, J6)", MOCK_TASKS.every((t) => MOCK_PROJECTS.some((p) => p.id === t.projectId) && !!t.assigneeId && access.isValidAssignee(t.assigneeId, t.projectId, data)));
const t5 = MOCK_TASKS.find((t) => t.id === "t-005");
eq("seed: TSK-005 dipindah ke Eko Prasetyo (Mandor, anggota PRJ-002)", [t5.assigneeId, t5.assigneeName], ["u-005", "Eko Prasetyo"]);
check("seed: assigneeName selaras dengan nama pengguna", MOCK_TASKS.every((t) => MOCK_USERS.find((u) => u.id === t.assigneeId)?.name === t.assigneeName));
check("seed: penulis laporan adalah anggota proyek laporannya", MOCK_REPORTS.every((r) => MOCK_PROJECT_MEMBERS.some((m) => m.projectId === r.projectId && m.userId === r.foremanId)));
eq("seed: MOCK_TEAM_MEMBERS utuh dan tidak dipakai sebagai dasar role", [MOCK_TEAM_MEMBERS.length, MOCK_TEAM_MEMBERS.some((m) => m.role === "Project Manager")], [4, true]);
check("seed: store tidak memakai MOCK_TEAM_MEMBERS", !/MOCK_TEAM_MEMBERS/.test(readFileSync(join(SRC, "lib/mock-store.ts"), "utf8")) && !/MOCK_TEAM_MEMBERS/.test(readFileSync(join(SRC, "lib/access.ts"), "utf8")));

// ---------- 3. tanggal acuan demo dan tenggat ----------
eq("demo: DEMO_REFERENCE_DATE", demo.DEMO_REFERENCE_DATE, "2026-03-21");
eq("demo: label tanggal acuan", demo.DEMO_REFERENCE_DATE_LABEL, "21 Maret 2026");
check("demo: pemberitahuan menyebut tanggal acuan dan 'bukan tanggal hari ini'", demo.DEMO_DATE_NOTICE.includes("21 Maret 2026") && demo.DEMO_DATE_NOTICE.includes("bukan tanggal hari ini"));
const deadlines = () => Object.fromEntries(MOCK_TASKS.map((t) => [t.id, demo.getDeadlineState(t)]));
const EXPECTED_DEADLINES = { "t-001": "DONE", "t-002": "OVERDUE", "t-003": "OVERDUE", "t-004": "UPCOMING", "t-005": "UPCOMING", "t-006": "UPCOMING" };
eq("demo: status tenggat per tugas seed", deadlines(), EXPECTED_DEADLINES);
eq("demo: tepat 2 tugas terlambat (TSK-002, TSK-003)", [demo.countOverdue(MOCK_TASKS), MOCK_TASKS.filter((t) => demo.isOverdue(t)).map((t) => t.id)], [2, ["t-002", "t-003"]]);
eq("demo: tenggat sama dengan acuan = jatuh tempo hari ini", demo.getDeadlineState({ status: "TODO", dueDate: "2026-03-21" }), "DUE_TODAY");
eq("demo: evaluasi hanya tanggal (jam diabaikan)", [demo.getDeadlineState({ status: "TODO", dueDate: "2026-03-20T23:59:00Z" }), demo.getDeadlineState({ status: "TODO", dueDate: "2026-03-22T00:00:00Z" })], ["OVERDUE", "UPCOMING"]);
eq("demo: tugas selesai tidak pernah terlambat", demo.getDeadlineState({ status: "DONE", dueDate: "2020-01-01" }), "DONE");
eq("demo: tanpa tenggat / format tidak valid", [demo.getDeadlineState({ status: "TODO" }), demo.getDeadlineState({ status: "TODO", dueDate: "besok" })], ["NONE", "NONE"]);
const RealDate = globalThis.Date;
class FakeDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) super("2030-01-01T00:00:00Z");
    else super(...args);
  }
  static now() {
    return new RealDate("2030-01-01T00:00:00Z").getTime();
  }
}
globalThis.Date = FakeDate;
try {
  eq("demo: hasil tidak berubah saat jam sistem dimajukan ke 2030", deadlines(), EXPECTED_DEADLINES);
} finally {
  globalThis.Date = RealDate;
}
eq("demo: formatDemoDate (UTC, deterministik) dan tanggal tidak valid → null", [demo.formatDemoDate("2026-02-28"), demo.formatDemoDate("2026-03-21T23:30:00-08:00"), demo.formatDemoDate("besok"), demo.formatDemoDate(undefined)], ["28 Feb 2026", "21 Mar 2026", null, null]);
check("demo: sumber tidak memakai jam/tanggal sistem", !/Date\.now\(|new Date\(\s*\)/.test(readFileSync(join(SRC, "lib/demo-date.ts"), "utf8")));
const onOrBefore = (d) => d.slice(0, 10) <= demo.DEMO_REFERENCE_DATE;
check("demo: aktivitas seed (laporan, tanggal mulai tugas, unggahan dokumen) tidak melewati tanggal acuan",
  MOCK_REPORTS.every((r) => onOrBefore(r.date) && onOrBefore(r.submittedAt ?? r.date)) && MOCK_TASKS.every((t) => !t.startDate || onOrBefore(t.startDate)) && MOCK_DOCUMENTS.every((d) => onOrBefore(d.uploadedAt)));

// ---------- 4. store memori ----------
const state0 = store.getMockStoreSnapshot();
check("store: snapshot awal = seed; snapshot server = seed (referensi stabil)", state0 === store.SEED && store.getMockStoreServerSnapshot() === store.SEED && store.getMockStoreServerSnapshot() === store.getMockStoreServerSnapshot());
check("store: seed beku dan memuat data seed", Object.isFrozen(store.SEED) && store.SEED.projects === MOCK_PROJECTS && store.SEED.members === MOCK_PROJECT_MEMBERS);
let notified = 0;
const unsubscribe = store.subscribeMockStore(() => { notified += 1; });
const newProject = store.createProject({ name: "Uji", description: "", status: "DRAFT", startDate: "2026-03-21", endDate: "2026-03-21", budget: 0, progress: 0, client: "-", location: "-" });
eq("store: proyek baru mendapat ID dan kode otomatis", [newProject.id, newProject.code], ["p-006", "PRJ-006"]);
const newTask = store.createTask({ projectId: "p-001", title: "Uji", status: "TODO", priority: "LOW", progress: 0 });
eq("store: tugas baru mendapat ID dan kode otomatis", [newTask.id, newTask.code], ["t-007", "TSK-007"]);
check("store: ID runtime muncul di snapshot klien", store.getMockStoreSnapshot().projects.some((p) => p.id === "p-006") && store.getMockStoreSnapshot().tasks.some((t) => t.id === "t-007"));
check("store: snapshot server tetap seed setelah mutasi (tanpa hydration mismatch)", store.getMockStoreServerSnapshot() === store.SEED && store.SEED.projects.length === 5 && store.SEED.tasks.length === 6);
check("store: array seed (MOCK_*) tidak dimutasi", MOCK_PROJECTS.length === 5 && MOCK_TASKS.length === 6 && !MOCK_PROJECTS.some((p) => p.id === "p-006"));
eq("store: pelanggan diberi tahu sekali per perubahan", notified, 2);
store.resetMockStore();
check("store: reset kembali ke seed dan penghitung ID ikut kembali", store.getMockStoreSnapshot() === store.SEED && store.createProject({ name: "Uji", description: "", status: "DRAFT", startDate: "", endDate: "", budget: 0, progress: 0, client: "-", location: "-" }).id === "p-006");
store.resetMockStore();
unsubscribe();
eq("store: nextEntityNumber", [store.nextEntityNumber([]), store.nextEntityNumber(["p-001", "p-009"])], [1, 10]);
check("store: tanpa penyimpanan permanen atau jaringan (kode, di luar komentar)", !/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest/.test(codeOf("lib/mock-store.ts")));

// ---------- 5. matriks izin UI (access.ts) ----------
const U = (id) => MOCK_USERS.find((u) => u.id === id);
const guest = { id: "u-guest-x", name: "Tamu", email: "tamu@contoh.co.id", role: "GUEST" };
const personas = { owner: U("u-001"), admin: U("u-002"), ahmad: U("u-003"), dewi: U("u-004"), eko: U("u-005"), guest, nobody: null };
const P = { all: ["p-001", "p-002", "p-003", "p-004", "p-005"], active: ["p-001", "p-002", "p-003", "p-004"], two: ["p-001", "p-002"], one: ["p-001"], none: [] };
const T = { all: ["t-001", "t-002", "t-003", "t-004", "t-005", "t-006"], none: [] };

/** @param {string} name @param {(actor: unknown) => boolean} fn @param {Record<string, boolean>} expected */
function matrix(name, fn, expected) {
  for (const [who, actor] of Object.entries(personas)) check(`akses: ${name} — ${who}`, fn(actor) === (expected[who] ?? false), `hasil ${fn(actor)}, diharapkan ${expected[who] ?? false}`);
}
/** Per ID entitas: daftar ID yang diizinkan per persona. */
function perId(name, all, fn, expected) {
  for (const [who, actor] of Object.entries(personas)) eq(`akses: ${name} — ${who}`, all.filter((x) => fn(actor, x)).map((x) => x.id), expected[who] ?? []);
}

// dashboard dan halaman awal (J2)
matrix("dashboard analitik (J2)", (a) => access.canViewDashboard(a), { owner: true, admin: true });
eq("akses: halaman awal per role (J2)", FIVE.map((r) => access.getHomePath(r)), ["/dashboard", "/dashboard", "/tugas", "/tugas", "/"]);

// proyek (J3, G7, G8)
perId("proyek terlihat (G8)", MOCK_PROJECTS, (a, p) => access.canViewProject(a, p, data), { owner: P.all, admin: P.two, ahmad: P.two, eko: P.two, dewi: P.one });
matrix("buat proyek (J3)", (a) => access.canCreateProject(a), { owner: true });
perId("ubah proyek (J3, G7)", MOCK_PROJECTS, (a, p) => access.canEditProject(a, p), { owner: P.active, admin: P.two });
perId("hapus proyek (J3, G7)", MOCK_PROJECTS, (a, p) => access.canDeleteProject(a, p), { owner: P.active });

// L2 keanggotaan (J1, G9)
perId("tetapkan Admin principal (§7A)", MOCK_PROJECTS, (a, p) => access.canAssignAdminPrincipal(a, p), { owner: P.active });
perId("tambah anggota proyek (J1: Mandor tidak)", MOCK_PROJECTS, (a, p) => access.canAddProjectMember(a, p), { owner: P.active, admin: P.two });
const dec = (d) => (d.allowed ? "ALLOW" : d.reason);
eq("akses: keluarkan anggota (seed) — Owner diblokir karena masih memegang tugas (G3)", [dec(access.decideRemoveProjectMember(personas.owner, MOCK_PROJECTS[0], "u-003", data)), dec(access.decideRemoveProjectMember(personas.owner, MOCK_PROJECTS[1], "u-005", data))], ["HAS_TASKS", "HAS_TASKS"]);
eq("akses: keluarkan anggota — Admin ditolak (G9), Mandor/Anggota/Guest/kosong ditolak", ["admin", "ahmad", "dewi", "guest", "nobody"].map((w) => dec(access.decideRemoveProjectMember(personas[w], MOCK_PROJECTS[0], "u-003", data))), ["ROLE", "ROLE", "ROLE", "ROLE", "ROLE"]);
const dataFree = { ...data, members: [...data.members, { projectId: "p-002", userId: "u-004" }, { projectId: "p-005", userId: "u-003" }] };
eq("akses: keluarkan anggota tanpa tugas — Owner boleh; Admin tetap tidak (G9); proyek Arsip ditolak", [dec(access.decideRemoveProjectMember(personas.owner, MOCK_PROJECTS[1], "u-004", dataFree)), dec(access.decideRemoveProjectMember(personas.admin, MOCK_PROJECTS[1], "u-004", dataFree)), dec(access.decideRemoveProjectMember(personas.owner, MOCK_PROJECTS[4], "u-003", dataFree))], ["ALLOW", "ROLE", "ARCHIVED"]);
eq("akses: kandidat anggota proyek hanya Mandor/Anggota yang belum menjadi anggota", [ids(access.getProjectMemberCandidates(MOCK_PROJECTS[0], data)), ids(access.getProjectMemberCandidates(MOCK_PROJECTS[2], data))], [[], ["u-003", "u-004", "u-005"]]);
eq("akses: kandidat Admin principal hanya role Admin Kantor", ids(access.getAdminPrincipalCandidates(data)), ["u-002"]);

// L3 tugas (J1, J5, J6, G1, G5)
perId("tugas terlihat (G5, J5)", MOCK_TASKS, (a, t) => access.canViewTask(a, t, data), { owner: T.all, admin: T.all, ahmad: T.all, eko: T.all, dewi: ["t-002", "t-006"] });
// Audit G8 (follow-up U4-3): "Siti melihat semua tugas seed" harus karena DISTRIBUSI seed, bukan aturan yang terlalu luas.
check("G8: seluruh tugas seed berada di p-001/p-002 (proyek yang Siti tangani sebagai Admin principal)", MOCK_TASKS.every((t) => ["p-001", "p-002"].includes(t.projectId)));
{
  const otherAdmin = { id: "u-102", name: "Admin Lain", email: "admin.lain@contoh.co.id", role: "ADMIN" };
  const p6 = { ...MOCK_PROJECTS[2], id: "p-006", code: "PRJ-006", adminId: undefined }; // proyek runtime tanpa Admin principal
  const p7 = { ...MOCK_PROJECTS[2], id: "p-007", code: "PRJ-007", adminId: "u-102" }; // Admin principal: admin lain
  const mkTask = (id, projectId) => ({ ...MOCK_TASKS[0], id, projectId, assigneeId: undefined, assigneeName: undefined });
  const dataG8 = {
    users: [...data.users, otherAdmin],
    projects: [...data.projects, p6, p7],
    members: [...data.members, { projectId: "p-007", userId: "u-003" }],
    tasks: [...data.tasks, mkTask("t-903", "p-003"), mkTask("t-904", "p-004"), mkTask("t-905", "p-005"), mkTask("t-906", "p-006"), mkTask("t-907", "p-007"), mkTask("t-908", "p-001")],
  };
  const g8 = (actor, fn) => dataG8.tasks.filter((t) => t.id >= "t-903").filter((t) => fn(actor, t)).map((t) => t.id);
  const adminSiti = personas.admin;
  eq("G8: Siti hanya melihat tugas runtime di proyek yang ia tangani (t-908@p-001), bukan p-003/p-004/p-005/p-006/p-007", g8(adminSiti, (a, t) => access.canViewTask(a, t, dataG8)), ["t-908"]);
  eq("G8: Admin lain hanya melihat tugas di proyek miliknya (p-007)", g8(otherAdmin, (a, t) => access.canViewTask(a, t, dataG8)), ["t-907"]);
  eq("G8: Owner melihat semua tugas runtime", g8(personas.owner, (a, t) => access.canViewTask(a, t, dataG8)), ["t-903", "t-904", "t-905", "t-906", "t-907", "t-908"]);
  eq("G8: Mandor (Ahmad) hanya melihat tugas di proyek tempatnya menjadi anggota (p-001, p-007)", g8(personas.ahmad, (a, t) => access.canViewTask(a, t, dataG8)), ["t-907", "t-908"]);
  eq("G8: Anggota Tim (Dewi) tidak melihat tugas runtime tanpa penanggung jawab dirinya", g8(personas.dewi, (a, t) => access.canViewTask(a, t, dataG8)), []);
  for (const [name, fn] of [
    ["ubah field", (a, t) => access.canEditTask(a, t, dataG8)],
    ["ubah status", (a, t) => access.canChangeTaskStatus(a, t, dataG8)],
    ["ganti penanggung jawab", (a, t) => access.canReassignTask(a, t, dataG8)],
  ]) eq(`G8: Siti tidak ${name} tugas di proyek yang bukan miliknya`, g8(adminSiti, fn).filter((id) => id !== "t-908"), []);
  check("G8: untuk Admin, canViewTask selalu sama dengan canViewProject proyek tugasnya", [adminSiti, otherAdmin].every((a) => dataG8.tasks.every((t) => access.canViewTask(a, t, dataG8) === access.canViewProject(a, dataG8.projects.find((p) => p.id === t.projectId), dataG8))));
  check("G8: tugas dengan proyek tidak dikenal tidak terlihat oleh siapa pun", Object.values(personas).every((a) => !access.canViewTask(a, mkTask("t-909", "p-404"), dataG8)));
  const noAdminIdUser = { ...adminSiti, id: "" }; // adminId kosong tidak boleh cocok dengan id kosong
  check("G8: proyek tanpa adminId tidak cocok dengan Admin mana pun (termasuk id kosong)", !access.canViewTask(noAdminIdUser, mkTask("t-910", "p-006"), dataG8) && !access.canViewProject(noAdminIdUser, p6, dataG8));
}
perId("buat tugas", MOCK_PROJECTS, (a, p) => access.canCreateTask(a, p), { owner: P.active, admin: P.two });
perId("ubah field tugas", MOCK_TASKS, (a, t) => access.canEditTask(a, t, data), { owner: T.all, admin: T.all });
perId("ubah status tugas (G1, J5)", MOCK_TASKS, (a, t) => access.canChangeTaskStatus(a, t, data), { owner: T.all, admin: T.all, ahmad: ["t-001", "t-002", "t-004", "t-006"], eko: ["t-002", "t-003", "t-005", "t-006"], dewi: ["t-002", "t-006"] });
perId("ganti penanggung jawab (G1: Mandor hanya tugas Anggota Tim)", MOCK_TASKS, (a, t) => access.canReassignTask(a, t, data), { owner: T.all, admin: T.all, ahmad: ["t-002", "t-006"], eko: ["t-002", "t-006"] });
check("akses: tidak ada hapus tugas untuk role mana pun (J6)", access.canDeleteTask() === false);
const cand = (actor, projectId, taskId) => ids(access.getAssigneeCandidates(actor, MOCK_PROJECTS.find((p) => p.id === projectId), data, MOCK_TASKS.find((t) => t.id === taskId)));
eq("akses: kandidat penanggung jawab Owner/Admin = Mandor/Anggota anggota proyek (J6)", [cand(personas.owner, "p-001"), cand(personas.admin, "p-002"), cand(personas.owner, "p-003"), cand(personas.owner, "p-005")], [["u-003", "u-004", "u-005"], ["u-003", "u-005"], [], []]);
eq("akses: Admin non-principal tidak mendapat kandidat", cand(personas.admin, "p-003"), []);
eq("akses: kandidat Mandor hanya Anggota Tim, hanya untuk tugas yang boleh ia tugaskan ulang (G1)", [cand(personas.ahmad, "p-001", "t-002"), cand(personas.ahmad, "p-001", "t-001"), cand(personas.ahmad, "p-001"), cand(personas.eko, "p-001", "t-006")], [["u-004"], [], [], ["u-004"]]);
eq("akses: Anggota Tim/Guest/kosong tidak mendapat kandidat", ["dewi", "guest", "nobody"].map((w) => cand(personas[w], "p-001", "t-002")), [[], [], []]);
check("akses: penanggung jawab valid wajib Mandor/Anggota anggota proyek (J6)", access.isValidAssignee("u-004", "p-001", data) && !access.isValidAssignee("u-002", "p-001", data) && !access.isValidAssignee("u-004", "p-002", data) && !access.isValidAssignee("u-001", "p-001", data));

// L1 pengguna organisasi (J4, G2, G3, G4)
matrix("lihat pengguna organisasi (J4, J5, G2)", (a) => access.canViewOrgUsers(a), { owner: true, admin: true });
matrix("tambah akun (J4)", (a) => access.canAddOrgUser(a), { owner: true, admin: true });
eq("akses: role yang boleh ditambahkan per pelaku (J4)", Object.keys(personas).map((w) => access.getAddableOrgRoles(personas[w])), [["ADMIN", "MANDOR", "ANGGOTA"], ["MANDOR", "ANGGOTA"], [], [], [], [], []]);
eq("akses: Owner mengubah role/menghapus akun seed — ditahan oleh keterkaitan atau dilindungi (G3, G4)", MOCK_USERS.map((u) => [dec(access.decideChangeOrgUserRole(personas.owner, u, data)), dec(access.decideDeleteOrgUser(personas.owner, u, data))]), [["PROTECTED_ACCOUNT", "PROTECTED_ACCOUNT"], ["IS_ADMIN_PRINCIPAL", "IS_ADMIN_PRINCIPAL"], ["HAS_MEMBERSHIPS", "HAS_MEMBERSHIPS"], ["HAS_MEMBERSHIPS", "HAS_MEMBERSHIPS"], ["HAS_MEMBERSHIPS", "HAS_MEMBERSHIPS"]]);
eq("akses: Admin tidak mengubah role atau menghapus akun siapa pun (J4)", MOCK_USERS.map((u) => [dec(access.decideChangeOrgUserRole(personas.admin, u, data)), dec(access.decideDeleteOrgUser(personas.admin, u, data))]), MOCK_USERS.map(() => ["ROLE", "ROLE"]));
eq("akses: Mandor/Anggota/Guest/kosong tidak mengelola akun", ["ahmad", "dewi", "guest", "nobody"].map((w) => dec(access.decideDeleteOrgUser(personas[w], MOCK_USERS[2], data))), ["ROLE", "ROLE", "ROLE", "ROLE"]);
const free = { id: "u-100", name: "Baru", email: "baru@contoh.co.id", role: "MANDOR" };
const dataFreeUser = { ...data, users: [...data.users, free, { ...free, id: "u-101", role: "ANGGOTA" }, { ...free, id: "u-102", role: "ADMIN" }], tasks: [...data.tasks, { ...MOCK_TASKS[0], id: "t-900", assigneeId: "u-101" }] };
eq("akses: akun tanpa keterkaitan boleh dikelola Owner; yang hanya memegang tugas ditahan (G3)", [dec(access.decideDeleteOrgUser(personas.owner, free, dataFreeUser)), dec(access.decideChangeOrgUserRole(personas.owner, dataFreeUser.users[6], dataFreeUser)), dec(access.decideChangeOrgUserRole(personas.owner, dataFreeUser.users[7], dataFreeUser))], ["ALLOW", "HAS_TASKS", "ALLOW"]);

// Guest dan aktor kosong: semuanya ditolak (fail-closed)
for (const who of ["guest", "nobody"]) {
  const a = personas[who];
  const anyAllowed = [
    access.canViewDashboard(a), access.canViewOrgUsers(a), access.canAddOrgUser(a), access.canCreateProject(a),
    ...MOCK_PROJECTS.flatMap((p) => [access.canViewProject(a, p, data), access.canEditProject(a, p), access.canDeleteProject(a, p), access.canAddProjectMember(a, p), access.canAssignAdminPrincipal(a, p), access.canCreateTask(a, p)]),
    ...MOCK_TASKS.flatMap((t) => [access.canViewTask(a, t, data), access.canEditTask(a, t, data), access.canChangeTaskStatus(a, t, data), access.canReassignTask(a, t, data)]),
  ].some(Boolean);
  check(`akses: ${who} ditolak untuk seluruh aksi`, !anyAllowed);
}
check("akses: access.ts bertanda BUKAN otorisasi/keamanan", /BUKAN OTORISASI DAN BUKAN KONTROL KEAMANAN/.test(readFileSync(join(SRC, "lib/access.ts"), "utf8")));
check("akses: access.ts tidak memuat store/React/jaringan (fungsi murni, di luar komentar)", !/from "react"|mock-store|use-mock|fetch\(|sessionStorage|localStorage/.test(codeOf("lib/access.ts")));
// ---------- 6. U4-3: bagian aplikasi (menu + URL), tujuan login, urutan menu, dan satu sumber aturan ----------
const nav = await load("lib/navigation.ts");
const labelsOf = (actor) => nav.getNavForUser(actor).map((i) => i.label);
const ALL_SECTIONS = ["dashboard", "proyek", "tugas", "laporan", "dokumen", "anggota", "pengaturan"];
const SECTION_MATRIX = {
  owner: ALL_SECTIONS,
  admin: ALL_SECTIONS,
  ahmad: ["proyek", "tugas", "laporan", "dokumen"],
  eko: ["proyek", "tugas", "laporan", "dokumen"],
  dewi: ["proyek", "tugas", "dokumen"],
  guest: [],
  nobody: [],
};
for (const [who, expected] of Object.entries(SECTION_MATRIX)) {
  eq(`akses: bagian aplikasi yang boleh dibuka — ${who} (J2, J5, G2)`, ALL_SECTIONS.filter((s) => access.canAccessSection(personas[who], s)), expected);
}
const FULL_MENU = ["Dashboard", "Proyek", "Tugas", "Laporan", "Dokumen", "Anggota", "Pengaturan"];
eq("menu: Owner dan Admin — urutan lengkap, Dashboard pertama", [labelsOf(personas.owner), labelsOf(personas.admin)], [FULL_MENU, FULL_MENU]);
eq("menu: Mandor — Tugas pertama, tanpa Dashboard/Anggota/Pengaturan (J2, G2)", [labelsOf(personas.ahmad), labelsOf(personas.eko)], [["Tugas", "Proyek", "Laporan", "Dokumen"], ["Tugas", "Proyek", "Laporan", "Dokumen"]]);
eq("menu: Anggota Tim — Tugas pertama, tanpa Dashboard/Anggota/Laporan/Pengaturan (J2, J5)", labelsOf(personas.dewi), ["Tugas", "Proyek", "Dokumen"]);
eq("menu: Guest dan aktor kosong tidak mendapat menu (tanpa App Shell)", [labelsOf(personas.guest), labelsOf(personas.nobody)], [[], []]);
check("menu: tidak ada menu Vendor (kategori B)", nav.NAV_ITEMS.every((i) => !/vendor/i.test(`${i.label} ${i.href}`)));
check("menu: halaman awal tiap role selalu menu pertama", ["owner", "admin", "ahmad", "dewi"].every((w) => nav.getNavForUser(personas[w])[0].href === access.getHomePath(personas[w].role)));
eq("login: tujuan setelah login per role (J2)", FIVE.map((r) => access.getPostLoginPath(r)), ["/dashboard", "/dashboard", "/tugas", "/tugas", "/akses-ditolak"]);
eq("route: bagian untuk path", ["/dashboard", "/proyek", "/proyek/p-001", "/tugas/t-002", "/anggota", "/laporan", "/dokumen", "/pengaturan", "/u4-spike", "/dashboardx", "/"].map((p) => nav.getSectionForPath(p)), ["dashboard", "proyek", "proyek", "tugas", "anggota", "laporan", "dokumen", "pengaturan", null, null, null]);

// Satu sumber aturan: tidak ada salinan literal role di komponen/halaman/navigasi (selain berkas sumber dan SessionShell U3 yang tidak diubah).
const ROLE_LITERAL = /["'](OWNER|ADMIN|MANDOR|ANGGOTA|GUEST)["']/;
const RULE_SOURCES = /(lib[\\/](access|roles|labels)\.ts|data[\\/]mock\.ts|types[\\/]index\.ts|components[\\/]auth[\\/]session-shell\.tsx)$/;
const copies = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f) && !RULE_SOURCES.test(f) && ROLE_LITERAL.test(codeOf(f.slice(SRC.length + 1))));
eq("aturan: tidak ada salinan literal role di luar berkas sumber (navigasi, guard, halaman, komponen)", copies.map((f) => f.slice(SRC.length)), []);
const importers = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f) && !/lib[\\/]access\.ts$/.test(f) && /@\/lib\/access"/.test(readFileSync(f, "utf8"))).map((f) => f.slice(SRC.length + 1).replace(/\\/g, "/")).sort();
eq("aturan: pemakai access.ts hanya navigasi, guard URL/detail, login, dan label (tipe)", importers, ["components/auth/login-form.tsx", "components/auth/path-guard.tsx", "components/detail/entity-detail-placeholders.tsx", "lib/labels.ts", "lib/navigation.ts"]);
check("guard: AccessGuard selalu merender children (pola hidden/inert, bukan menahan) dan memuat peringatan keterbatasan", /hidden=\{status !== "allowed"\}/.test(codeOf("components/auth/access-guard.tsx")) && /BUKAN OTORISASI/.test(readFileSync(join(SRC, "components/auth/access-guard.tsx"), "utf8")));
{
  // SessionShell tidak boleh berubah sejak commit U3 terakhir yang mengubahnya (d3d9516).
  let unchanged = false;
  try {
    execFileSync("git", ["diff", "--quiet", "d3d9516", "--", "proyekin/src/components/auth/session-shell.tsx"], { cwd: join(ROOT, "..") });
    unchanged = true;
  } catch {
    unchanged = false;
  }
  check("guard: SessionShell tidak diubah sejak U3 (git diff terhadap d3d9516 kosong)", unchanged);
}

console.log(failures.length ? `\n${failures.length} masalah dari ${passed + failures.length} pemeriksaan.` : `\nSemua ${passed} pemeriksaan lolos.`);
process.exit(failures.length ? 1 : 0);