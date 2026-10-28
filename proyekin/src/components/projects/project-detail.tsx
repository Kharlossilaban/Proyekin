"use client";

// Detail proyek (U4-5) — READ-ONLY. Tanpa buat/ubah/hapus proyek (U4-6), tanpa tambah/keluarkan anggota (U4-7), tanpa
// detail atau ubah tugas (U4-9/U4-10) dan tanpa tautan ke detail tugas. Tidak ada aksi mutasi untuk role mana pun,
// termasuk pada proyek Arsip.
//
// Seluruh aturan akses datang dari `access.ts` (satu sumber); komponen ini tidak menulis ulang aturan role:
// - boleh membuka proyek ini        → `canViewProject` (via AccessGuard; URL langsung dan navigasi klien sama)
// - tab Tim                         → `canViewProjectTeam` (Anggota Tim tidak)
// - tugas yang tampil               → `getVisibleProjectTasks` (Anggota Tim hanya miliknya, J5)
// - email anggota di tab Tim        → `canViewOrgUsers` (Owner/Admin; Mandor hanya nama dan role)
// Representasi UI di atas data mock, BUKAN otorisasi (lihat access-guard.tsx untuk keterbatasannya).
//
// Pola route dinamis dari U4-0: server hanya meneruskan id; pencarian data di klien karena ID runtime hanya ada di
// memori tab; ID tidak ada → notFound(). Sebelum sesi diketahui, header proyek dirender (prerender memuat nama proyek
// seed seperti sebelumnya) tetapi tugas dan tim TIDAK dihitung; tampil skeleton.
//
// Nama penanggung jawab diambil dari relasi `User` (bukan salinan `Task.assigneeName`). Tenggat memakai tanggal acuan
// demo (G10) dan halaman menampilkan DemoDataNotice. Tidak ada field atau nominal keuangan di halaman ini.

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, Clock, ListChecks, ListTodo, Lock, TriangleAlert, Users } from "lucide-react";

import { AccessGuard } from "@/components/auth/access-guard";
import { useCurrentUser } from "@/components/auth/use-current-user";
import { TaskCard } from "@/components/tasks/task-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { DemoDataNotice } from "@/components/ui/demo-data-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RecordCard, RecordCardList } from "@/components/ui/record-card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { canViewOrgUsers, canViewProject, canViewProjectTeam, getVisibleProjectTasks, seesOnlyOwnTasks } from "@/lib/access";
import { countOverdue, DEMO_REFERENCE_DATE_LABEL, formatDemoDate } from "@/lib/demo-date";
import {
  DENY_REASON_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  ROLE_LABELS,
  ROLE_TONES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONES,
} from "@/lib/labels";
import { formatProjectPeriod, getProjectTeam, getUserName, type TeamEntry } from "@/lib/project-relations";
import { useMockStore } from "@/lib/use-mock-store";
import type { Project, Task, User } from "@/types";

const BACK_LINK =
  "inline-flex min-h-11 w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-brand-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const UNASSIGNED = "Belum ditugaskan";

function LoadingDetail() {
  return (
    <div role="status" aria-busy="true" data-slot="project-detail-loading" className="flex flex-col gap-4">
      <span className="sr-only">Memuat detail proyek</span>
      <Skeleton className="h-11 w-full max-w-sm" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function InfoItem({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "flex min-w-0 flex-col gap-1 sm:col-span-2" : "flex min-w-0 flex-col gap-1"}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  );
}

function SummaryPanel({ project, tasks, ownOnly, adminName }: { project: Project; tasks: readonly Task[]; ownOnly: boolean; adminName?: string }) {
  const todo = tasks.filter((t) => t.status === "TODO").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const overdue = countOverdue(tasks);

  return (
    <div className="flex flex-col gap-6">
      <Card data-slot="project-info" className="gap-5">
        <h2 className="text-base font-semibold text-foreground">Informasi proyek</h2>
        <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <InfoItem label="Kode">{project.code}</InfoItem>
          <InfoItem label="Status">
            <Badge variant={PROJECT_STATUS_TONES[project.status]} dot>
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </InfoItem>
          <InfoItem label="Klien">{project.client || "—"}</InfoItem>
          <InfoItem label="Lokasi">{project.location || "—"}</InfoItem>
          <InfoItem label="Periode">{formatProjectPeriod(project)}</InfoItem>
          <InfoItem label="Admin Kantor penanggung jawab">{adminName ?? "Belum ditetapkan"}</InfoItem>
          <InfoItem label="Deskripsi" wide>
            {project.description || "—"}
          </InfoItem>
        </dl>
        <ProgressBar value={project.progress} label={`Progres proyek ${project.code}`} />
      </Card>

      <section aria-labelledby="ringkasan-tugas" data-slot="project-task-summary" className="flex flex-col gap-3">
        <h2 id="ringkasan-tugas" className="text-base font-semibold text-foreground">
          {ownOnly ? "Ringkasan tugas Anda" : "Ringkasan tugas"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<ListTodo />}
            label="Total tugas"
            value={tasks.length}
            description={`${todo} belum dimulai`}
            data-stat="total"
          />
          <StatCard icon={<Clock />} label="Dalam Progres" value={inProgress} data-stat="in-progress" />
          <StatCard icon={<CircleCheck />} label="Selesai" value={done} data-stat="done" />
          <StatCard
            icon={<TriangleAlert />}
            label="Terlambat"
            value={overdue}
            description="terhadap tanggal acuan demo"
            tone={overdue > 0 ? "danger" : "default"}
            data-stat="overdue"
          />
        </div>
      </section>
    </div>
  );
}

function TasksPanel({ tasks, users, ownOnly }: { tasks: readonly Task[]; users: readonly User[]; ownOnly: boolean }) {
  return (
    <section aria-labelledby="tugas-proyek" data-slot="project-tasks" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="tugas-proyek" className="text-base font-semibold text-foreground">
          {ownOnly ? "Tugas Anda di proyek ini" : "Tugas proyek"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {tasks.length} tugas · {ownOnly ? "Hanya tugas yang ditugaskan kepada Anda." : "Semua tugas proyek ini."}
        </p>
        <p data-slot="deadline-hint" className="text-sm text-muted-foreground">
          Tenggat mengikuti tanggal acuan demo {DEMO_REFERENCE_DATE_LABEL}.
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card data-slot="project-tasks-empty">
          <EmptyState
            icon={<ListChecks aria-hidden="true" />}
            title={ownOnly ? "Belum ada tugas untuk Anda di proyek ini" : "Belum ada tugas di proyek ini"}
            description={
              ownOnly
                ? "Tugas akan muncul di sini setelah ditugaskan kepada Anda."
                : "Tugas akan muncul di sini setelah dibuat untuk proyek ini."
            }
          />
        </Card>
      ) : (
        <>
          <RecordCardList label="Daftar tugas proyek" data-slot="project-task-cards">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} assigneeName={getUserName(users, task.assigneeId) ?? UNASSIGNED} />
            ))}
          </RecordCardList>
          <div data-slot="project-task-table" className="hidden lg:block">
            <Table label="Tabel tugas proyek">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Kode</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Penanggung Jawab</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tenggat</TableHead>
                  <TableHead className="min-w-32">Progres</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} data-slot="project-task-row" data-task-id={task.id}>
                    <TableCell className="whitespace-nowrap font-medium text-foreground">{task.code}</TableCell>
                    <TableCell className="min-w-40">{task.title}</TableCell>
                    <TableCell className="whitespace-nowrap">{getUserName(users, task.assigneeId) ?? UNASSIGNED}</TableCell>
                    <TableCell>
                      <Badge variant={TASK_PRIORITY_TONES[task.priority]}>{TASK_PRIORITY_LABELS[task.priority]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TASK_STATUS_TONES[task.status]} dot>
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <span className="whitespace-nowrap">{formatDemoDate(task.dueDate) ?? "—"}</span>
                        <DeadlineBadge task={task} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={task.progress} label={`Progres ${task.code}`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}

function TeamPanel({ team, showEmail }: { team: readonly TeamEntry[]; showEmail: boolean }) {
  return (
    <section aria-labelledby="tim-proyek" data-slot="project-team" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="tim-proyek" className="text-base font-semibold text-foreground">
          Tim proyek
        </h2>
        <p className="text-sm text-muted-foreground">{team.length} orang terdaftar di proyek ini.</p>
      </div>

      {team.length === 0 ? (
        <Card data-slot="project-team-empty">
          <EmptyState
            icon={<Users aria-hidden="true" />}
            title="Belum ada tim di proyek ini"
            description="Belum ada Admin Kantor penanggung jawab atau anggota yang terdaftar di proyek ini."
          />
        </Card>
      ) : (
        <>
          <RecordCardList label="Daftar tim proyek" data-slot="project-team-cards">
            {team.map(({ user, isAdminPrincipal }) => (
              <RecordCard
                key={user.id}
                title={user.name}
                data-user-id={user.id}
                fields={[
                  {
                    label: "Peran",
                    value: (
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge variant={ROLE_TONES[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                        {isAdminPrincipal ? <Badge variant="neutral">Penanggung jawab</Badge> : null}
                      </span>
                    ),
                  },
                  ...(showEmail ? [{ label: "Email", value: user.email }] : []),
                ]}
              />
            ))}
          </RecordCardList>
          <div data-slot="project-team-table" className="hidden lg:block">
            <Table label="Tabel tim proyek">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nama</TableHead>
                  <TableHead>Peran</TableHead>
                  {showEmail ? <TableHead>Email</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map(({ user, isAdminPrincipal }) => (
                  <TableRow key={user.id} data-slot="project-team-row" data-user-id={user.id}>
                    <TableCell className="min-w-48 font-medium text-foreground">{user.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={ROLE_TONES[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                        {isAdminPrincipal ? <Badge variant="neutral">Penanggung jawab</Badge> : null}
                      </div>
                    </TableCell>
                    {showEmail ? <TableCell className="break-all">{user.email}</TableCell> : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}

function ProjectDetailView({ project }: { project: Project }) {
  const current = useCurrentUser();
  const data = useMockStore();
  const actor = current.status === "ready" ? current.user : null;

  // Sebelum sesi diketahui, jangan menghitung tugas atau tim (HTML prerender hanya memuat header proyek).
  const tasks = actor ? getVisibleProjectTasks(actor, project, data) : null;
  const showTeam = actor ? canViewProjectTeam(actor, project, data) : false;
  const showEmail = actor ? canViewOrgUsers(actor) : false;
  const ownOnly = seesOnlyOwnTasks(actor);
  const readOnlyArchive = project.status === "ARCHIVED";

  return (
    <div
      data-detail="found"
      data-entity="project"
      data-id={project.id}
      data-state={tasks ? "ready" : "loading"}
      className="flex min-w-0 flex-col gap-6"
    >
      <Link href="/proyek" data-slot="back-link" className={BACK_LINK}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        Daftar proyek
      </Link>

      <PageHeader
        eyebrow={project.code}
        title={project.name}
        description={project.client}
        actions={
          <>
            <Badge variant={PROJECT_STATUS_TONES[project.status]} dot>
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
            {readOnlyArchive ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Lock aria-hidden="true" className="size-3" />
                Hanya baca
              </span>
            ) : null}
          </>
        }
      />

      {readOnlyArchive ? (
        <div
          role="note"
          data-slot="archived-note"
          className="flex items-start gap-2 rounded-md border border-border bg-muted p-3 text-sm text-foreground"
        >
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>{DENY_REASON_LABELS.ARCHIVED}</p>
        </div>
      ) : null}

      {!actor || !tasks ? (
        <LoadingDetail />
      ) : (
        <Tabs defaultValue="ringkasan">
          <TabsList aria-label="Bagian detail proyek">
            <TabsTab value="ringkasan" data-tab="ringkasan">
              Ringkasan
            </TabsTab>
            <TabsTab value="tugas" data-tab="tugas">
              Tugas ({tasks.length})
            </TabsTab>
            {showTeam ? (
              <TabsTab value="tim" data-tab="tim">
                Tim
              </TabsTab>
            ) : null}
          </TabsList>

          <TabsPanel value="ringkasan">
            <SummaryPanel project={project} tasks={tasks} ownOnly={ownOnly} adminName={getUserName(data.users, project.adminId)} />
          </TabsPanel>
          <TabsPanel value="tugas">
            <TasksPanel tasks={tasks} users={data.users} ownOnly={ownOnly} />
          </TabsPanel>
          {showTeam ? (
            <TabsPanel value="tim">
              <TeamPanel team={getProjectTeam(project, data)} showEmail={showEmail} />
            </TabsPanel>
          ) : null}
        </Tabs>
      )}

      {/* Catatan kaki: isi tab (tugas) harus terlihat di layar pertama 375px (Mandor mobile-first). Tetap selalu tampil. */}
      <DemoDataNotice showDeadlineReference />
    </div>
  );
}

function ProjectDetail({ projectId }: { projectId: string }) {
  const data = useMockStore();
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) notFound();

  return (
    <AccessGuard allow={(actor, store) => canViewProject(actor, project, store)}>
      <ProjectDetailView project={project} />
    </AccessGuard>
  );
}

export { ProjectDetail };
