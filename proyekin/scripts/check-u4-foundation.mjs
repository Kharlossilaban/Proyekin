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
// U4-7 (U4-O9): pengguna keenam = Admin Kantor kedua (Rina Wulandari). Proyek dan tugas tidak berubah.
eq("seed: jumlah pengguna/proyek/tugas", [MOCK_USERS.length, MOCK_PROJECTS.length, MOCK_TASKS.length], [6, 5, 6]);
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
// U4-7 (U4-O9): Admin Kantor kedua — tidak otomatis menjadi Admin principal atau anggota proyek mana pun.
const rina = MOCK_USERS.find((u) => u.id === "u-006");
eq("seed U4-7: Rina Wulandari (u-006) = Admin Kantor, email rina@proyekin.id", rina && [rina.name, rina.email, rina.role], ["Rina Wulandari", "rina@proyekin.id", "ADMIN"]);
eq("seed U4-7: lima pengguna lama tidak berubah (ID, nama, role)", MOCK_USERS.slice(0, 5).map((u) => [u.id, u.name, u.role]), [["u-001", "Budi Santoso", "OWNER"], ["u-002", "Siti Aminah", "ADMIN"], ["u-003", "Ahmad Rizal", "MANDOR"], ["u-004", "Dewi Lestari", "ANGGOTA"], ["u-005", "Eko Prasetyo", "MANDOR"]]);
check("seed U4-7: Rina bukan Admin principal proyek mana pun", !MOCK_PROJECTS.some((p) => p.adminId === "u-006"));
check("seed U4-7: Rina bukan anggota proyek mana pun dan tidak memegang tugas", !MOCK_PROJECT_MEMBERS.some((m) => m.userId === "u-006") && !MOCK_TASKS.some((t) => t.assigneeId === "u-006"));
check("seed U4-7: daftar akun demo di login dan sesi demo membaca MOCK_USERS (Rina dapat masuk tanpa kode tambahan)", /MOCK_USERS\.map\(/.test(codeOf("components/auth/login-form.tsx")) && /MOCK_USERS\.find\(/.test(codeOf("lib/auth-mock.ts")));
check("seed U4-7: email pengguna unik (login picker membaca MOCK_USERS)", new Set(MOCK_USERS.map((u) => u.email.toLowerCase())).size === MOCK_USERS.length);
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
const newProject = store.createProject({ name: "Uji", description: "", status: "DRAFT", startDate: "2026-03-21", endDate: "2026-03-21", progress: 0, client: "-", location: "-" });
eq("store: proyek baru mendapat ID dan kode otomatis", [newProject.id, newProject.code], ["p-006", "PRJ-006"]);
const newTask = store.createTask({ projectId: "p-001", title: "Uji", status: "TODO", priority: "LOW", progress: 0 });
eq("store: tugas baru mendapat ID dan kode otomatis", [newTask.id, newTask.code], ["t-007", "TSK-007"]);
check("store: ID runtime muncul di snapshot klien", store.getMockStoreSnapshot().projects.some((p) => p.id === "p-006") && store.getMockStoreSnapshot().tasks.some((t) => t.id === "t-007"));
check("store: snapshot server tetap seed setelah mutasi (tanpa hydration mismatch)", store.getMockStoreServerSnapshot() === store.SEED && store.SEED.projects.length === 5 && store.SEED.tasks.length === 6);
check("store: array seed (MOCK_*) tidak dimutasi", MOCK_PROJECTS.length === 5 && MOCK_TASKS.length === 6 && !MOCK_PROJECTS.some((p) => p.id === "p-006"));
eq("store: pelanggan diberi tahu sekali per perubahan", notified, 2);
store.resetMockStore();
check("store: reset kembali ke seed dan penghitung ID ikut kembali", store.getMockStoreSnapshot() === store.SEED && store.createProject({ name: "Uji", description: "", status: "DRAFT", startDate: "", endDate: "", progress: 0, client: "-", location: "-" }).id === "p-006");
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
// U4-7 (U4-O9): kandidat bertambah Rina (u-006) karena ia Admin Kantor; tetap hanya role Admin Kantor.
eq("akses: kandidat Admin principal hanya role Admin Kantor", ids(access.getAdminPrincipalCandidates(data)), ["u-002", "u-006"]);
eq("akses U4-7: Rina tanpa proyek — tidak melihat proyek atau tugas seed (G8)", [ids(access.getVisibleProjects(rina, data)), ids(access.getVisibleTasks(rina, data))], [[], []]);
check("akses U4-7: Rina tidak dapat mengubah proyek atau menambah anggota di proyek mana pun", MOCK_PROJECTS.every((p) => !access.canEditProject(rina, p) && !access.canAddProjectMember(rina, p) && !access.canAssignAdminPrincipal(rina, p)));
eq("akses U4-7: Rina bukan kandidat anggota proyek (hanya Mandor/Anggota Tim)", MOCK_PROJECTS.map((p) => ids(access.getProjectMemberCandidates(p, data)).includes("u-006")), [false, false, false, false, false]);

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
eq("akses: Owner mengubah role/menghapus akun seed — ditahan oleh keterkaitan atau dilindungi (G3, G4)", MOCK_USERS.map((u) => [dec(access.decideChangeOrgUserRole(personas.owner, u, data)), dec(access.decideDeleteOrgUser(personas.owner, u, data))]), [["PROTECTED_ACCOUNT", "PROTECTED_ACCOUNT"], ["IS_ADMIN_PRINCIPAL", "IS_ADMIN_PRINCIPAL"], ["HAS_MEMBERSHIPS", "HAS_MEMBERSHIPS"], ["HAS_MEMBERSHIPS", "HAS_MEMBERSHIPS"], ["HAS_MEMBERSHIPS", "HAS_MEMBERSHIPS"], ["ALLOW", "ALLOW"]]); // u-006 Rina: tanpa keterkaitan (U4-7)
eq("akses: Admin tidak mengubah role atau menghapus akun siapa pun (J4)", MOCK_USERS.map((u) => [dec(access.decideChangeOrgUserRole(personas.admin, u, data)), dec(access.decideDeleteOrgUser(personas.admin, u, data))]), MOCK_USERS.map(() => ["ROLE", "ROLE"]));
eq("akses: Mandor/Anggota/Guest/kosong tidak mengelola akun", ["ahmad", "dewi", "guest", "nobody"].map((w) => dec(access.decideDeleteOrgUser(personas[w], MOCK_USERS[2], data))), ["ROLE", "ROLE", "ROLE", "ROLE"]);
const free = { id: "u-100", name: "Baru", email: "baru@contoh.co.id", role: "MANDOR" };
const dataFreeUser = { ...data, users: [...data.users, free, { ...free, id: "u-101", role: "ANGGOTA" }, { ...free, id: "u-102", role: "ADMIN" }], tasks: [...data.tasks, { ...MOCK_TASKS[0], id: "t-900", assigneeId: "u-101" }] };
eq("akses: akun tanpa keterkaitan boleh dikelola Owner; yang hanya memegang tugas ditahan (G3)", [dec(access.decideDeleteOrgUser(personas.owner, free, dataFreeUser)), dec(access.decideChangeOrgUserRole(personas.owner, dataFreeUser.users.find((u) => u.id === "u-101"), dataFreeUser)), dec(access.decideChangeOrgUserRole(personas.owner, dataFreeUser.users.find((u) => u.id === "u-102"), dataFreeUser))], ["ALLOW", "HAS_TASKS", "ALLOW"]);

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
eq("aturan: pemakai access.ts hanya navigasi, guard URL/detail, login, daftar proyek (U4-4), detail proyek (U4-5), dialog tambah/ubah/hapus proyek (U4-6), store (integritas data U4-6), dan label (tipe)", importers, ["components/auth/login-form.tsx", "components/auth/path-guard.tsx", "components/detail/entity-detail-placeholders.tsx", "components/projects/project-delete-dialog.tsx", "components/projects/project-detail.tsx", "components/projects/project-form-dialog.tsx", "components/projects/project-list.tsx", "lib/labels.ts", "lib/mock-store.ts", "lib/navigation.ts"]);
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

// ---------- 7. U4-5: detail proyek (tab Tim, tugas dalam lingkup, relasi tim, tanpa aksi mutasi) ----------
// Literal sengaja terpisah dari access.ts / project-relations.ts (bukan dihitung dari keduanya).
const rel = await load("lib/project-relations.ts");
perId("tab Tim di detail proyek (U4-5; Anggota Tim tidak, J5)", MOCK_PROJECTS, (a, p) => access.canViewProjectTeam(a, p, data), { owner: P.all, admin: P.two, ahmad: P.two, eko: P.two });
matrix("hanya tugas miliknya (J5)", (a) => access.seesOnlyOwnTasks(a), { dewi: true });
const PROJECT_TASKS = {
  owner: { "p-001": ["t-001", "t-002", "t-003", "t-006"], "p-002": ["t-004", "t-005"] },
  admin: { "p-001": ["t-001", "t-002", "t-003", "t-006"], "p-002": ["t-004", "t-005"] },
  ahmad: { "p-001": ["t-001", "t-002", "t-003", "t-006"], "p-002": ["t-004", "t-005"] },
  eko: { "p-001": ["t-001", "t-002", "t-003", "t-006"], "p-002": ["t-004", "t-005"] },
  dewi: { "p-001": ["t-002", "t-006"] },
  guest: {},
  nobody: {},
};
for (const [who, actor] of Object.entries(personas)) {
  for (const project of MOCK_PROJECTS) {
    eq(`akses: tugas proyek ${project.id} dalam lingkup — ${who} (G5, G8, J5)`, ids(access.getVisibleProjectTasks(actor, project, data)), PROJECT_TASKS[who][project.id] ?? []);
  }
  eq(`akses: gabungan tugas per proyek = getVisibleTasks — ${who}`, ids(MOCK_PROJECTS.flatMap((p) => access.getVisibleProjectTasks(actor, p, data))).sort(), ids(access.getVisibleTasks(actor, data)).sort());
}
eq("relasi: tim p-001 = Admin principal lalu anggota (urutan keanggotaan)", rel.getProjectTeam(MOCK_PROJECTS[0], data).map((e) => [e.user.id, e.isAdminPrincipal]), [["u-002", true], ["u-003", false], ["u-004", false], ["u-005", false]]);
eq("relasi: tim p-002", rel.getProjectTeam(MOCK_PROJECTS[1], data).map((e) => [e.user.id, e.isAdminPrincipal]), [["u-002", true], ["u-003", false], ["u-005", false]]);
eq("relasi: tim p-003..p-005 kosong (tanpa Admin principal dan anggota)", MOCK_PROJECTS.slice(2).map((p) => rel.getProjectTeam(p, data).length), [0, 0, 0]);
eq("relasi: pengguna tidak dikenal dan duplikat dilewati", rel.getProjectTeam({ ...MOCK_PROJECTS[0], adminId: "u-404" }, { users: data.users, members: [...data.members, { projectId: "p-001", userId: "u-003" }, { projectId: "p-001", userId: "u-404" }] }).map((e) => e.user.id), ["u-003", "u-004", "u-005"]);
eq("relasi: nama dari relasi User (u-004, tidak dikenal, kosong)", [rel.getUserName(data.users, "u-004"), rel.getUserName(data.users, "u-404"), rel.getUserName(data.users, undefined)], ["Dewi Lestari", undefined, undefined]);
eq("relasi: nama mengikuti User, bukan salinan teks legacy Task.assigneeName", rel.getUserName(data.users.map((u) => (u.id === "u-004" ? { ...u, name: "Dewi Baru" } : u)), MOCK_TASKS[1].assigneeId), "Dewi Baru");
eq("relasi: periode proyek", [rel.formatProjectPeriod(MOCK_PROJECTS[0]), rel.formatProjectPeriod({ startDate: "2026-01-15", endDate: "" }), rel.formatProjectPeriod({ startDate: "", endDate: "" })], ["15 Jan 2026 – 30 Jun 2026", "15 Jan 2026", "—"]);
{
  const detail = codeOf("components/projects/project-detail.tsx");
  // U4-6: detail kini memuat aksi ubah/hapus, tetapi HANYA lewat dialog khusus; detail sendiri tidak menulis store dan tidak
  // memuat kontrol form mentah (tag HTML huruf kecil; komponen <Button> dari design system dipakai untuk tombol tutup pesan). Asersi "hanya baca" lama dipersempit (bukan dilonggarkan): kontrol mentah tetap dilarang,
  // penulisan store tetap dilarang, dan satu-satunya onClick adalah tombol tutup pada banner sukses; penutupnya hanya
  // menghapus pesan/penanda URL dan memindahkan fokus (daftar literal).
  check("detail proyek: tanpa kontrol mentah (button, form, input, select, textarea) dan tanpa penulisan store langsung", !/<button|<form|<input|<select|<textarea/.test(detail) && !/lib\/mock-store"/.test(detail) && !/createProject|createTask|updateProject|deleteProject|resetMockStore/.test(detail));
  eq("detail proyek: satu-satunya onClick adalah tombol tutup banner sukses", [...detail.matchAll(/onClick=\{([^}]*)\}/g)].map((m) => m[1].trim()), ["onDismiss"]);
  eq("detail proyek: penutup banner hanya menghapus pesan/penanda URL dan memindahkan fokus", [...detail.matchAll(/onDismiss=\{\(\) => \{([^}]*)\}\}/g)].map((m) => m[1].replace(/\s+/g, " ").trim()), ["router.replace(pathname); onDismissed();", "setSavedNotice(null); focusSelectedTab();"]);
  check("detail proyek: tidak menautkan ke detail tugas (U4-9)", !/href=\{?[`"']\/tugas/.test(detail));
  check("detail proyek: aksi ubah/hapus hanya lewat canEditProject/canDeleteProject dan dialog khusus (U4-6)", /canEditProject\(actor, project\)/.test(detail) && /canDeleteProject\(actor, project\)/.test(detail) && /<ProjectFormDialog/.test(detail) && /<ProjectDeleteDialog/.test(detail));
  check("detail proyek: nama penanggung jawab dari relasi User, bukan Task.assigneeName", /getUserName\(/.test(detail) && !/task\.assigneeName/.test(detail));
  check("detail proyek: memakai fungsi access.ts untuk tab Tim, tugas, dan email (tanpa aturan role sendiri)", /canViewProjectTeam/.test(detail) && /getVisibleProjectTasks/.test(detail) && /canViewOrgUsers/.test(detail) && /canViewProject\b/.test(detail));
  check("detail proyek: memakai AccessGuard dan menampilkan DemoDataNotice tenggat", /<AccessGuard/.test(detail) && /<DemoDataNotice showDeadlineReference/.test(detail));
}

// ---------- 8. U4-6: CRUD proyek (hapus ditolak bila ada Task/ProjectMember/Admin principal, tanpa kaskade, Arsip hanya baca) ----------
// Literal sengaja terpisah dari access.ts / mock-store.ts / project-validation.ts (bukan dihitung dari ketiganya).
const val = await load("lib/project-validation.ts");
const decOf = (who, project, d = data) => dec(access.decideDeleteProject(personas[who], project, d));
eq("hapus proyek (seed) — Owner: p-001/p-002 ditolak (tugas), p-003/p-004 boleh, p-005 Arsip ditolak", MOCK_PROJECTS.map((p) => decOf("owner", p)), ["HAS_TASKS", "HAS_TASKS", "ALLOW", "ALLOW", "ARCHIVED"]);
for (const who of ["admin", "ahmad", "eko", "dewi", "guest", "nobody"]) {
  eq(`hapus proyek (seed) — ${who}: selalu ditolak karena role (J3), termasuk p-003/p-004 dan Arsip`, MOCK_PROJECTS.map((p) => decOf(who, p)), ["ROLE", "ROLE", "ROLE", "ROLE", "ROLE"]);
}
eq("hapus proyek: penghalang p-001 (4 tugas, 3 anggota, Admin principal)", access.getProjectDeleteBlockers(MOCK_PROJECTS[0], data), [{ reason: "HAS_TASKS", count: 4 }, { reason: "HAS_MEMBERSHIPS", count: 3 }, { reason: "IS_ADMIN_PRINCIPAL", count: 1 }]);
eq("hapus proyek: penghalang p-002 (2 tugas, 2 anggota, Admin principal)", access.getProjectDeleteBlockers(MOCK_PROJECTS[1], data), [{ reason: "HAS_TASKS", count: 2 }, { reason: "HAS_MEMBERSHIPS", count: 2 }, { reason: "IS_ADMIN_PRINCIPAL", count: 1 }]);
eq("hapus proyek: p-003..p-005 tanpa penghalang", MOCK_PROJECTS.slice(2).map((p) => access.getProjectDeleteBlockers(p, data)), [[], [], []]);
{
  const p3 = MOCK_PROJECTS[2];
  const base = { users: data.users, projects: data.projects, members: [], tasks: [] };
  const onlyTask = { ...base, tasks: [{ ...MOCK_TASKS[0], id: "t-900", projectId: "p-003" }] };
  const onlyMember = { ...base, members: [{ projectId: "p-003", userId: "u-003" }] };
  eq("hapus proyek: hanya Task → HAS_TASKS", decOf("owner", p3, onlyTask), "HAS_TASKS");
  eq("hapus proyek: hanya ProjectMember → HAS_MEMBERSHIPS", decOf("owner", p3, onlyMember), "HAS_MEMBERSHIPS");
  eq("hapus proyek: hanya Admin principal (adminId) → IS_ADMIN_PRINCIPAL", decOf("owner", { ...p3, adminId: "u-002" }, base), "IS_ADMIN_PRINCIPAL");
  const otherProject = { ...base, tasks: [{ ...MOCK_TASKS[0], id: "t-901", projectId: "p-004" }], members: [{ projectId: "p-004", userId: "u-003" }] };
  eq("hapus proyek: tanpa keterkaitan → ALLOW; relasi proyek lain tidak menghalangi", [decOf("owner", p3, base), decOf("owner", p3, otherProject)], ["ALLOW", "ALLOW"]);
}
check("proyek Arsip hanya baca: isProjectReadOnly", access.isProjectReadOnly(MOCK_PROJECTS[4]) && MOCK_PROJECTS.slice(0, 4).every((p) => !access.isProjectReadOnly(p)));

// store: ubah dan hapus (tanpa kaskade, relasi terjaga, Arsip dan seed tidak termutasi)
{
  const edit = { name: "Renovasi Gedung Kantor (ubah)", client: "Klien Baru", description: "", location: "", startDate: "", endDate: "", status: "PAUSED" };
  const edited = store.updateProject("p-001", edit);
  check("store ubah: field terubah; ID, kode, adminId, progres, managerId terjaga", !!edited && edited.name === edit.name && edited.status === "PAUSED" && edited.id === "p-001" && edited.code === "PRJ-001" && edited.adminId === "u-002" && edited.progress === MOCK_PROJECTS[0].progress && edited.managerId === MOCK_PROJECTS[0].managerId);
  check("store ubah: anggota dan tugas tidak tersentuh (referensi sama), proyek lain sama", store.getMockStoreSnapshot().members === store.SEED.members && store.getMockStoreSnapshot().tasks === store.SEED.tasks && store.getMockStoreSnapshot().projects.slice(1).every((p, i) => p === MOCK_PROJECTS[i + 1]));
  check("store ubah: array seed tidak dimutasi", MOCK_PROJECTS[0].name === "Renovasi Gedung Kantor Batam" && MOCK_PROJECTS[0].status === "ON_PROGRESS");
  store.resetMockStore();
  const before = store.getMockStoreSnapshot();
  let calls = 0;
  const off = store.subscribeMockStore(() => { calls += 1; });
  check("store ubah: proyek Arsip ditolak (null) tanpa perubahan", store.updateProject("p-005", edit) === null && store.getMockStoreSnapshot() === before);
  check("store ubah: ID tidak dikenal ditolak (null) tanpa perubahan", store.updateProject("p-404", edit) === null && store.getMockStoreSnapshot() === before);
  check("store hapus: proyek Arsip ditolak (false) tanpa perubahan", store.deleteProject("p-005") === false && store.getMockStoreSnapshot() === before);
  check("store hapus: p-001 dan p-002 ditolak (tugas, anggota, Admin principal) tanpa perubahan", store.deleteProject("p-001") === false && store.deleteProject("p-002") === false && store.getMockStoreSnapshot() === before);
  check("store hapus: ID tidak dikenal ditolak", store.deleteProject("p-404") === false && store.getMockStoreSnapshot() === before);
  eq("store: penolakan tidak memberi tahu pelanggan", calls, 0);
  check("store hapus: p-003 (tanpa keterkaitan) terhapus; tugas dan anggota seed utuh (tanpa kaskade)", store.deleteProject("p-003") === true && !store.getMockStoreSnapshot().projects.some((p) => p.id === "p-003") && store.getMockStoreSnapshot().projects.length === 4 && store.getMockStoreSnapshot().tasks === store.SEED.tasks && store.getMockStoreSnapshot().members === store.SEED.members);
  check("store hapus: array seed tidak dimutasi", MOCK_PROJECTS.length === 5 && MOCK_PROJECTS.some((p) => p.id === "p-003"));
  store.resetMockStore();
  const runtime = store.createProject({ name: "Runtime", description: "", status: "DRAFT", startDate: "", endDate: "", progress: 0, client: "-", location: "" });
  eq("store hapus: proyek runtime tanpa keterkaitan terhapus", [store.deleteProject(runtime.id), store.getMockStoreSnapshot().projects.some((p) => p.id === runtime.id)], [true, false]);
  eq("store: ID/kode proyek yang dihapus tidak dipakai ulang (temuan code-review)", [runtime.id, store.createProject({ name: "Sesudah hapus", description: "", status: "DRAFT", startDate: "", endDate: "", progress: 0, client: "-", location: "" }).code], ["p-006", "PRJ-007"]);
  store.resetMockStore();
  const r2 = store.createProject({ name: "Runtime 2", description: "", status: "DRAFT", startDate: "", endDate: "", progress: 0, client: "-", location: "" });
  const t2 = store.createTask({ projectId: r2.id, title: "Tugas uji", status: "TODO", priority: "LOW", progress: 0 });
  check("store hapus: proyek runtime dengan tugas ditolak; tugas tetap ada", store.deleteProject(r2.id) === false && store.getMockStoreSnapshot().projects.some((p) => p.id === r2.id) && store.getMockStoreSnapshot().tasks.some((t) => t.id === t2.id));
  const r3 = store.createProject({ name: "Runtime 3", description: "", status: "DRAFT", startDate: "", endDate: "", progress: 0, client: "-", location: "", adminId: "u-002" });
  check("store hapus: proyek runtime dengan Admin principal ditolak", store.deleteProject(r3.id) === false && store.getMockStoreSnapshot().projects.some((p) => p.id === r3.id));
  store.resetMockStore();
  off();
}
check("store: updateProject/deleteProject tanpa pemeriksaan role, tanpa penyimpanan permanen atau jaringan", !/localStorage|sessionStorage|fetch\(/.test(codeOf("lib/mock-store.ts")) && !/\.role\b/.test(codeOf("lib/mock-store.ts")));

// validasi form proyek
{
  const ok = { name: "Proyek Uji", client: "Klien", location: "", startDate: "", endDate: "", status: "DRAFT", description: "" };
  const errs = (patch) => Object.keys(val.validateProjectForm({ ...ok, ...patch })).sort();
  eq("validasi: hanya nama dan klien wajib; lokasi, tanggal, deskripsi boleh kosong", errs({}), []);
  eq("validasi: nama kosong/spasi, klien kosong", [errs({ name: "   " }), errs({ client: "" })], [["name"], ["client"]]);
  eq("validasi: nama 2 karakter ditolak, 3 diterima, 120 diterima, 121 ditolak", [errs({ name: "ab" }), errs({ name: "abc" }), errs({ name: "a".repeat(120) }), errs({ name: "a".repeat(121) })], [["name"], [], [], ["name"]]);
  eq("validasi: batas klien 120, lokasi 160, deskripsi 1.000", [errs({ client: "k".repeat(121) }), errs({ location: "l".repeat(161) }), errs({ description: "d".repeat(1001) }), errs({ client: "k".repeat(120), location: "l".repeat(160), description: "d".repeat(1000) })], [["client"], ["location"], ["description"], []]);
  eq("validasi: tanggal valid, tidak ada di kalender, format salah", [errs({ startDate: "2026-02-28" }), errs({ startDate: "2026-02-30" }), errs({ endDate: "28-02-2026" })], [[], ["startDate"], ["endDate"]]);
  eq("validasi: selesai sebelum mulai ditolak; sama atau sesudah diterima; satu ujung saja diterima", [errs({ startDate: "2026-03-02", endDate: "2026-03-01" }), errs({ startDate: "2026-03-01", endDate: "2026-03-01" }), errs({ startDate: "2026-03-01", endDate: "2026-04-01" }), errs({ endDate: "2026-04-01" })], [["endDate"], [], [], []]);
  eq("validasi: status — Arsip dan nilai asing ditolak", [errs({ status: "ARCHIVED" }), errs({ status: "XYZ" }), errs({ status: "COMPLETED" })], [["status"], ["status"], []]);
  eq("normalisasi: teks dirapikan, opsional kosong menjadi string kosong", val.normalizeProjectValues({ ...ok, name: "  Proyek  ", client: " Klien ", location: "  ", description: " x " }), { ...ok, name: "Proyek", client: "Klien", location: "", description: "x" });
}
eq("status yang dapat dipilih di form: tanpa Arsip (J7)", labels.PROJECT_STATUS_OPTIONS, ["DRAFT", "ON_PROGRESS", "PAUSED", "COMPLETED"]);
{
  const form = codeOf("components/projects/project-form.tsx");
  const dlg = codeOf("components/projects/project-form-dialog.tsx");
  const del = codeOf("components/projects/project-delete-dialog.tsx");
  check("U4-6: form dan dialog tidak memuat penetapan Admin principal (itu U4-7); dialog hapus hanya membaca nama Admin untuk pesan", ![form, dlg].some((c) => /adminId/.test(c)) && ![form, dlg, del].some((c) => /canAssignAdminPrincipal|getAdminPrincipalCandidates/.test(c)) && (del.match(/adminId/g) ?? []).length === 1 && /getUserName\(data\.users, project\.adminId\)/.test(del));
  check("U4-6: dialog tambah/ubah memakai canCreateProject/canEditProject dan memeriksa ulang terhadap snapshot terbaru saat menyimpan", /canCreateProject\(actor\)/.test(dlg) && /canEditProject\(actor, latest\)/.test(dlg) && /getMockStoreSnapshot\(\)/.test(dlg));
  check("U4-6: dialog hapus memakai decideDeleteProject dan getProjectDeleteBlockers (tanpa aturan sendiri)", /decideDeleteProject\(actor, latest, fresh\)/.test(del) && /getProjectDeleteBlockers\(project, data\)/.test(del));
  check("U4-6: tanpa penghapusan berantai dan tanpa penyimpanan permanen di form/dialog", ![form, dlg, del].some((c) => /tasks\.filter|members\.filter|localStorage|sessionStorage|fetch\(/.test(c)));
}

// ---------- 9. U4-7: anggota proyek dan Admin principal (tambah, keluarkan, tetapkan, ganti, cabut) ----------
// Literal sengaja terpisah dari access.ts / mock-store.ts / labels.ts (bukan dihitung dari ketiganya). Fungsi yang belum ada
// dicatat sebagai GAGAL (bukan crash) agar fase RED terbaca utuh.
{
  const safe = (f) => {
    try {
      return f();
    } catch (e) {
      return `ERROR: ${e?.message ?? e}`;
    }
  };
  const decS = (f) => safe(() => dec(f()));
  const rinaP = U("u-006");
  const P_ = Object.fromEntries(MOCK_PROJECTS.map((p) => [p.id, p]));
  const who7 = { owner: personas.owner, siti: personas.admin, rina: rinaP, ahmad: personas.ahmad, eko: personas.eko, dewi: personas.dewi, guest, nobody: null };

  // 9a. kelayakan kandidat (satu sumber; dipakai juga oleh store tanpa membaca role sendiri)
  eq("U4-7 kandidat anggota: hanya Mandor/Anggota Tim (Owner, Admin Kantor, Guest tidak)", safe(() => MOCK_USERS.map((u) => access.isEligibleProjectMember(u))), [false, false, true, true, true, false]);
  eq("U4-7 kandidat Admin principal: hanya Admin Kantor (Siti, Rina)", safe(() => MOCK_USERS.map((u) => access.isEligibleAdminPrincipal(u))), [false, true, false, false, false, true]);
  check("U4-7 kandidat: Guest dan pengguna kosong tidak pernah layak", safe(() => !access.isEligibleProjectMember(guest) && !access.isEligibleAdminPrincipal(guest) && !access.isEligibleProjectMember(undefined) && !access.isEligibleAdminPrincipal(undefined)) === true);

  // 9b. tambah anggota: Owner atau Admin principal proyek itu; kandidat Mandor/Anggota Tim; tanpa duplikat; bukan Arsip
  eq("U4-7 tambah anggota — Owner: p-003 Ahmad boleh, p-004 (Selesai) boleh, p-001 Ahmad sudah anggota, p-005 Arsip",
    [decS(() => access.decideAddProjectMember(personas.owner, P_["p-003"], "u-003", data)), decS(() => access.decideAddProjectMember(personas.owner, P_["p-004"], "u-003", data)), decS(() => access.decideAddProjectMember(personas.owner, P_["p-001"], "u-003", data)), decS(() => access.decideAddProjectMember(personas.owner, P_["p-005"], "u-003", data))],
    ["ALLOW", "ALLOW", "ALREADY_MEMBER", "ARCHIVED"]);
  eq("U4-7 tambah anggota — Owner: kandidat bukan Mandor/Anggota ditolak (Owner, Admin Kantor Siti/Rina), pengguna tidak dikenal",
    ["u-001", "u-002", "u-006", "u-404"].map((id) => decS(() => access.decideAddProjectMember(personas.owner, P_["p-003"], id, data))),
    ["INVALID_CANDIDATE", "INVALID_CANDIDATE", "INVALID_CANDIDATE", "USER_NOT_FOUND"]);
  eq("U4-7 tambah anggota — Admin principal (Siti): p-002 Dewi boleh; p-001 Dewi sudah anggota; p-003 bukan proyeknya",
    [decS(() => access.decideAddProjectMember(personas.admin, P_["p-002"], "u-004", data)), decS(() => access.decideAddProjectMember(personas.admin, P_["p-001"], "u-004", data)), decS(() => access.decideAddProjectMember(personas.admin, P_["p-003"], "u-003", data))],
    ["ALLOW", "ALREADY_MEMBER", "ROLE"]);
  eq("U4-7 tambah anggota — Rina (Admin lain), Mandor, Anggota Tim, Guest, aktor kosong: ditolak karena role",
    ["rina", "ahmad", "eko", "dewi", "guest", "nobody"].map((w) => decS(() => access.decideAddProjectMember(who7[w], P_["p-002"], "u-004", data))),
    ["ROLE", "ROLE", "ROLE", "ROLE", "ROLE", "ROLE"]);
  eq("U4-7 tambah anggota — kandidat seed per proyek (tanpa Rina)", MOCK_PROJECTS.map((p) => ids(access.getProjectMemberCandidates(p, data))), [[], ["u-004"], ["u-003", "u-004", "u-005"], ["u-003", "u-004", "u-005"], ["u-003", "u-004", "u-005"]]);

  // 9c. keluarkan anggota: Owner saja; diblokir bila masih tercatat di tugas APA PUN (termasuk Selesai); bukan Arsip
  eq("U4-7 jumlah tugas anggota (total, selesai): p-001 Ahmad 1/1 selesai, Dewi 2/0, Eko 1/0; p-002 Ahmad 1/0, Eko 1/0; p-003 Ahmad 0",
    safe(() => [["p-001", "u-003"], ["p-001", "u-004"], ["p-001", "u-005"], ["p-002", "u-003"], ["p-002", "u-005"], ["p-003", "u-003"]].map(([p, u]) => access.countMemberTasks(P_[p], u, data))),
    [{ total: 1, done: 1 }, { total: 2, done: 0 }, { total: 1, done: 0 }, { total: 1, done: 0 }, { total: 1, done: 0 }, { total: 0, done: 0 }]);
  eq("U4-7 keluarkan — Owner, seed: semua anggota p-001/p-002 diblokir HAS_TASKS (termasuk Ahmad yang tugasnya Selesai)",
    [["p-001", "u-003"], ["p-001", "u-004"], ["p-001", "u-005"], ["p-002", "u-003"], ["p-002", "u-005"]].map(([p, u]) => decS(() => access.decideRemoveProjectMember(personas.owner, P_[p], u, data))),
    ["HAS_TASKS", "HAS_TASKS", "HAS_TASKS", "HAS_TASKS", "HAS_TASKS"]);
  {
    const onlyDone = { ...data, members: [...data.members, { projectId: "p-003", userId: "u-004" }], tasks: [...data.tasks, { ...MOCK_TASKS[0], id: "t-950", projectId: "p-003", assigneeId: "u-004", status: "DONE", progress: 100 }] };
    eq("U4-7 keluarkan — hanya tugas Selesai tetap memblokir (fail-closed)", decS(() => access.decideRemoveProjectMember(personas.owner, P_["p-003"], "u-004", onlyDone)), "HAS_TASKS");
    const freeMember = { ...data, members: [...data.members, { projectId: "p-003", userId: "u-003" }] };
    eq("U4-7 keluarkan — Owner: anggota tanpa tugas boleh; bukan anggota → NOT_MEMBER; pengguna tak dikenal → USER_NOT_FOUND",
      [decS(() => access.decideRemoveProjectMember(personas.owner, P_["p-003"], "u-003", freeMember)), decS(() => access.decideRemoveProjectMember(personas.owner, P_["p-003"], "u-003", data)), decS(() => access.decideRemoveProjectMember(personas.owner, P_["p-003"], "u-404", data))],
      ["ALLOW", "NOT_MEMBER", "USER_NOT_FOUND"]);
    eq("U4-7 keluarkan — Admin principal (Siti), Rina, Mandor, Anggota Tim, Guest, kosong: ROLE (Owner saja)",
      ["siti", "rina", "ahmad", "dewi", "guest", "nobody"].map((w) => decS(() => access.decideRemoveProjectMember(who7[w], P_["p-003"], "u-003", freeMember))),
      ["ROLE", "ROLE", "ROLE", "ROLE", "ROLE", "ROLE"]);
  }
  perId("U4-7 tombol Keluarkan tampil (Owner, bukan Arsip)", MOCK_PROJECTS, (a, p) => safe(() => access.canRemoveProjectMembers(a, p)) === true, { owner: P.active });

  // 9d. Admin principal: tetapkan, ganti, cabut — Owner saja; satu per proyek; Admin aktif bukan kandidat pengganti
  eq("U4-7 kandidat pengganti Admin: tanpa Admin yang sedang menjabat", safe(() => MOCK_PROJECTS.map((p) => ids(access.getAdminReplacementCandidates(p, data)))), [["u-006"], ["u-006"], ["u-002", "u-006"], ["u-002", "u-006"], ["u-002", "u-006"]]);
  eq("U4-7 tetapkan (p-003 tanpa Admin) — Owner: Rina boleh; Mandor tidak layak; pengguna tak dikenal; Arsip p-005",
    [decS(() => access.decideAssignAdminPrincipal(personas.owner, P_["p-003"], "u-006", undefined, data)), decS(() => access.decideAssignAdminPrincipal(personas.owner, P_["p-003"], "u-003", undefined, data)), decS(() => access.decideAssignAdminPrincipal(personas.owner, P_["p-003"], "u-404", undefined, data)), decS(() => access.decideAssignAdminPrincipal(personas.owner, P_["p-005"], "u-006", undefined, data))],
    ["ALLOW", "INVALID_CANDIDATE", "USER_NOT_FOUND", "ARCHIVED"]);
  eq("U4-7 ganti (p-001 Admin Siti) — Owner: ke Rina boleh; ke Siti sendiri SAME_ADMIN; p-004 Selesai boleh ditetapkan",
    [decS(() => access.decideAssignAdminPrincipal(personas.owner, P_["p-001"], "u-006", "u-002", data)), decS(() => access.decideAssignAdminPrincipal(personas.owner, P_["p-001"], "u-002", "u-002", data)), decS(() => access.decideAssignAdminPrincipal(personas.owner, P_["p-004"], "u-002", undefined, data))],
    ["ALLOW", "SAME_ADMIN", "ALLOW"]);
  eq("U4-7 tetapkan/ganti — stale: Admin berbeda dari yang terlihat saat dialog dibuka → ADMIN_CHANGED",
    [decS(() => access.decideAssignAdminPrincipal(personas.owner, P_["p-001"], "u-006", undefined, data)), decS(() => access.decideAssignAdminPrincipal(personas.owner, P_["p-003"], "u-006", "u-002", data))],
    ["ADMIN_CHANGED", "ADMIN_CHANGED"]);
  eq("U4-7 tetapkan/ganti — Siti (Admin principal), Rina, Mandor, Anggota Tim, Guest, kosong: ROLE (Owner saja)",
    ["siti", "rina", "ahmad", "dewi", "guest", "nobody"].map((w) => decS(() => access.decideAssignAdminPrincipal(who7[w], P_["p-001"], "u-006", "u-002", data))),
    ["ROLE", "ROLE", "ROLE", "ROLE", "ROLE", "ROLE"]);
  eq("U4-7 cabut — Owner: p-001 Siti boleh; p-003 tanpa Admin → NO_ADMIN; Admin berubah → ADMIN_CHANGED; Arsip",
    [decS(() => access.decideRevokeAdminPrincipal(personas.owner, P_["p-001"], "u-002")), decS(() => access.decideRevokeAdminPrincipal(personas.owner, P_["p-003"], "u-002")), decS(() => access.decideRevokeAdminPrincipal(personas.owner, P_["p-001"], "u-006")), decS(() => access.decideRevokeAdminPrincipal(personas.owner, { ...P_["p-005"], adminId: "u-002" }, "u-002"))],
    ["ALLOW", "NO_ADMIN", "ADMIN_CHANGED", "ARCHIVED"]);
  eq("U4-7 cabut — selain Owner ditolak (termasuk Siti yang menjabat)",
    ["siti", "rina", "ahmad", "dewi", "guest", "nobody"].map((w) => decS(() => access.decideRevokeAdminPrincipal(who7[w], P_["p-001"], "u-002"))),
    ["ROLE", "ROLE", "ROLE", "ROLE", "ROLE", "ROLE"]);

  // 9e. akses setelah perubahan (G8): Admin lama kehilangan akses, Admin baru mendapat akses; role global tidak berubah
  {
    const replaced = { ...data, projects: data.projects.map((p) => (p.id === "p-001" ? { ...p, adminId: "u-006" } : p)) };
    const pr = replaced.projects[0];
    eq("U4-7 setelah ganti p-001 ke Rina: Siti tidak lagi melihat/mengubah/menambah; Rina ya",
      [access.canViewProject(personas.admin, pr, replaced), access.canEditProject(personas.admin, pr), access.canAddProjectMember(personas.admin, pr), access.canViewProject(rinaP, pr, replaced), access.canEditProject(rinaP, pr), access.canAddProjectMember(rinaP, pr)],
      [false, false, false, true, true, true]);
    eq("U4-7 setelah ganti: proyek Siti lainnya (p-002) tidak terdampak; Rina hanya p-001", [ids(access.getVisibleProjects(personas.admin, replaced)), ids(access.getVisibleProjects(rinaP, replaced))], [["p-002"], ["p-001"]]);
    eq("U4-7 stale akses: Siti setelah diganti tidak dapat menambah anggota (ROLE)", decS(() => access.decideAddProjectMember(personas.admin, pr, "u-004", replaced)), "ROLE");
    const noAdmin = { ...data.projects[0] };
    delete noAdmin.adminId;
    const revoked = { ...data, projects: data.projects.map((p) => (p.id === "p-001" ? noAdmin : p)) };
    eq("U4-7 setelah cabut p-001: Siti tidak lagi melihat p-001; anggota dan tugas tetap", [access.canViewProject(personas.admin, revoked.projects[0], revoked), revoked.members.length, revoked.tasks.length], [false, 5, 6]);
    const archivedNow = { ...data, projects: data.projects.map((p) => (p.id === "p-002" ? { ...p, status: "ARCHIVED" } : p)) };
    eq("U4-7 stale: proyek menjadi Arsip → semua aksi ditolak ARCHIVED", [decS(() => access.decideAddProjectMember(personas.owner, archivedNow.projects[1], "u-004", archivedNow)), decS(() => access.decideAssignAdminPrincipal(personas.owner, archivedNow.projects[1], "u-006", "u-002", archivedNow)), decS(() => access.decideRevokeAdminPrincipal(personas.owner, archivedNow.projects[1], "u-002"))], ["ARCHIVED", "ARCHIVED", "ARCHIVED"]);
  }

  // 9f. copy (Bahasa Indonesia, spesifik; sukses menyebut simulasi)
  eq("U4-7 copy sukses", safe(() => [labels.getTeamSuccessText("member-added", { name: "Ahmad Rizal" }), labels.getTeamSuccessText("member-removed", { name: "Ahmad Rizal" }), labels.getTeamSuccessText("admin-assigned", { name: "Siti Aminah" }), labels.getTeamSuccessText("admin-replaced", { name: "Rina Wulandari", previousName: "Siti Aminah" }), labels.getTeamSuccessText("admin-revoked", { name: "Siti Aminah" })]),
    ["Ahmad Rizal ditambahkan ke tim proyek (simulasi).", "Ahmad Rizal dikeluarkan dari tim proyek (simulasi).", "Siti Aminah ditetapkan sebagai Admin penanggung jawab (simulasi).", "Admin penanggung jawab diganti dari Siti Aminah ke Rina Wulandari (simulasi).", "Siti Aminah tidak lagi menjadi Admin penanggung jawab (simulasi)."]);
  eq("U4-7 copy blokir tugas: jumlah aktual, status Selesai disebut, tidak ada data yang diubah", safe(() => [labels.getMemberRemoveBlockedText("Dewi Lestari", { total: 2, done: 0 }), labels.getMemberRemoveBlockedText("Ahmad Rizal", { total: 1, done: 1 }), labels.getMemberRemoveBlockedText("Eko Prasetyo", { total: 3, done: 1 }), labels.getMemberRemoveBlockedText("Eko Prasetyo", { total: 3, done: 3 })]),
    ["Dewi Lestari tidak dapat dikeluarkan karena masih tercatat sebagai penanggung jawab 2 tugas di proyek ini. Tidak ada data yang diubah.",
      "Ahmad Rizal tidak dapat dikeluarkan karena masih tercatat sebagai penanggung jawab 1 tugas di proyek ini (tugas tersebut sudah selesai). Tidak ada data yang diubah.",
      "Eko Prasetyo tidak dapat dikeluarkan karena masih tercatat sebagai penanggung jawab 3 tugas di proyek ini (1 di antaranya sudah selesai). Tidak ada data yang diubah.",
      "Eko Prasetyo tidak dapat dikeluarkan karena masih tercatat sebagai penanggung jawab 3 tugas di proyek ini (semuanya sudah selesai). Tidak ada data yang diubah."]);
  const ctx = { memberName: "Ahmad Rizal", adminName: "Siti Aminah", currentAdminName: "Rina Wulandari", tasks: { total: 1, done: 0 } };
  eq("U4-7 copy galat per alasan (spesifik, tanpa pesan generik bila sebab diketahui)",
    safe(() => ["ROLE", "ARCHIVED", "ALREADY_MEMBER", "NOT_MEMBER", "USER_NOT_FOUND", "INVALID_CANDIDATE", "HAS_TASKS", "NO_ADMIN", "ADMIN_CHANGED", "SAME_ADMIN"].map((r) => labels.getTeamActionFailureText(r, ctx))),
    ["Peran Anda tidak lagi memiliki hak untuk aksi ini. Tidak ada data yang diubah.",
      "Proyek ini sudah berstatus Arsip dan hanya dapat dibaca. Tidak ada data yang diubah.",
      "Ahmad Rizal sudah terdaftar di proyek ini. Tidak ada data yang diubah. Pilih anggota lain.",
      "Ahmad Rizal sudah tidak terdaftar di proyek ini. Tidak ada data yang diubah.",
      "Data pengguna ini tidak ditemukan. Tidak ada data yang diubah.",
      "Pilihan ini tidak memenuhi syarat. Pilih dari daftar yang tersedia. Tidak ada data yang diubah.",
      "Ahmad Rizal tidak dapat dikeluarkan karena masih tercatat sebagai penanggung jawab 1 tugas di proyek ini. Tidak ada data yang diubah.",
      "Proyek ini sudah tidak memiliki Admin penanggung jawab. Tidak ada data yang diubah.",
      "Admin penanggung jawab sudah berubah menjadi Rina Wulandari. Periksa lagi sebelum melanjutkan. Tidak ada data yang diubah.",
      "Siti Aminah sudah menjadi Admin penanggung jawab proyek ini. Pilih Admin Kantor lain."]);
  eq("U4-7 copy galat: Admin sudah dicabut (tanpa Admin saat ini) dan sebab tak dikenal (generik)", safe(() => [labels.getTeamActionFailureText("ADMIN_CHANGED", { ...ctx, currentAdminName: undefined }), labels.getTeamActionFailureText("STORE_REFUSED", ctx)]),
    ["Admin penanggung jawab sudah dicabut. Periksa lagi sebelum melanjutkan. Tidak ada data yang diubah.", "Perubahan belum tersimpan. Coba lagi."]);
  check("U4-7 copy: setiap DenyReason (termasuk alasan U4-7) memiliki teks", ["ROLE", "ARCHIVED", "HAS_TASKS", "HAS_MEMBERSHIPS", "IS_ADMIN_PRINCIPAL", "PROTECTED_ACCOUNT", "NOT_MEMBER", "ALREADY_MEMBER", "USER_NOT_FOUND", "INVALID_CANDIDATE", "NO_ADMIN", "ADMIN_CHANGED", "SAME_ADMIN"].every((r) => !!labels.DENY_REASON_LABELS[r]));
  check("U4-7 copy: tanpa istilah internal 'Admin principal' di teks pengguna U4-7", safe(() => !/principal/i.test(JSON.stringify([labels.getTeamSuccessText("admin-replaced", { name: "A", previousName: "B" }), labels.getTeamActionFailureText("ADMIN_CHANGED", ctx), labels.getTeamActionFailureText("NO_ADMIN", ctx), labels.TEAM_VALIDATION_TEXT]))) === true);
  eq("U4-7 copy validasi pilihan kosong", safe(() => labels.TEAM_VALIDATION_TEXT), { member: "Pilih satu Mandor atau Anggota Tim.", admin: "Pilih satu Admin Kantor." });

  // 9g. store: mutasi U4-7 (integritas saja; role pelaku diperiksa pemanggil lewat access.ts)
  store.resetMockStore();
  let calls7 = 0;
  const off7 = store.subscribeMockStore(() => { calls7 += 1; });
  const s = () => store.getMockStoreSnapshot();
  try {
    const before = s();
    const added = safe(() => store.addProjectMember("p-003", "u-003"));
    eq("U4-7 store tambah: p-003 + Ahmad → keanggotaan baru di akhir", [added, s().members.slice(-1)[0]], [{ projectId: "p-003", userId: "u-003" }, { projectId: "p-003", userId: "u-003" }]);
    check("U4-7 store tambah: proyek dan tugas tidak tersentuh (referensi sama); seed tidak dimutasi", s().projects === before.projects && s().tasks === before.tasks && MOCK_PROJECT_MEMBERS.length === 5 && store.SEED.members.length === 5);
    eq("U4-7 store tambah ditolak tanpa perubahan: duplikat, Admin Kantor, Owner, tak dikenal, Arsip p-005, proyek tak ada",
      [safe(() => store.addProjectMember("p-003", "u-003")), safe(() => store.addProjectMember("p-003", "u-002")), safe(() => store.addProjectMember("p-003", "u-001")), safe(() => store.addProjectMember("p-003", "u-404")), safe(() => store.addProjectMember("p-005", "u-003")), safe(() => store.addProjectMember("p-999", "u-003"))],
      [null, null, null, null, null, null]);
    eq("U4-7 store: hanya satu keanggotaan p-003 + Ahmad; pelanggan diberi tahu sekali", [s().members.filter((m) => m.projectId === "p-003" && m.userId === "u-003").length, calls7], [1, 1]);
    check("U4-7 store: proyek dengan anggota baru tetap tidak dapat dihapus (aturan U4-6)", store.deleteProject("p-003") === false && s().projects.some((p) => p.id === "p-003"));
    eq("U4-7 store keluarkan ditolak: p-001 Dewi (tugas), p-001 Ahmad (tugas Selesai), p-002 Dewi (bukan anggota), Arsip p-005",
      [safe(() => store.removeProjectMember("p-001", "u-004")), safe(() => store.removeProjectMember("p-001", "u-003")), safe(() => store.removeProjectMember("p-002", "u-004")), safe(() => store.removeProjectMember("p-005", "u-003"))],
      [false, false, false, false]);
    const tasksBefore = s().tasks;
    eq("U4-7 store keluarkan: p-003 Ahmad tanpa tugas → berhasil; kedua kali ditolak (sudah keluar)", [safe(() => store.removeProjectMember("p-003", "u-003")), safe(() => store.removeProjectMember("p-003", "u-003"))], [true, false]);
    check("U4-7 store keluarkan: tugas tidak tersentuh, akun tetap ada, keanggotaan seed utuh", s().tasks === tasksBefore && s().users.some((u) => u.id === "u-003") && s().members.length === 5);
    check("U4-7 store: proyek tanpa keterkaitan dapat dihapus lagi setelah anggota dikeluarkan (tanpa kaskade)", store.deleteProject("p-003") === true);
    store.resetMockStore();

    const p1Before = s().projects.find((p) => p.id === "p-001");
    const membersRef = s().members;
    const replacedP = safe(() => store.setProjectAdmin("p-001", "u-006"));
    eq("U4-7 store ganti: p-001 Siti → Rina (satu field, satu Admin); field lain tetap", replacedP && { adminId: replacedP.adminId, managerId: replacedP.managerId, name: replacedP.name, status: replacedP.status, progress: replacedP.progress }, { adminId: "u-006", managerId: p1Before.managerId, name: p1Before.name, status: p1Before.status, progress: p1Before.progress });
    check("U4-7 store ganti: keanggotaan dan tugas tidak tersentuh; proyek lain sama; seed tidak dimutasi", s().members === membersRef && s().tasks === store.SEED.tasks && s().projects[1] === store.SEED.projects[1] && MOCK_PROJECTS[0].adminId === "u-002");
    eq("U4-7 store tetapkan/ganti ditolak: Mandor, tak dikenal, Admin yang sama, proyek tak ada", [safe(() => store.setProjectAdmin("p-001", "u-003")), safe(() => store.setProjectAdmin("p-001", "u-404")), safe(() => store.setProjectAdmin("p-001", "u-006")), safe(() => store.setProjectAdmin("p-999", "u-006"))], [null, null, null, null]);
    const revokedP = safe(() => store.setProjectAdmin("p-001", null));
    check("U4-7 store cabut: kunci adminId dihapus (sama seperti proyek seed tanpa Admin); managerId tetap", !!revokedP && typeof revokedP === "object" && !("adminId" in revokedP) && revokedP.managerId === p1Before.managerId && !("adminId" in s().projects.find((p) => p.id === "p-001")));
    eq("U4-7 store cabut kedua kali (tidak ada Admin) ditolak", safe(() => store.setProjectAdmin("p-001", null)), null);
    check("U4-7 store cabut: anggota dan tugas p-001 tetap; akun Siti tetap Admin Kantor", s().members.filter((m) => m.projectId === "p-001").length === 3 && s().tasks.filter((t) => t.projectId === "p-001").length === 4 && s().users.find((u) => u.id === "u-002")?.role === "ADMIN");
    eq("U4-7 store tetapkan p-001 (kosong) ke Siti", safe(() => store.setProjectAdmin("p-001", "u-002")?.adminId), "u-002");
    const archivedRuntime = store.createProject({ name: "Arsip runtime", description: "", status: "ARCHIVED", startDate: "", endDate: "", progress: 0, client: "-", location: "" });
    eq("U4-7 store: proyek Arsip menolak tambah anggota dan tetapkan Admin", [safe(() => store.addProjectMember(archivedRuntime.id, "u-003")), safe(() => store.setProjectAdmin(archivedRuntime.id, "u-006"))], [null, null]);
    check("U4-7 store: Admin principal tidak otomatis menjadi anggota proyek", !s().members.some((m) => m.userId === "u-002" || m.userId === "u-006"));
  } finally {
    store.resetMockStore();
    off7();
  }
  check("U4-7 store: tanpa pemeriksaan role sendiri (memakai helper access.ts), tanpa penyimpanan permanen atau jaringan", !/\.role\b/.test(codeOf("lib/mock-store.ts")) && /isEligibleProjectMember/.test(codeOf("lib/mock-store.ts")) && /isEligibleAdminPrincipal/.test(codeOf("lib/mock-store.ts")) && !/localStorage|sessionStorage|fetch\(/.test(codeOf("lib/mock-store.ts")));
}

console.log(failures.length ? `\n${failures.length} masalah dari ${passed + failures.length} pemeriksaan.` : `\nSemua ${passed} pemeriksaan lolos.`);
process.exit(failures.length ? 1 : 0);