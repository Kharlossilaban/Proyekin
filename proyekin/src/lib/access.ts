// REPRESENTASI IZIN UI — BUKAN OTORISASI DAN BUKAN KONTROL KEAMANAN.
//
// Fungsi murni ini hanya memutuskan apa yang DITAMPILKAN/DIAKTIFKAN di UI mock berdasarkan role dan data seed
// di memori. Sesi demo hanya `sessionStorage` yang bisa diubah siapa saja, dan HTML prerender sama untuk semua
// pengunjung. Penegakan akses sesungguhnya wajib ada di server/backend (backlog U3-B1..B4).
//
// Sumber aturan: spesifikasi kanonis, keputusan pemilik §7 dan J1–J11. Untuk G1–G9 yang belum diputuskan,
// berlaku batas FAIL-CLOSED dari rencana U4 final: tidak ada hak yang diperluas. Keputusan pemilik di kemudian
// hari hanya MENAMBAH izin, tidak membatalkan yang sudah ada.
//
// Tiga lapisan dipisahkan tegas:
//   L1 pengguna organisasi + role global   (canViewOrgUsers, decideChangeOrgUserRole, ...)
//   L2 keanggotaan proyek + Admin principal (canAddProjectMember, decideRemoveProjectMember, ...)
//   L3 penugasan dan status tugas           (canReassignTask, canChangeTaskStatus, ...)
// Hak di satu lapisan TIDAK otomatis berlaku di lapisan lain (mis. Mandor boleh menugaskan ulang tugas (L3) tetapi
// tidak boleh menambah atau mengeluarkan anggota proyek (L2), dan tidak melihat pengguna organisasi (L1)).
//
// Guest tidak punya akses ke area aplikasi: semua fungsi bernilai false/kosong untuk Guest dan aktor kosong.

import { ADMIN_PRINCIPAL_ROLE, ORG_ROLE_OPTIONS, PROJECT_MEMBER_ROLES, TASK_ASSIGNEE_ROLES } from "@/lib/roles";
import type { Project, ProjectMember, Role, Task, User } from "@/types";

export interface AccessData {
  readonly users: readonly User[];
  readonly projects: readonly Project[];
  readonly members: readonly ProjectMember[];
  readonly tasks: readonly Task[];
}

/** Pelaku; `null`/`undefined` (belum diketahui) diperlakukan sebagai ditolak. */
export type Actor = User | null | undefined;

export type DenyReason =
  | "ROLE"
  | "ARCHIVED"
  | "HAS_TASKS"
  | "HAS_MEMBERSHIPS"
  | "IS_ADMIN_PRINCIPAL"
  | "PROTECTED_ACCOUNT"
  // U4-7 (keanggotaan dan Admin principal). Sebagian adalah keadaan "stale": data sudah berubah sejak dialog dibuka.
  | "NOT_MEMBER"
  | "ALREADY_MEMBER"
  | "USER_NOT_FOUND"
  | "INVALID_CANDIDATE"
  | "NO_ADMIN"
  | "ADMIN_CHANGED"
  | "SAME_ADMIN";

export type Decision = { allowed: true } | { allowed: false; reason: DenyReason };

const ALLOW: Decision = { allowed: true };
const deny = (reason: DenyReason): Decision => ({ allowed: false, reason });

// ---------- helper internal ----------

const isOwner = (actor: Actor): boolean => actor?.role === "OWNER";

const isMember = (data: AccessData, projectId: string, userId: string): boolean =>
  data.members.some((m) => m.projectId === projectId && m.userId === userId);

/** "Ditugaskan" = Admin principal proyek itu (satu per proyek, §7A). */
const isAdminPrincipal = (actor: Actor, project: Project): boolean =>
  actor?.role === ADMIN_PRINCIPAL_ROLE && !!project.adminId && project.adminId === actor.id;

/** Owner, atau Admin principal proyek itu. */
const manages = (actor: Actor, project: Project): boolean => isOwner(actor) || isAdminPrincipal(actor, project);

/** G7: proyek berstatus Arsip hanya baca. */
const isArchived = (project: Project): boolean => project.status === "ARCHIVED";

const projectOf = (task: Task, data: AccessData): Project | undefined =>
  data.projects.find((p) => p.id === task.projectId);

const userById = (data: AccessData, id: string | undefined): User | undefined =>
  id ? data.users.find((u) => u.id === id) : undefined;

/** Penanggung jawab tugas adalah Anggota Tim yang tercatat sebagai anggota proyek tugas itu. */
const assigneeIsProjectAnggota = (task: Task, project: Project, data: AccessData): boolean => {
  const assignee = userById(data, task.assigneeId);
  return !!assignee && assignee.role === "ANGGOTA" && isMember(data, project.id, assignee.id);
};

// ---------- halaman awal dan dashboard (J2) ----------

/** Dashboard analitik hanya Owner dan Admin Kantor (J2). Belum dipakai guard; integrasi di U4-3. */
export const canViewDashboard = (actor: Actor): boolean => actor?.role === "OWNER" || actor?.role === "ADMIN";

/** Halaman awal setelah login (J2). Belum dipakai; integrasi di U4-3. Guest tanpa App Shell → halaman publik. */
export function getHomePath(role: Role): string {
  switch (role) {
    case "OWNER":
    case "ADMIN":
      return "/dashboard";
    case "MANDOR":
    case "ANGGOTA":
      return "/tugas";
    default:
      return "/";
  }
}

/**
 * Tujuan setelah login berhasil. Guest tidak punya akun dan tidak masuk App Shell (keputusan D), jadi bila sesi
 * Guest muncul ia diarahkan ke halaman Akses Ditolak, sama seperti perilaku U3.
 */
export function getPostLoginPath(role: Role): string {
  return role === "GUEST" ? "/akses-ditolak" : getHomePath(role);
}

// ---------- bagian aplikasi (menu dan URL langsung) ----------

/** Bagian aplikasi yang punya menu dan route tingkat atas. Satu sumber untuk menu dan guard URL. */
export type AppSection = "dashboard" | "proyek" | "tugas" | "laporan" | "dokumen" | "anggota" | "pengaturan";

/**
 * Siapa yang boleh membuka bagian aplikasi (dipakai menu DAN guard URL; jangan menyalin aturan ini).
 * - Dashboard: Owner/Admin (J2). Anggota (pengguna organisasi): Owner/Admin (J4, J5, G2).
 * - Laporan: Owner/Admin/Mandor dan Pengaturan: Owner/Admin — nilai dipindahkan dari navigasi U2 tanpa perubahan;
 *   aturan final Laporan dan Pengaturan ditetapkan di tahap/fitur masing-masing.
 * - Proyek, Tugas, Dokumen: semua role non-Guest, seperti navigasi U2. Lingkup datanya (proyek/tugas mana)
 *   diatur oleh `canViewProject`/`canViewTask` dan diterapkan bertahap di U4-4, U4-8, dan seterusnya.
 */
export function canAccessSection(actor: Actor, section: AppSection): boolean {
  if (!actor) return false;
  switch (section) {
    case "dashboard":
      return canViewDashboard(actor);
    case "anggota":
      return canViewOrgUsers(actor);
    case "laporan":
      return actor.role === "OWNER" || actor.role === "ADMIN" || actor.role === "MANDOR";
    case "pengaturan":
      return actor.role === "OWNER" || actor.role === "ADMIN";
    case "proyek":
    case "tugas":
    case "dokumen":
      return actor.role !== "GUEST";
    default:
      return false;
  }
}

// ---------- proyek ----------

/** Owner: semua. Admin: hanya proyek yang ditugaskan (G8: lainnya tidak terlihat). Mandor/Anggota: proyek tempatnya menjadi anggota. */
export function canViewProject(actor: Actor, project: Project, data: AccessData): boolean {
  if (!actor) return false;
  switch (actor.role) {
    case "OWNER":
      return true;
    case "ADMIN":
      return isAdminPrincipal(actor, project);
    case "MANDOR":
    case "ANGGOTA":
      return isMember(data, project.id, actor.id);
    default:
      return false;
  }
}

export const getVisibleProjects = (actor: Actor, data: AccessData): Project[] =>
  data.projects.filter((project) => canViewProject(actor, project, data));

/**
 * Tab "Tim" di detail proyek (U4-5, hanya baca): Owner, Admin principal, dan Mandor anggota proyek itu.
 * Anggota Tim tidak (J5: ia hanya melihat tugas miliknya, tanpa susunan tim). Fail-closed: role lain, Guest, dan
 * aktor kosong tidak. Proyek Arsip tetap dapat dibaca bila dalam lingkup (G7 hanya menutup mutasi).
 */
export function canViewProjectTeam(actor: Actor, project: Project, data: AccessData): boolean {
  return canViewProject(actor, project, data) && actor?.role !== "ANGGOTA";
}

/** Owner saja (J3). */
export const canCreateProject = (actor: Actor): boolean => isOwner(actor);

/** Ubah data dan status proyek: Owner, atau Admin principal proyek itu (J3). Proyek Arsip hanya baca (G7). */
export const canEditProject = (actor: Actor, project: Project): boolean => !isArchived(project) && manages(actor, project);

/** Owner saja (J3). Proyek Arsip tidak dapat dihapus (G7). */
export const canDeleteProject = (actor: Actor, project: Project): boolean => !isArchived(project) && isOwner(actor);

/** G7: proyek berstatus Arsip hanya baca. Dipakai tampilan dan store agar tidak ada salinan aturan ini. */
export const isProjectReadOnly = (project: Project): boolean => isArchived(project);

/** Keterkaitan yang menghalangi penghapusan proyek (U4-6). Tidak ada penghapusan berantai. */
export type ProjectDeleteBlockerReason = Extract<DenyReason, "HAS_TASKS" | "HAS_MEMBERSHIPS" | "IS_ADMIN_PRINCIPAL">;

export interface ProjectDeleteBlocker {
  reason: ProjectDeleteBlockerReason;
  /** Jumlah data terkait (tugas, anggota; 1 untuk Admin principal). */
  count: number;
}

/**
 * ATURAN MUTLAK (pemilik, U4-6): proyek yang masih memiliki satu atau lebih Task, ProjectMember, atau Admin principal
 * (`adminId`) TIDAK boleh dihapus. Tidak ada kaskade: data terkait tidak pernah ikut terhapus. Daftar kosong = tidak
 * ada penghalang. Urutan tetap: tugas, anggota, Admin principal.
 */
export function getProjectDeleteBlockers(project: Project, data: AccessData): ProjectDeleteBlocker[] {
  const blockers: ProjectDeleteBlocker[] = [];
  const tasks = data.tasks.filter((t) => t.projectId === project.id).length;
  const members = data.members.filter((m) => m.projectId === project.id).length;
  if (tasks > 0) blockers.push({ reason: "HAS_TASKS", count: tasks });
  if (members > 0) blockers.push({ reason: "HAS_MEMBERSHIPS", count: members });
  if (project.adminId) blockers.push({ reason: "IS_ADMIN_PRINCIPAL", count: 1 });
  return blockers;
}

/** Keputusan hapus proyek: Owner saja, bukan Arsip, dan tanpa penghalang keterkaitan (U4-6). */
export function decideDeleteProject(actor: Actor, project: Project, data: AccessData): Decision {
  if (!isOwner(actor)) return deny("ROLE");
  if (isArchived(project)) return deny("ARCHIVED");
  const [first] = getProjectDeleteBlockers(project, data);
  return first ? deny(first.reason) : ALLOW;
}

// ---------- L2: keanggotaan proyek dan Admin principal ----------
//
// U4-7: setiap `decide*` dipanggil dua kali oleh UI — saat dialog dibuka (untuk menampilkan keadaan) dan SAAT MENYIMPAN
// terhadap snapshot store terbaru (data atau hak bisa berubah di antaranya). Store hanya menjaga integritas data lewat
// helper di bawah ini dan tidak memeriksa role pelaku.

/** Pengguna yang boleh menjadi anggota proyek (`ProjectMember`): hanya Mandor dan Anggota Tim (role global). */
export const isEligibleProjectMember = (user: User | null | undefined): boolean => !!user && PROJECT_MEMBER_ROLES.includes(user.role);

/** Pengguna yang boleh menjadi Admin principal proyek (`Project.adminId`): hanya Admin Kantor (role global). */
export const isEligibleAdminPrincipal = (user: User | null | undefined): boolean => !!user && user.role === ADMIN_PRINCIPAL_ROLE;

/** Menetapkan, mengganti, atau mencabut Admin principal: Owner saja (§7A; pencabutan: keputusan pemilik U4-O10). */
export const canAssignAdminPrincipal = (actor: Actor, project: Project): boolean =>
  !isArchived(project) && isOwner(actor);

/** Menambah Mandor/Anggota ke proyek: Owner, atau Admin principal proyek itu. Mandor TIDAK (J1: penugasan ≠ keanggotaan). */
export const canAddProjectMember = (actor: Actor, project: Project): boolean => !isArchived(project) && manages(actor, project);

/** Tombol "Keluarkan dari proyek" tampil: Owner saja (G9), bukan proyek Arsip. Keputusan per anggota: `decideRemoveProjectMember`. */
export const canRemoveProjectMembers = (actor: Actor, project: Project): boolean => !isArchived(project) && isOwner(actor);

/**
 * Keputusan menambah anggota (U4-7): Owner atau Admin principal proyek itu; bukan Arsip; kandidat harus pengguna yang
 * dikenal dengan role Mandor/Anggota Tim; tidak boleh sudah menjadi anggota (tanpa duplikat).
 */
export function decideAddProjectMember(actor: Actor, project: Project, userId: string, data: AccessData): Decision {
  if (!manages(actor, project)) return deny("ROLE");
  if (isArchived(project)) return deny("ARCHIVED");
  const user = userById(data, userId);
  if (!user) return deny("USER_NOT_FOUND");
  if (!isEligibleProjectMember(user)) return deny("INVALID_CANDIDATE");
  return isMember(data, project.id, userId) ? deny("ALREADY_MEMBER") : ALLOW;
}

/** Tugas proyek yang mencatat pengguna sebagai penanggung jawab, SEMUA status (termasuk Selesai). */
export function countMemberTasks(project: Project, userId: string, data: AccessData): { total: number; done: number } {
  const held = data.tasks.filter((t) => t.projectId === project.id && t.assigneeId === userId);
  return { total: held.length, done: held.filter((t) => t.status === "DONE").length };
}

/**
 * Mengeluarkan anggota dari proyek: Owner saja. Admin tidak (G9, fail-closed: Admin hanya boleh menambah).
 * Diblokir selama anggota masih tercatat sebagai penanggung jawab tugas APA PUN di proyek itu, termasuk tugas Selesai
 * (G3; keputusan pemilik U4-7). Hanya keanggotaan yang dihapus: akun, tugas, dan data lain tidak tersentuh.
 */
export function decideRemoveProjectMember(actor: Actor, project: Project, userId: string, data: AccessData): Decision {
  if (!isOwner(actor)) return deny("ROLE");
  if (isArchived(project)) return deny("ARCHIVED");
  if (!userById(data, userId)) return deny("USER_NOT_FOUND");
  if (!isMember(data, project.id, userId)) return deny("NOT_MEMBER");
  return countMemberTasks(project, userId, data).total > 0 ? deny("HAS_TASKS") : ALLOW;
}

/** Kandidat anggota proyek: Mandor/Anggota Tim yang belum menjadi anggota proyek itu. */
export const getProjectMemberCandidates = (project: Project, data: AccessData): User[] =>
  data.users.filter((u) => isEligibleProjectMember(u) && !isMember(data, project.id, u.id));

/** Kandidat Admin principal: hanya role Admin Kantor. */
export const getAdminPrincipalCandidates = (data: AccessData): User[] => data.users.filter((u) => isEligibleAdminPrincipal(u));

/** Kandidat untuk menetapkan/mengganti Admin principal proyek: Admin Kantor, TANPA Admin yang sedang menjabat. */
export const getAdminReplacementCandidates = (project: Project, data: AccessData): User[] =>
  getAdminPrincipalCandidates(data).filter((u) => u.id !== project.adminId);

/**
 * Keputusan menetapkan (proyek tanpa Admin) atau mengganti Admin principal: Owner saja; bukan Arsip; satu Admin per proyek.
 * `expectedAdminId` = Admin yang terlihat saat dialog dibuka (kosong bila belum ada). Bila Admin proyek sekarang berbeda,
 * data sudah berubah (`ADMIN_CHANGED`) dan aksi tidak dilanjutkan dengan data lama.
 */
export function decideAssignAdminPrincipal(
  actor: Actor,
  project: Project,
  userId: string,
  expectedAdminId: string | undefined,
  data: AccessData,
): Decision {
  if (!isOwner(actor)) return deny("ROLE");
  if (isArchived(project)) return deny("ARCHIVED");
  if ((project.adminId || undefined) !== (expectedAdminId || undefined)) return deny("ADMIN_CHANGED");
  const user = userById(data, userId);
  if (!user) return deny("USER_NOT_FOUND");
  if (!isEligibleAdminPrincipal(user)) return deny("INVALID_CANDIDATE");
  return project.adminId === userId ? deny("SAME_ADMIN") : ALLOW;
}

/**
 * Keputusan mencabut Admin principal (keputusan pemilik U4-O10): Owner saja; bukan Arsip. Hanya relasi Admin principal
 * yang dihapus; akun dan role global Admin Kantor, anggota, dan tugas tidak berubah. `expectedAdminId` = Admin yang
 * terlihat saat dialog dibuka.
 */
export function decideRevokeAdminPrincipal(actor: Actor, project: Project, expectedAdminId: string): Decision {
  if (!isOwner(actor)) return deny("ROLE");
  if (isArchived(project)) return deny("ARCHIVED");
  if (!project.adminId) return deny("NO_ADMIN");
  return project.adminId !== expectedAdminId ? deny("ADMIN_CHANGED") : ALLOW;
}

// ---------- L3: tugas ----------

/**
 * Owner: semua. Admin: tugas proyek yang ditugaskan. Mandor: semua tugas proyek tempatnya menjadi anggota (G5).
 * Anggota Tim: hanya tugas miliknya di proyek tempatnya menjadi anggota (J5).
 */
export function canViewTask(actor: Actor, task: Task, data: AccessData): boolean {
  if (!actor) return false;
  const project = projectOf(task, data);
  if (!project) return false;
  switch (actor.role) {
    case "OWNER":
      return true;
    case "ADMIN":
      return isAdminPrincipal(actor, project);
    case "MANDOR":
      return isMember(data, project.id, actor.id);
    case "ANGGOTA":
      return isMember(data, project.id, actor.id) && task.assigneeId === actor.id;
    default:
      return false;
  }
}

export const getVisibleTasks = (actor: Actor, data: AccessData): Task[] =>
  data.tasks.filter((task) => canViewTask(actor, task, data));

/** Tugas sebuah proyek dalam lingkup pelaku (G5, J5): bagian `getVisibleTasks` untuk satu proyek. */
export const getVisibleProjectTasks = (actor: Actor, project: Project, data: AccessData): Task[] =>
  data.tasks.filter((task) => task.projectId === project.id && canViewTask(actor, task, data));

/** Anggota Tim hanya melihat tugas miliknya (J5); dipakai UI untuk menjelaskan lingkup daftar tugas. Sejalan dengan `canViewTask`. */
export const seesOnlyOwnTasks = (actor: Actor): boolean => actor?.role === "ANGGOTA";

/** Membuat tugas: Owner, atau Admin principal proyek itu. Mandor dan Anggota Tim tidak (hanya memperbarui). */
export const canCreateTask = (actor: Actor, project: Project): boolean => !isArchived(project) && manages(actor, project);

/** Mengubah judul, deskripsi, tenggat, prioritas, dan tanggal mulai: Owner, atau Admin principal proyek itu. */
export function canEditTask(actor: Actor, task: Task, data: AccessData): boolean {
  const project = projectOf(task, data);
  return !!project && !isArchived(project) && manages(actor, project);
}

/**
 * Mengubah status tugas.
 * Owner/Admin principal: ya. Anggota Tim: hanya tugas miliknya (J5).
 * Mandor (G1, fail-closed): tugas di proyeknya yang dipegang dirinya sendiri atau Anggota Tim; tugas Mandor lain
 * hanya bisa dilihat; tugas tanpa penanggung jawab tidak.
 */
export function canChangeTaskStatus(actor: Actor, task: Task, data: AccessData): boolean {
  const project = projectOf(task, data);
  if (!actor || !project || isArchived(project)) return false;
  if (manages(actor, project)) return true;
  if (!isMember(data, project.id, actor.id)) return false;
  if (actor.role === "ANGGOTA") return task.assigneeId === actor.id;
  if (actor.role === "MANDOR") return task.assigneeId === actor.id || assigneeIsProjectAnggota(task, project, data);
  return false;
}

/**
 * Mengganti penanggung jawab tugas (L3, bukan keanggotaan).
 * Owner/Admin principal: ya. Mandor (G1, fail-closed): hanya tugas yang saat ini dipegang Anggota Tim proyeknya,
 * dan hanya ke Anggota Tim proyek itu. Anggota Tim: tidak.
 */
export function canReassignTask(actor: Actor, task: Task, data: AccessData): boolean {
  const project = projectOf(task, data);
  if (!actor || !project || isArchived(project)) return false;
  if (manages(actor, project)) return true;
  return actor.role === "MANDOR" && isMember(data, project.id, actor.id) && assigneeIsProjectAnggota(task, project, data);
}

/** Tidak ada hapus tugas di U4 (J6), untuk role mana pun. */
export const canDeleteTask = (): false => false;

/** Penanggung jawab valid: Mandor/Anggota Tim DAN anggota proyek tugas itu (J6). */
export function isValidAssignee(userId: string, projectId: string, data: AccessData): boolean {
  const user = userById(data, userId);
  return !!user && TASK_ASSIGNEE_ROLES.includes(user.role) && isMember(data, projectId, user.id);
}

/**
 * Pilihan penanggung jawab. Owner/Admin principal: semua Mandor/Anggota Tim anggota proyek.
 * Mandor (hanya jika boleh menugaskan ulang `task`, G1): Anggota Tim anggota proyek saja. Lainnya: kosong.
 */
export function getAssigneeCandidates(actor: Actor, project: Project, data: AccessData, task?: Task): User[] {
  if (!actor || isArchived(project)) return [];
  const members = data.users.filter((u) => isValidAssignee(u.id, project.id, data));
  if (manages(actor, project)) return members;
  if (actor.role === "MANDOR" && task && canReassignTask(actor, task, data)) {
    return members.filter((u) => u.role === "ANGGOTA");
  }
  return [];
}

// ---------- L1: pengguna organisasi dan role global ----------

/** Hanya Owner dan Admin Kantor (J4). Mandor tidak (G2, fail-closed) dan Anggota Tim tidak (J5). */
export const canViewOrgUsers = (actor: Actor): boolean => actor?.role === "OWNER" || actor?.role === "ADMIN";

/** Role global yang boleh ditambahkan pelaku ini (J4): Owner → Admin/Mandor/Anggota; Admin → Mandor/Anggota. */
export const getAddableOrgRoles = (actor: Actor): readonly Role[] => (actor ? ORG_ROLE_OPTIONS[actor.role] : []);

export const canAddOrgUser = (actor: Actor): boolean => getAddableOrgRoles(actor).length > 0;

/** Keterkaitan yang menahan perubahan role/penghapusan akun (G3). */
function orgUserHold(target: User, data: AccessData): DenyReason | null {
  if (data.projects.some((p) => p.adminId === target.id)) return "IS_ADMIN_PRINCIPAL";
  if (data.members.some((m) => m.userId === target.id)) return "HAS_MEMBERSHIPS";
  if (data.tasks.some((t) => t.assigneeId === target.id)) return "HAS_TASKS";
  return null;
}

function decideManageOrgAccount(actor: Actor, target: User, data: AccessData): Decision {
  if (!isOwner(actor)) return deny("ROLE"); // Admin hanya menambah, tanpa mengubah role atau mengelola akun (J4)
  if (target.role === "OWNER") return deny("PROTECTED_ACCOUNT"); // kepemilikan di luar U4 (G4)
  const hold = orgUserHold(target, data);
  return hold ? deny(hold) : ALLOW;
}

/** Mengubah role global: Owner saja; akun Owner dilindungi (G4); diblokir selama masih terkait (G3). */
export const decideChangeOrgUserRole = (actor: Actor, target: User, data: AccessData): Decision =>
  decideManageOrgAccount(actor, target, data);

/** Menghapus akun: Owner saja; akun Owner dilindungi (G4); diblokir selama masih terkait (G3). */
export const decideDeleteOrgUser = (actor: Actor, target: User, data: AccessData): Decision =>
  decideManageOrgAccount(actor, target, data);
