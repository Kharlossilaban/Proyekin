import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordCard, RecordCardList } from "@/components/ui/record-card";
import { MOCK_REPORTS } from "@/data/mock";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Laporan — Proyekin" };

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  APPROVED: "success",
  SUBMITTED: "warning",
  DRAFT: "neutral",
  REJECTED: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Disetujui",
  SUBMITTED: "Terkirim",
  DRAFT: "Draf",
  REJECTED: "Ditolak",
};

export default function LaporanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-charcoal">
          Laporan Harian
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Laporan aktivitas harian dari mandor.
          <span className="ml-1 text-xs text-warning">(Data demo)</span>
        </p>
      </div>

      {/* Di bawah lg: kartu (semua kolom tabel tampil sebagai pasangan label-nilai). */}
      <section aria-labelledby="laporan-kartu" data-slot="records-mobile" className="flex min-w-0 flex-col gap-4 lg:hidden">
        <div className="flex flex-col gap-1">
          <h2 id="laporan-kartu" className="text-base font-semibold text-foreground">
            Semua Laporan
          </h2>
          <p className="text-sm text-muted-foreground">{MOCK_REPORTS.length} laporan</p>
        </div>
        <RecordCardList label="Daftar laporan harian">
          {MOCK_REPORTS.map((r) => (
            <RecordCard
              key={r.id}
              data-record-id={r.id}
              title={formatDate(r.date)}
              fields={[
                { label: "Proyek", value: r.projectCode },
                { label: "Mandor", value: r.foremanName },
                { label: "Pekerja", value: r.workersCount },
                { label: "Cuaca", value: r.weather },
                {
                  label: "Status",
                  value: (
                    <Badge variant={STATUS_VARIANT[r.status] ?? "neutral"} dot>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  ),
                },
              ]}
            />
          ))}
        </RecordCardList>
      </section>

      {/* Mulai lg: tabel. */}
      <Card data-slot="records-desktop" className="hidden lg:flex">
        <CardHeader>
          <CardTitle as="h2">Semua Laporan</CardTitle>
          <CardDescription>{MOCK_REPORTS.length} laporan</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table label="Daftar laporan harian">
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Proyek</TableHead>
                <TableHead>Mandor</TableHead>
                <TableHead>Pekerja</TableHead>
                <TableHead>Cuaca</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_REPORTS.map((r) => (
                <TableRow key={r.id} data-record-id={r.id}>
                  <TableCell className="whitespace-nowrap font-medium text-foreground">
                    {formatDate(r.date)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.projectCode}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.foremanName}
                  </TableCell>
                  <TableCell align="right">{r.workersCount}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.weather}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "neutral"} dot>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
