import {
  FolderKanban,
  ListChecks,
  FileText,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_REPORTS, MOCK_USERS } from "@/data/mock";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES } from "@/lib/labels";
import { formatRupiah } from "@/lib/utils";

export const metadata = { title: "Dashboard — Proyekin" };

export default function DashboardPage() {
  const activeProjects = MOCK_PROJECTS.filter(
    (p) => p.status === "ON_PROGRESS" || p.status === "PAUSED",
  );
  const pendingTasks = MOCK_TASKS.filter((t) => t.status !== "DONE");
  const pendingReports = MOCK_REPORTS.filter((r) => r.status === "SUBMITTED");
  const teamCount = MOCK_USERS.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-charcoal">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan proyek dan aktivitas tim.
          <span className="ml-1 text-xs text-warning">(Data demo)</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FolderKanban className="size-5" />}
          label="Proyek Aktif"
          value={activeProjects.length}
        />
        <StatCard
          icon={<ListChecks className="size-5" />}
          label="Tugas Tertunda"
          value={pendingTasks.length}
        />
        <StatCard
          icon={<FileText className="size-5" />}
          label="Laporan Menunggu"
          value={pendingReports.length}
        />
        <StatCard
          icon={<Users className="size-5" />}
          label="Anggota Tim"
          value={teamCount}
        />
      </div>

      {/* Project table */}
      <Card>
        <CardHeader>
          <CardTitle as="h2">Proyek</CardTitle>
          <CardDescription>Daftar proyek dan statusnya</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table label="Daftar proyek">
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Proyek</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progres</TableHead>
                <TableHead align="right">Anggaran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PROJECTS.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap font-medium text-foreground">
                    {p.code}
                  </TableCell>
                  <TableCell className="min-w-[200px]">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant={PROJECT_STATUS_TONES[p.status]} dot>
                      {PROJECT_STATUS_LABELS[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {p.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    {formatRupiah(p.budget)}
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-brand-text">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums text-charcoal">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
