"use client";

// Daftar proyek (U4-4) dengan tombol "Tambah proyek" (U4-6) hanya untuk role yang `canCreateProject` (Owner). Ubah dan
// hapus ada di halaman detail. Tanpa kelola anggota. Lingkup per role diputuskan SEPENUHNYA oleh `getVisibleProjects` (access.ts, G8): komponen ini tidak menulis ulang
// aturan role. Representasi UI di atas data mock, BUKAN otorisasi (lihat access-guard.tsx untuk keterbatasannya).
//
// Tampilan: kartu satu kolom di bawah `lg` (mobile-first, seluruh kartu adalah satu target sentuh ≥44px) dan tabel
// di `lg` ke atas (desktop-first untuk Owner/Admin). Status selalu berupa label + titik, tidak hanya warna.

import * as React from "react";
import Link from "next/link";
import { ChevronRight, FolderKanban, Lock, Plus } from "lucide-react";

import { useCurrentUser } from "@/components/auth/use-current-user";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoDataNotice } from "@/components/ui/demo-data-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canCreateProject, getVisibleProjects, isProjectReadOnly } from "@/lib/access";
import { DENY_REASON_LABELS, PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES } from "@/lib/labels";
import { formatProjectPeriod } from "@/lib/project-relations";
import { useMockStore } from "@/lib/use-mock-store";
import type { Project } from "@/types";

const detailHref = (project: Project): string => `/proyek/${project.id}`;

const LINK_FOCUS =
  "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function StatusCell({ project }: { project: Project }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={PROJECT_STATUS_TONES[project.status]} dot>
        {PROJECT_STATUS_LABELS[project.status]}
      </Badge>
      {isProjectReadOnly(project) ? (
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
        <dd className="min-w-0 text-foreground">{formatProjectPeriod(project)}</dd>
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
            <TableCell className="whitespace-nowrap">{formatProjectPeriod(project)}</TableCell>
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
        actions={
          current.status === "ready" && canCreateProject(current.user) ? (
            <ProjectFormDialog
              mode="create"
              trigger={
                <Button size="touch" data-action="create-project">
                  <Plus aria-hidden="true" className="size-4" />
                  Tambah proyek
                </Button>
              }
            />
          ) : undefined
        }
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
