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
  | "PROTECTED_ACCOUNT";

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

/** Owner saja (J3). */
export const canCreateProject = (actor: Actor): boolean => isOwner(actor);

/** Ubah data dan status proyek: Owner, atau Admin principal proyek itu (J3). Proyek Arsip hanya baca (G7). */
export const canEditProject = (actor: Actor, project: Project): boolean => !isArchived(project) && manages(actor, project);

/** Owner saja (J3). Proyek Arsip tidak dapat dihapus (G7). */
export const canDeleteProject = (actor: Actor, project: Project): boolean => !isArchived(project) && isOwner(actor);

// ---------- L2: keanggotaan proyek dan Admin principal ----------

/** Menetapkan atau mengganti Admin principal: Owner saja (§7A). */
export const canAssignAdminPrincipal = (actor: Actor, project: Project): boolean =>
  !isArchived(project) && isOwner(actor);

/** Menambah Mandor/Anggota ke proyek: Owner, atau Admin principal proyek itu. Mandor TIDAK (J1: penugasan ≠ keanggotaan). */
export const canAddProjectMember = (actor: Actor, project: Project): boolean => !isArchived(project) && manages(actor, project);

/**
 * Mengeluarkan anggota dari proyek: Owner saja. Admin tidak (G9, fail-closed: Admin hanya boleh menambah).
 * Diblokir selama anggota masih memegang tugas di proyek itu (G3).
 */
export function decideRemoveProjectMember(actor: Actor, project: Project, userId: string, data: AccessData): Decision {
  if (!isOwner(actor)) return deny("ROLE");
  if (isArchived(project)) return deny("ARCHIVED");
  const holdsTasks = data.tasks.some((t) => t.projectId === project.id && t.assigneeId === userId);
  return holdsTasks ? deny("HAS_TASKS") : ALLOW;
}

/** Kandidat anggota proyek: Mandor/Anggota Tim yang belum menjadi anggota proyek itu. */
export const getProjectMemberCandidates = (project: Project, data: AccessData): User[] =>
  data.users.filter((u) => PROJECT_MEMBER_ROLES.includes(u.role) && !isMember(data, project.id, u.id));

/** Kandidat Admin principal: hanya role Admin Kantor. */
export const getAdminPrincipalCandidates = (data: AccessData): User[] =>
  data.users.filter((u) => u.role === ADMIN_PRINCIPAL_ROLE);

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
