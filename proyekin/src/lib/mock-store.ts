// Store mock di MEMORI (keputusan J9). Pola dan alasannya dibuktikan di spike U4-0 (docs/u4-evidence/U4-0-SPIKE.md).
//
// - Perubahan hanya di memori tab ini; reset ke seed saat halaman dimuat ulang.
// - Tanpa database, API, localStorage/sessionStorage, atau penyimpanan permanen.
// - Snapshot SERVER selalu `SEED` (referensi stabil), jadi HTML prerender dan hidrasi konsisten (tanpa mismatch).
// - Data seed tidak pernah dimutasi: setiap perubahan membuat objek/array baru.
// - ID runtime tidak dikenal server; halaman detail memutuskan "tidak ditemukan" di klien.
//
// Tahap ini hanya menyediakan fondasi + primitif pembuatan entitas yang dibutuhkan pembuktian route runtime.
// Mutasi bisnis lain (anggota, penugasan, status, pengguna) ditambahkan bertahap di U4-5..U4-11, dan lapisan
// async/latensi simulasi (seperti `auth-mock.ts`) ditambahkan saat form dibuat. Izin ada di `access.ts`
// (representasi UI, bukan keamanan); store ini TIDAK memeriksa izin.

import { MOCK_PROJECT_MEMBERS, MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS } from "@/data/mock";
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

/** Mengembalikan store ke seed (untuk pengujian). Dalam penggunaan normal reset terjadi saat reload. */
export function resetMockStore(): void {
  commit(SEED);
}

/** Nomor berikutnya dari akhiran numerik ID (`p-005` → 6). */
export function nextEntityNumber(ids: readonly string[]): number {
  return ids.reduce((max, id) => Math.max(max, Number(id.split("-")[1]) || 0), 0) + 1;
}

const pad = (n: number): string => String(n).padStart(3, "0");

/** Membuat proyek di memori; ID dan kode otomatis (J7): `p-006` / `PRJ-006`. */
export function createProject(input: NewProjectInput): Project {
  const n = nextEntityNumber(state.projects.map((p) => p.id));
  const project: Project = { ...input, id: `p-${pad(n)}`, code: `PRJ-${pad(n)}` };
  commit({ ...state, projects: [...state.projects, project] });
  return project;
}

/** Membuat tugas di memori; ID dan kode otomatis (J7): `t-007` / `TSK-007`. */
export function createTask(input: NewTaskInput): Task {
  const n = nextEntityNumber(state.tasks.map((t) => t.id));
  const task: Task = { ...input, id: `t-${pad(n)}`, code: `TSK-${pad(n)}` };
  commit({ ...state, tasks: [...state.tasks, task] });
  return task;
}
