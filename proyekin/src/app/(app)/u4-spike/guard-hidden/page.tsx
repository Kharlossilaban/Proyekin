import { HiddenGuard } from "@/components/spike/route-guard";
import { assertSpikeEnabled } from "@/lib/u4-spike-gate";

export const metadata = { title: "Spike guard B — Proyekin" };

// Eksperimen: hanya Owner dan Admin Kantor (peran ini hanya untuk uji guard; bukan matriks akses U4).
export default function GuardHiddenPage() {
  assertSpikeEnabled();
  return (
    <HiddenGuard allow={["OWNER", "ADMIN"]}>
      <h1 className="text-2xl font-semibold text-charcoal">Guard B (menyembunyikan)</h1>
      <p data-spike="guarded-content">KONTEN-UJI-GUARD-HIDDEN</p>
    </HiddenGuard>
  );
}
