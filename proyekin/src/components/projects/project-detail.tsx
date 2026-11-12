"use client";

// Detail proyek (U4-5) dengan aksi ubah dan hapus proyek (U4-6). Aksi HANYA muncul untuk role yang berhak menurut
// `access.ts` (`canEditProject`: Owner atau Admin principal proyek itu; `canDeleteProject`: Owner) dan tidak pernah pada
// proyek Arsip. Kelola anggota dan Admin penanggung jawab (U4-7) ada di tab Tim (`ProjectTeamPanel`). Tanpa detail atau ubah
// tugas (U4-9/U4-10) dan tanpa tautan ke detail tugas. Mandor, Anggota Tim, dan Guest tidak melihat aksi apa pun.
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
import { notFound, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CircleCheck, Clock, ListChecks, ListTodo, Lock, Pencil, TriangleAlert, X } from "lucide-react";

import { AccessGuard } from "@/components/auth/access-guard";
import { useCurrentUser } from "@/components/auth/use-current-user";
import { ProjectDeleteDialog } from "@/components/projects/project-delete-dialog";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectTeamPanel } from "@/components/projects/project-team-panel";
import { TaskCard } from "@/components/tasks/task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { DemoDataNotice } from "@/components/ui/demo-data-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RecordCardList } from "@/components/ui/record-card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import {
  canDeleteProject,
  canEditProject,
  canViewOrgUsers,
  canViewProject,
  canViewProjectTeam,
  getVisibleProjectTasks,
  isProjectReadOnly,
  seesOnlyOwnTasks,
} from "@/lib/access";
import { countOverdue, DEMO_REFERENCE_DATE_LABEL, formatDemoDate } from "@/lib/demo-date";
import {
  DENY_REASON_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONES,
} from "@/lib/labels";
import { formatProjectPeriod, getUserName } from "@/lib/project-relations";
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

/**
 * Banner sukses (satu pola untuk pesan tambah dan ubah, U4-6). `focusOnMount`: fokus programatik ke banner agar pembaca layar
 * membacanya setelah navigasi; banner bukan kontrol, jadi cincin fokus global disembunyikan pada elemen ini saja.
 */
function SuccessBanner({
  message,
  onDismiss,
  focusOnMount = false,
  ...props
}: { message: string; onDismiss: () => void; focusOnMount?: boolean } & Omit<React.ComponentProps<"div">, "children">) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (focusOnMount) ref.current?.focus();
  }, [focusOnMount]);
  return (
    <div
      ref={ref}
      tabIndex={focusOnMount ? -1 : undefined}
      style={focusOnMount ? { outline: "none" } : undefined}
      className="flex items-start gap-2 rounded-md border border-success/30 bg-success-soft p-3 text-sm text-foreground"
      {...props}
    >
      <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
      <p className="min-w-0 flex-1">{message}</p>
      <Button variant="ghost" size="icon" aria-label="Tutup pesan" onClick={onDismiss} className="-m-2.5 size-11 shrink-0">
        <X aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

/** Pesan sukses setelah tambah proyek (U4-6): penanda `?dibuat=1` dari `router.push` di dialog tambah. */
function CreatedNotice({ project, onDismissed }: { project: Project; onDismissed: () => void }) {
  const created = useSearchParams().get("dibuat") === "1";
  const pathname = usePathname();
  const router = useRouter();
  if (!created) return null;
  return (
    <SuccessBanner
      role="status"
      data-slot="created-notice"
      focusOnMount
      message={`Proyek ${project.code} berhasil ditambahkan (simulasi).`}
      onDismiss={() => {
        router.replace(pathname);
        onDismissed();
      }}
    />
  );
}

/** Keadaan setelah proyek dihapus di halaman ini (simulasi). Fokus dipindah ke judul agar pembaca layar tahu hasilnya. */
function DeletedState({ project }: { project: Project }) {
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <div data-detail="deleted" data-entity="project" data-id={project.id} className="flex min-w-0 flex-col gap-4">
      <div role="status" className="flex flex-col gap-2">
        {/* Fokus programatik (tabIndex -1) hanya agar pembaca layar membaca hasilnya; judul bukan kontrol, jadi cincin fokus
            global disembunyikan di elemen ini saja (aturan :focus-visible di luar layer mengalahkan kelas utilitas). */}
        <h1 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} className="text-2xl font-semibold tracking-tight text-charcoal">
          Proyek {project.code} dihapus (simulasi)
        </h1>
        <p className="text-sm text-muted-foreground">
          Proyek “{project.name}” sudah dihapus dari data demo. Perubahan ini hanya ada di memori tab ini dan proyek muncul
          kembali setelah halaman dimuat ulang.
        </p>
      </div>
      <Link href="/proyek" data-slot="back-link" className={BACK_LINK}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        Kembali ke daftar proyek
      </Link>
    </div>
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
  const readOnlyArchive = isProjectReadOnly(project);
  const [savedNotice, setSavedNotice] = React.useState<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  // Setelah pesan ditutup, tombolnya hilang: pindahkan fokus ke tab terpilih (titik baca berikutnya), bukan jatuh ke <body>.
  const focusSelectedTab = () =>
    requestAnimationFrame(() =>
      rootRef.current?.querySelector<HTMLElement>('[data-slot="tabs-tab"][aria-selected="true"]')?.focus(),
    );
  // Pesan "disimpan" dikosongkan dulu lalu diisi pada frame berikutnya, agar simpan kedua dengan teks sama tetap diumumkan.
  const announceSaved = () => {
    setSavedNotice(null);
    requestAnimationFrame(() => setSavedNotice("Perubahan proyek disimpan (simulasi)."));
  };
  // Aksi hanya untuk role berhak (access.ts); sebelum sesi diketahui tidak ada aksi.
  const showEdit = canEditProject(actor, project);
  const showDelete = canDeleteProject(actor, project);

  return (
    <div
      ref={rootRef}
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
            {showEdit ? (
              <ProjectFormDialog
                mode="edit"
                project={project}
                onSaved={announceSaved}
                trigger={
                  <Button variant="outline" size="touch" data-action="edit-project">
                    <Pencil aria-hidden="true" className="size-4" />
                    {/* Di bawah sm cukup "Ubah" agar aksi muat satu baris (isi tab tetap di layar pertama 375px); nama aksesibel tetap lengkap. */}
                    <span>
                      Ubah<span className="sr-only sm:not-sr-only"> proyek</span>
                    </span>
                  </Button>
                }
              />
            ) : null}
            {showDelete ? <ProjectDeleteDialog project={project} /> : null}
          </>
        }
      />

      <React.Suspense fallback={null}>
        <CreatedNotice project={project} onDismissed={focusSelectedTab} />
      </React.Suspense>
      {/* Pengumum selalu ada (sr-only, tidak memakan ruang); hanya isinya yang berubah, sehingga pembaca layar mengumumkan
          pesan. Banner visual di bawahnya sengaja tanpa role agar tidak diumumkan dua kali. */}
      <p role="status" data-slot="saved-notice-region" className="sr-only">
        {savedNotice ?? ""}
      </p>
      {savedNotice ? (
        <SuccessBanner
          data-slot="saved-notice"
          message={savedNotice}
          onDismiss={() => {
            setSavedNotice(null);
            focusSelectedTab();
          }}
        />
      ) : null}

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
              <ProjectTeamPanel project={project} actor={actor} data={data} showEmail={showEmail} />
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
  // Proyek yang pernah tampil lalu hilang dari store = baru dihapus di halaman ini (bukan ID tidak dikenal). Pola
  // "simpan nilai sebelumnya" resmi React: setState saat render pada komponen yang sama.
  const [lastSeen, setLastSeen] = React.useState<Project | null>(null);
  if (project && lastSeen !== project) setLastSeen(project);
  if (!project) {
    if (lastSeen) return <DeletedState project={lastSeen} />;
    notFound();
  }

  return (
    <AccessGuard allow={(actor, store) => canViewProject(actor, project, store)}>
      <ProjectDetailView project={project} />
    </AccessGuard>
  );
}

export { ProjectDetail };
