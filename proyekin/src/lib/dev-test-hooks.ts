// HOOK UJI — HANYA DEVELOPMENT (`next dev`). TIDAK ADA DI PRODUCTION.
//
// Tujuan: pengujian browser U4-7 (`scripts/check-u4-project-members.mjs`) perlu mengubah store mock SAAT sebuah dialog terbuka
// untuk membuktikan keadaan "stale" (data berubah sebelum aksi disimpan). Hook hanya meneruskan fungsi store yang sudah ada;
// tidak ada route, halaman debug, atau flag NEXT_PUBLIC.
//
// Pemisahan dari production:
// 1. Modul ini hanya dimuat lewat `import()` dinamis di dalam cabang `process.env.NODE_ENV === "development"` (use-mock-store.ts).
//    Next.js mengganti `process.env.NODE_ENV` secara statis saat build, sehingga di production cabang itu mati dan dibuang.
// 2. `installDevTestHooks` memeriksa ulang NODE_ENV dan tidak melakukan apa pun di luar development.
// 3. Bukti otomatis: `check:u4-project-members` membangun production, memastikan penanda `__PROYEKIN_TEST__` tidak ada di
//    keluaran `.next`, lalu menjalankan `next start` dan memastikan `window.__PROYEKIN_TEST__` tidak terdefinisi.
// Store mock hanya ada di memori tab dan bukan data sungguhan; tetap, hook ini tidak boleh ada di production.

import {
  addProjectMember,
  createTask,
  getMockStoreSnapshot,
  removeProjectMember,
  resetMockStore,
  setProjectAdmin,
  updateProject,
} from "@/lib/mock-store";

declare global {
  interface Window {
    __PROYEKIN_TEST__?: Readonly<Record<string, unknown>>;
  }
}

export function installDevTestHooks(): void {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return;
  window.__PROYEKIN_TEST__ = Object.freeze({
    addProjectMember,
    removeProjectMember,
    setProjectAdmin,
    updateProject,
    createTask,
    snapshot: getMockStoreSnapshot,
    reset: resetMockStore,
  });
}
