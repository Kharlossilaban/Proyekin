// Store mock di MEMORI (keputusan J9). Pola dan alasannya dibuktikan di spike U4-0 (docs/u4-evidence/U4-0-SPIKE.md).
//
// - Perubahan hanya di memori tab ini; reset ke seed saat halaman dimuat ulang.
// - Tanpa database, API, localStorage/sessionStorage, atau penyimpanan permanen.
// - Snapshot SERVER selalu `SEED` (referensi stabil), jadi HTML prerender dan hidrasi konsisten (tanpa mismatch).
// - Data seed tidak pernah dimutasi: setiap perubahan membuat objek/array baru.
// - ID runtime tidak dikenal server; halaman detail memutuskan "tidak ditemukan" di klien.
//
// Mutasi bisnis ditambahkan bertahap: proyek (buat, ubah, hapus) di U4-6; anggota dan Admin principal di U4-7; penugasan,
// status, dan pengguna di U4-8..U4-11. Latensi simulasi dipasang oleh pemanggil (form), bukan store. Izin ROLE ada di `access.ts`
// (representasi UI, bukan keamanan); store ini TIDAK memeriksa role. Store hanya menjaga integritas data lewat
// helper `access.ts`: proyek Arsip tidak dapat diubah/dihapus dan proyek yang masih terkait tidak dapat dihapus.

import { MOCK_PROJECT_MEMBERS, MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS } from "@/data/mock";
import {
  countMemberTasks,
  getProjectDeleteBlockers,
  isEligibleAdminPrincipal,
  isEligibleProjectMember,
  isProjectReadOnly,
} from "@/lib/access";
import type { Project, ProjectMember, Task, User } from "@/types";

export interface MockStoreState {
  /** L1 — pengguna organisasi dan role global. */
  readonly users: readonly User[];
  readonly projects: readonly Project[];
  /** L2 — keanggotaan proyek. */
  readonly members: readonly ProjectMember[];
  /** L3 — tugas (penugasan dan status). */
  readonly tasks: readonly Task[];
}

export type NewProjectInput = Omit<Project, "id" | "code">;
export type NewTaskInput = Omit<Task, "id" | "code">;

export const SEED: MockStoreState = Object.freeze({
  users: MOCK_USERS,
  projects: MOCK_PROJECTS,
  members: MOCK_PROJECT_MEMBERS,
  tasks: MOCK_TASKS,
});

let state: MockStoreState = SEED;
const listeners = new Set<() => void>();

function commit(next: MockStoreState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeMockStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getMockStoreSnapshot = (): MockStoreState => state;
export const getMockStoreServerSnapshot = (): MockStoreState => SEED;

/**
 * Nomor proyek tertinggi yang PERNAH dipakai di sesi memori ini. Proyek bisa dihapus (U4-6), jadi nomor berikutnya tidak boleh
 * dihitung dari ID yang masih ada saja: ID/kode proyek yang dihapus tidak dipakai ulang. Kembali ke seed saat reset/reload.
 */
let projectHighWater = 0;

/** Mengembalikan store ke seed (untuk pengujian). Dalam penggunaan normal reset terjadi saat reload. */
export function resetMockStore(): void {
  projectHighWater = 0;
  commit(SEED);
}

/** Nomor berikutnya dari akhiran numerik ID (`p-005` → 6). */
export function nextEntityNumber(ids: readonly string[]): number {
  return ids.reduce((max, id) => Math.max(max, Number(id.split("-")[1]) || 0), 0) + 1;
}

const pad = (n: number): string => String(n).padStart(3, "0");

/** Membuat proyek di memori; ID dan kode otomatis (J7): `p-006` / `PRJ-006`. */
export function createProject(input: NewProjectInput): Project {
  const n = Math.max(nextEntityNumber(state.projects.map((p) => p.id)), projectHighWater + 1);
  projectHighWater = n;
  const project: Project = { ...input, id: `p-${pad(n)}`, code: `PRJ-${pad(n)}` };
  commit({ ...state, projects: [...state.projects, project] });
  return project;
}

/** Field proyek yang dapat diubah lewat form (U4-6). Kode, relasi (`adminId`, anggota, tugas), dan progres tidak termasuk. */
export type ProjectEditInput = Pick<Project, "name" | "client" | "description" | "location" | "startDate" | "endDate" | "status">;

/**
 * Mengubah field proyek di memori. ID, kode, `adminId`, `managerId`, progres, anggota, dan tugas TIDAK berubah.
 * Mengembalikan `null` (tanpa mengubah apa pun) bila proyek tidak ada atau berstatus Arsip (G7, hanya baca).
 * Izin role diperiksa pemanggil lewat `access.ts`; store hanya menjaga integritas data.
 */
export function updateProject(id: string, input: ProjectEditInput): Project | null {
  const current = state.projects.find((p) => p.id === id);
  if (!current || isProjectReadOnly(current)) return null;
  const next: Project = { ...current, ...input };
  commit({ ...state, projects: state.projects.map((p) => (p.id === id ? next : p)) });
  return next;
}

/**
 * Menghapus proyek dari memori. DITOLAK (mengembalikan `false`, tanpa mengubah apa pun) bila proyek tidak ada, berstatus
 * Arsip, atau masih memiliki tugas, anggota, atau Admin principal. TIDAK ada penghapusan berantai: tugas dan
 * keanggotaan tidak pernah ikut terhapus. Izin role diperiksa pemanggil lewat `access.ts` (`decideDeleteProject`).
 */
export function deleteProject(id: string): boolean {
  const current = state.projects.find((p) => p.id === id);
  if (!current || isProjectReadOnly(current) || getProjectDeleteBlockers(current, state).length > 0) return false;
  commit({ ...state, projects: state.projects.filter((p) => p.id !== id) });
  return true;
}

// ---------- U4-7: keanggotaan proyek dan Admin principal ----------
// Store hanya menjaga INTEGRITAS data (proyek ada dan bukan Arsip, kandidat layak, tanpa duplikat, tanpa kaskade). Hak pelaku
// (Owner / Admin principal) diperiksa pemanggil lewat `access.ts` terhadap snapshot terbaru. Penolakan tidak mengubah apa pun
// dan tidak memberi tahu pelanggan.

const editableProject = (projectId: string): Project | undefined => {
  const project = state.projects.find((p) => p.id === projectId);
  return project && !isProjectReadOnly(project) ? project : undefined;
};

const isMemberNow = (projectId: string, userId: string): boolean =>
  state.members.some((m) => m.projectId === projectId && m.userId === userId);

/**
 * Menambah Mandor/Anggota Tim ke proyek (U4-7). Mengembalikan keanggotaan baru, atau `null` (tanpa perubahan) bila proyek tidak
 * ada atau Arsip, pengguna tidak dikenal atau bukan Mandor/Anggota Tim, atau sudah menjadi anggota.
 */
export function addProjectMember(projectId: string, userId: string): ProjectMember | null {
  const project = editableProject(projectId);
  const user = state.users.find((u) => u.id === userId);
  if (!project || !isEligibleProjectMember(user) || isMemberNow(projectId, userId)) return null;
  const member: ProjectMember = { projectId, userId };
  commit({ ...state, members: [...state.members, member] });
  return member;
}

/**
 * Mengeluarkan anggota dari proyek (U4-7): HANYA menghapus satu keanggotaan. Akun, tugas, dan data lain tidak tersentuh.
 * DITOLAK (`false`, tanpa perubahan) bila proyek tidak ada atau Arsip, pengguna bukan anggota, atau pengguna masih tercatat
 * sebagai penanggung jawab tugas apa pun di proyek itu (termasuk Selesai).
 */
export function removeProjectMember(projectId: string, userId: string): boolean {
  const project = editableProject(projectId);
  if (!project || !isMemberNow(projectId, userId) || countMemberTasks(project, userId, state).total > 0) return false;
  commit({ ...state, members: state.members.filter((m) => !(m.projectId === projectId && m.userId === userId)) });
  return true;
}

/**
 * Menetapkan, mengganti (`adminId` = Admin Kantor lain), atau mencabut (`null`) Admin principal proyek (U4-7). Satu field,
 * jadi proyek tidak pernah memiliki dua Admin. Mencabut MENGHAPUS kunci `adminId` (sama seperti proyek seed tanpa Admin).
 * Keanggotaan, tugas, `managerId`, dan akun pengguna tidak tersentuh. Mengembalikan proyek baru, atau `null` (tanpa
 * perubahan) bila proyek tidak ada atau Arsip, kandidat bukan Admin Kantor yang dikenal, sama dengan Admin sekarang, atau
 * tidak ada Admin yang dapat dicabut.
 */
export function setProjectAdmin(projectId: string, adminId: string | null): Project | null {
  const project = editableProject(projectId);
  if (!project) return null;
  let next: Project;
  if (adminId === null) {
    if (!project.adminId) return null;
    const { adminId: _removed, ...rest } = project;
    void _removed;
    next = rest;
  } else {
    const user = state.users.find((u) => u.id === adminId);
    if (!isEligibleAdminPrincipal(user) || project.adminId === adminId) return null;
    next = { ...project, adminId };
  }
  commit({ ...state, projects: state.projects.map((p) => (p.id === projectId ? next : p)) });
  return next;
}

/** Membuat tugas di memori; ID dan kode otomatis (J7): `t-007` / `TSK-007`. */
export function createTask(input: NewTaskInput): Task {
  const n = nextEntityNumber(state.tasks.map((t) => t.id));
  const task: Task = { ...input, id: `t-${pad(n)}`, code: `TSK-${pad(n)}` };
  commit({ ...state, tasks: [...state.tasks, task] });
  return task;
}
