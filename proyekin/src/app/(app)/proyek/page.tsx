import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_PROJECTS } from "@/data/mock";
import { formatRupiah } from "@/lib/utils";

export const metadata = { title: "Proyek — Proyekin" };

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  ON_PROGRESS: "success",
  PAUSED: "warning",
  COMPLETED: "neutral",
  ARCHIVED: "neutral",
  DRAFT: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  ON_PROGRESS: "Berjalan",
  PAUSED: "Tertunda",
  COMPLETED: "Selesai",
  ARCHIVED: "Arsip",
  DRAFT: "Draf",
};

export default function ProyekPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-charcoal">
          Proyek
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daftar proyek konstruksi.
          <span className="ml-1 text-xs text-warning">(Data demo)</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MOCK_PROJECTS.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{p.code}</p>
                  <CardTitle className="mt-1">{p.name}</CardTitle>
                </div>
                <Badge variant={STATUS_VARIANT[p.status] ?? "neutral"} dot>
                  {STATUS_LABEL[p.status] ?? p.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-graphite line-clamp-2">
                {p.description}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Klien</dt>
                <dd className="text-foreground">{p.client}</dd>
                <dt className="text-muted-foreground">Anggaran</dt>
                <dd className="tabular-nums text-foreground">
                  {formatRupiah(p.budget)}
                </dd>
                <dt className="text-muted-foreground">Progres</dt>
                <dd className="text-foreground">{p.progress}%</dd>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
