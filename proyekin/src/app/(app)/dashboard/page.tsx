import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export const metadata = { title: "Dashboard — Proyekin" };

// Dashboard Access Correction (keputusan Owner 2026-11-13): seluruh data Dashboard diturunkan di klien dari proyek dalam
// lingkup pengguna aktif (`lib/dashboard-summary.ts` → `access.ts`), bukan dari seed penuh. Lihat DashboardOverview.
export default function DashboardPage() {
  return <DashboardOverview />;
}
