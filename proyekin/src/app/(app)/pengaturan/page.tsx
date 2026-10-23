import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Settings } from "lucide-react";

export const metadata = { title: "Pengaturan — Proyekin" };

export default function PengaturanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-charcoal">
          Pengaturan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preferensi dan konfigurasi.
          <span className="ml-1 text-xs text-warning">(Data demo)</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Umum</CardTitle>
          <CardDescription>
            Halaman ini akan berisi pengaturan organisasi dan preferensi pengguna.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Settings />}
            title="Segera hadir"
            description="Fitur pengaturan akan tersedia pada fase berikutnya."
          />
        </CardContent>
      </Card>
    </div>
  );
}
