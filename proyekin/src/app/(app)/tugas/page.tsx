import { TaskCard } from "@/components/tasks/task-card";
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
import { DemoDataNotice } from "@/components/ui/demo-data-notice";
import { RecordCardList } from "@/components/ui/record-card";
import { MOCK_PROJECTS, MOCK_TASKS } from "@/data/mock";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONES,
} from "@/lib/labels";

export const metadata = { title: "Tugas — Proyekin" };

const projectLabel = (projectId: string): string | undefined => {
  const project = MOCK_PROJECTS.find((p) => p.id === projectId);
  return project ? `${project.code} · ${project.name}` : undefined;
};

// Presentasi saja: dataset dan daftar sama untuk semua role pada tahap ini. Pembatasan lingkup tugas per role dan tautan
// ke detail adalah pekerjaan U4-8 (getVisibleTasks); jangan ditambahkan di sini.
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

      {/* Di bawah lg: kartu tugas (semua kolom tabel tampil, ditambah proyek dan tenggat terhadap tanggal acuan demo). */}
      <section aria-labelledby="tugas-kartu" data-slot="records-mobile" className="flex min-w-0 flex-col gap-4 lg:hidden">
        <div className="flex flex-col gap-1">
          <h2 id="tugas-kartu" className="text-base font-semibold text-foreground">
            Semua Tugas
          </h2>
          <p className="text-sm text-muted-foreground">{MOCK_TASKS.length} tugas</p>
        </div>
        <DemoDataNotice showDeadlineReference />
        <RecordCardList label="Daftar tugas">
          {MOCK_TASKS.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              projectLabel={projectLabel(t.projectId)}
              assigneeName={t.assigneeName}
            />
          ))}
        </RecordCardList>
      </section>

      {/* Mulai lg: tabel. */}
      <Card data-slot="records-desktop" className="hidden lg:flex">
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
                <TableRow key={t.id} data-record-id={t.id}>
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
