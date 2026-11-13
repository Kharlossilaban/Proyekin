"use client";

// Dashboard Owner/Admin Kantor (Dashboard Access Correction, keputusan Owner 2026-11-13). Semua angka dan tabel berasal dari
// `getDashboardSummary` (lingkup dari access.ts) atas store mock + sesi demo, sehingga Admin hanya melihat proyek yang ia
// tangani sebagai Admin principal dan perubahan di tab yang sama (mis. penetapan Admin) langsung tercermin. Selama sesi belum
// diketahui (server/hidrasi) tidak ada data proyek yang dirender — HTML prerender tidak lagi memuat tabel proyek.
// Representasi UI mock, BUKAN otorisasi: data seed tetap ada di bundel JavaScript; penegakan sesungguhnya wajib di backend.

import * as React from "react";
import { FileText, FolderKanban, FolderOpen, ListChecks, Users } from "lucide-react";

import { useCurrentUser } from "@/components/auth/use-current-user";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Laporan harian belum ada di store mock (scope U5); dibaca dari seed lalu DISARING ke proyek dalam lingkup.
import { MOCK_REPORTS } from "@/data/mock";
import { getDashboardSummary, type DashboardSummary } from "@/lib/dashboard-summary";
import { DASHBOARD_TEXT, getDashboardEmptyText, getDashboardScopeText, PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES } from "@/lib/labels";
import { useMockStore } from "@/lib/use-mock-store";

function DashboardOverview() {
  const current = useCurrentUser();
  const data = useMockStore();
  const summary = React.useMemo<DashboardSummary | null>(
    () => (current.status === "ready" ? getDashboardSummary(current.user, data, MOCK_REPORTS) : null),
    [current, data],
  );

  return (
    <div data-slot="dashboard" data-state={summary ? "ready" : "loading"} aria-busy={summary ? undefined : true} className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={
          summary ? (
            <>
              <span data-slot="dashboard-scope">{getDashboardScopeText(summary.scope, summary.projects.length)}</span>
              <span className="ml-1 text-xs text-warning">(Data demo)</span>
            </>
          ) : (
            <span className="sr-only" role="status">
              {DASHBOARD_TEXT.loading}
            </span>
          )
        }
      />
      {summary ? <DashboardContent summary={summary} /> : <DashboardSkeleton />}
    </div>
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  const { stats } = DASHBOARD_TEXT;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard data-stat="active-projects" icon={<FolderKanban />} label={stats.activeProjects.label} value={summary.activeProjects} description={stats.activeProjects.description} />
        <StatCard data-stat="pending-tasks" icon={<ListChecks />} label={stats.pendingTasks.label} value={summary.pendingTasks} description={stats.pendingTasks.description} />
        <StatCard data-stat="pending-reports" icon={<FileText />} label={stats.pendingReports.label} value={summary.pendingReports} description={stats.pendingReports.description} />
        <StatCard data-stat="team-members" icon={<Users />} label={stats.teamMembers.label} value={summary.teamMembers} description={stats.teamMembers.description} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Proyek</CardTitle>
          <CardDescription>Daftar proyek dan statusnya</CardDescription>
        </CardHeader>
        {summary.projects.length === 0 ? (
          <CardContent>
            <EmptyState
              data-slot="dashboard-empty"
              icon={<FolderOpen />}
              {...getDashboardEmptyText(summary.scope)}
              className="py-10"
            />
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <Table label="Daftar proyek" data-slot="dashboard-projects">
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Proyek</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progres</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap font-medium text-foreground">{p.code}</TableCell>
                    <TableCell className="min-w-[200px]">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant={PROJECT_STATUS_TONES[p.status]} dot>
                        {PROJECT_STATUS_LABELS[p.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={p.progress} label={`Progres proyek ${p.code}`} className="w-32" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[76px] w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export { DashboardOverview };
