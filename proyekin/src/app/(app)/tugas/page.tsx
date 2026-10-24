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
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONES,
} from "@/lib/labels";

export const metadata = { title: "Tugas — Proyekin" };

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
                    <Badge variant={TASK_PRIORITY_TONES[t.priority]}>
                      {TASK_PRIORITY_LABELS[t.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={TASK_STATUS_TONES[t.status]} dot>
                      {TASK_STATUS_LABELS[t.status]}
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
