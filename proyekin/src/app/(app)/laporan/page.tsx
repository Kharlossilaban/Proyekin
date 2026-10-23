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

      <Card>
        <CardHeader>
          <CardTitle>Semua Laporan</CardTitle>
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
                <TableRow key={r.id}>
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
