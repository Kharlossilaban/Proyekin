import { notFound } from "next/navigation";

// SPIKE U4-0 — halaman kontrol/eksperimen hanya ada saat development, atau saat build memakai U4_SPIKE=1
// (dipakai `npm run check:dynamic-routes` untuk memverifikasi perilaku produksi). Build biasa menghasilkan 404.
export function assertSpikeEnabled() {
  if (process.env.NODE_ENV === "production" && process.env.U4_SPIKE !== "1") notFound();
}
