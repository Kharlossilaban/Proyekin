import { SpikeControls } from "@/components/spike/spike-controls";
import { assertSpikeEnabled } from "@/lib/u4-spike-gate";

export const metadata = { title: "Spike U4-0 — Proyekin" };

export default function SpikePage() {
  assertSpikeEnabled();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-charcoal">Spike U4-0: route dinamis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Halaman uji sementara (bukan fitur). Hanya tersedia saat development atau build dengan U4_SPIKE=1.
        </p>
      </div>
      <SpikeControls />
    </div>
  );
}
