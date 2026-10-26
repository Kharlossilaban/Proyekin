"use client";

// Daftar proyek (U4-4). Hanya DAFTAR: tanpa buat/ubah/hapus proyek, tanpa kelola anggota, tanpa detail final.
// Lingkup per role diputuskan SEPENUHNYA oleh `getVisibleProjects` (access.ts, G8): komponen ini tidak menulis ulang
// aturan role. Representasi UI di atas data mock, BUKAN otorisasi (lihat access-guard.tsx untuk keterbatasannya).
//
// Anggaran (`budget`) sengaja TIDAK ditampilkan: belum ada keputusan siapa boleh melihat angka keuangan proyek,
// dan membuat aturan role baru di sini akan menduplikasi matriks izin. Keputusan itu dibawa ke U4-5.
//
// Tampilan: kartu satu kolom di bawah `lg` (mobile-first, seluruh kartu adalah satu target sentuh ≥44px) dan tabel
// di `lg` ke atas (desktop-first untuk Owner/Admin). Status selalu berupa label + titik, tidak hanya warna.

import * as React from "react";
import Link from "next/link";
import { ChevronRight, FolderKanban, Lock } from "lucide-react";

import { useCurrentUser } from "@/components/auth/use-current-user";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DemoDataNotice } from "@/components/ui/demo-data-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getVisibleProjects } from "@/lib/access";
import { formatDemoDate } from "@/lib/demo-date";
import { DENY_REASON_LABELS, PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES } from "@/lib/labels";
import { useMockStore } from "@/lib/use-mock-store";
import type { Project } from "@/types";

const formatPeriod = (project: Project): string => {
  const start = formatDemoDate(project.startDate);
  const end = formatDemoDate(project.endDate);
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? "—";
};

const isReadOnly = (project: Project): boolean => project.status === "ARCHIVED";

const detailHref = (project: Project): string => `/proyek/${project.id}`;

const LINK_FOCUS =
  "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function StatusCell({ project }: { project: Project }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={PROJECT_STATUS_TONES[project.status]} dot>
        {PROJECT_STATUS_LABELS[project.status]}
      </Badge>
      {isReadOnly(project) ? (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={DENY_REASON_LABELS.ARCHIVED}>
          <Lock aria-hidden="true" className="size-3" />
          Hanya baca
        </span>
      ) : null}
    </div>
  );
}

/** Kartu mobile: seluruh kartu satu tautan (area sentuh penuh), tanpa aksi yang hanya muncul saat hover. */
function ProjectCard({ project }: { project: Project }) {
  return (
    <Card
      data-slot="project-card"
      data-project-id={project.id}
      interactive
      className="relative gap-3 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">{project.code}</p>
          <h3 className="text-base font-semibold text-foreground">
            <Link
              href={detailHref(project)}
              className={`${LINK_FOCUS} after:absolute after:inset-0 after:content-['']`}
            >
              {project.name}
            </Link>
          </h3>
        </div>
        <ChevronRight aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted-foreground" />
      </div>

      <StatusCell project={project} />

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Klien</dt>
        <dd className="min-w-0 text-foreground">{project.client}</dd>
        <dt className="text-muted-foreground">Periode</dt>
        <dd className="min-w-0 text-foreground">{formatPeriod(project)}</dd>
        <dt className="text-muted-foreground">Lokasi</dt>
        <dd className="min-w-0 text-foreground">{project.location}</dd>
      </dl>

      <ProgressBar value={project.progress} label={`Progres ${project.code}`} />
    </Card>
  );
}

function ProjectTable({ projects }: { projects: readonly Project[] }) {
  return (
    <Table label="Tabel proyek">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Proyek</TableHead>
          <TableHead>Klien</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Periode</TableHead>
          <TableHead className="min-w-40">Progres</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id} data-slot="project-row" data-project-id={project.id}>
            <TableCell className="min-w-64">
              <p className="text-xs font-medium text-muted-foreground">{project.code}</p>
              <Link href={detailHref(project)} className={`${LINK_FOCUS} font-medium text-foreground underline-offset-4 hover:underline`}>
                {project.name}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">{project.location}</p>
            </TableCell>
            <TableCell className="min-w-40">{project.client}</TableCell>
            <TableCell>
              <StatusCell project={project} />
            </TableCell>
            <TableCell className="whitespace-nowrap">{formatPeriod(project)}</TableCell>
            <TableCell>
              <ProgressBar value={project.progress} label={`Progres ${project.code}`} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LoadingList() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">Memuat daftar proyek</span>
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}

function ProjectList() {
  const current = useCurrentUser();
  const data = useMockStore();

  // Sebelum sesi diketahui, jangan menghitung atau merender data proyek (HTML prerender tidak memuat daftar).
  const projects = current.status === "ready" ? getVisibleProjects(current.user, data) : null;

  return (
    <div className="flex min-w-0 flex-col gap-6" data-slot="project-list" data-state={projects ? "ready" : "loading"}>
      <PageHeader
        title="Proyek"
        description={projects ? `${projects.length} proyek dalam lingkup akses Anda.` : "Daftar proyek konstruksi."}
      />
      <DemoDataNotice />

      <section aria-labelledby="project-list-heading" className="flex min-w-0 flex-col gap-4">
        <h2 id="project-list-heading" className="sr-only">
          Daftar proyek
        </h2>

        {projects === null ? (
          <LoadingList />
        ) : projects.length === 0 ? (
          <Card data-slot="project-empty">
            <EmptyState
              icon={<FolderKanban aria-hidden="true" />}
              title="Belum ada proyek yang dapat Anda akses"
              description="Proyek akan muncul di sini setelah Anda ditugaskan sebagai Admin Kantor proyek atau didaftarkan sebagai anggota proyek."
            />
          </Card>
        ) : (
          <>
            <div data-slot="project-cards" className="grid gap-4 md:grid-cols-2 lg:hidden">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            <div data-slot="project-table" className="hidden lg:block">
              <ProjectTable projects={projects} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export { ProjectList };
