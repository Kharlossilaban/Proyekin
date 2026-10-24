import { GatingGuard } from "@/components/spike/route-guard";
import { assertSpikeEnabled } from "@/lib/u4-spike-gate";

export const metadata = { title: "Spike guard A — Proyekin" };

// Eksperimen: hanya Owner dan Admin Kantor (peran ini hanya untuk uji guard; bukan matriks akses U4).
export default function GuardGatingPage() {
  assertSpikeEnabled();
  return (
    <GatingGuard allow={["OWNER", "ADMIN"]}>
      <h1 className="text-2xl font-semibold text-charcoal">Guard A (menahan)</h1>
      <p data-spike="guarded-content">KONTEN-UJI-GUARD-GATING</p>
    </GatingGuard>
  );
}
