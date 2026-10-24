// SPIKE U4-0 — BUKAN store final. Dipakai hanya untuk membuktikan route dinamis dengan data di memori klien.
// U4-1 menggantikan berkas ini dengan `mock-store.ts` (model data, relasi, dan fungsi async sesuai rencana).
//
// - Data hanya hidup di memori tab ini; hilang saat halaman dimuat ulang (keputusan J9).
// - Snapshot server selalu berisi seed, jadi HTML prerender dan hidrasi konsisten.
// - Tidak ada penyimpanan permanen, API, atau klaim keamanan.

import { MOCK_PROJECTS, MOCK_TASKS } from "@/data/mock";
import type { Project, Task } from "@/types";

interface SpikeState {
  projects: readonly Project[];
  tasks: readonly Task[];
}

const SEED: SpikeState = { projects: MOCK_PROJECTS, tasks: MOCK_TASKS };

let state: SpikeState = SEED;
const listeners = new Set<() => void>();

function commit(next: SpikeState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeSpikeStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getSpikeSnapshot = (): SpikeState => state;
export const getSpikeServerSnapshot = (): SpikeState => SEED;

function nextNumber(ids: readonly string[]): number {
  return ids.reduce((max, id) => Math.max(max, Number(id.split("-")[1]) || 0), 0) + 1;
}

const pad = (n: number) => String(n).padStart(3, "0");

/** Membuat proyek uji di memori. Hanya untuk spike. */
export function createSpikeProject(): Project {
  const n = nextNumber(state.projects.map((p) => p.id));
  const project: Project = {
    id: `p-${pad(n)}`,
    code: `PRJ-${pad(n)}`,
    name: `Proyek uji runtime ${pad(n)}`,
    description: "Dibuat di memori klien untuk menguji route dinamis (spike U4-0).",
    status: "DRAFT",
    startDate: "2026-03-21",
    endDate: "2026-03-21",
    budget: 0,
    progress: 0,
    client: "(uji)",
    location: "(uji)",
  };
  commit({ ...state, projects: [...state.projects, project] });
  return project;
}

/** Membuat tugas uji di memori. Hanya untuk spike. */
export function createSpikeTask(): Task {
  const n = nextNumber(state.tasks.map((t) => t.id));
  const task: Task = {
    id: `t-${pad(n)}`,
    code: `TSK-${pad(n)}`,
    projectId: "p-001",
    title: `Tugas uji runtime ${pad(n)}`,
    status: "TODO",
    priority: "LOW",
    progress: 0,
  };
  commit({ ...state, tasks: [...state.tasks, task] });
  return task;
}
