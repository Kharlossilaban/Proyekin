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
import { MOCK_TASKS } from "@/data/mock";

export const metadata = { title: "Tugas — Proyekin" };

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  DONE: "success",
  IN_PROGRESS: "warning",
  TODO: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  DONE: "Selesai",
  IN_PROGRESS: "Dalam Progres",
  TODO: "Belum Dimulai",
};

const PRIORITY_VARIANT: Record<string, "danger" | "warning" | "neutral"> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
};

export default function TugasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-charcoal">
          Tugas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daftar tugas seluruh proyek.
          <span className="ml-1 text-xs text-warning">(Data demo)</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Semua Tugas</CardTitle>
          <CardDescription>{MOCK_TASKS.length} tugas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table label="Daftar tugas">
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Penanggung Jawab</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Progres</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TASKS.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap font-medium text-foreground">
                    {t.code}
                  </TableCell>
                  <TableCell className="min-w-[200px]">{t.title}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {t.assigneeName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={PRIORITY_VARIANT[t.priority] ?? "neutral"}>
                      {PRIORITY_LABEL[t.priority] ?? t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[t.status] ?? "neutral"} dot>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">{t.progress}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
