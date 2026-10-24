"use client";

// Isi SEMENTARA untuk route detail dinamis: dipakai sampai halaman detail sebenarnya (U4-5 proyek, U4-9 tugas).
// Bukan desain final dan tanpa aksi bisnis. Yang permanen di sini adalah polanya (dibuktikan di U4-0, docs/u4-evidence/U4-0-SPIKE.md):
// server hanya meneruskan id; pencarian data di klien karena ID runtime hanya ada di memori tab; ID tidak ada → notFound();
// ID ada tetapi di luar lingkup pengguna → AccessGuard (aturan dari access.ts) mengalihkan ke /akses-ditolak.
// Guard ini representasi UI, BUKAN otorisasi; lihat access-guard.tsx untuk keterbatasan prerender/HTML.

import * as React from "react";
import { notFound } from "next/navigation";

import { AccessGuard } from "@/components/auth/access-guard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canViewProject, canViewTask } from "@/lib/access";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES, TASK_STATUS_LABELS, TASK_STATUS_TONES } from "@/lib/labels";
import { useMockStore } from "@/lib/use-mock-store";

function PlaceholderNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Tampilan sementara (bukan desain final). Data demo di memori tab ini; hilang saat halaman dimuat ulang.
    </p>
  );
}

function ProjectDetailPlaceholder({ projectId }: { projectId: string }) {
  const data = useMockStore();
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) notFound();

  return (
    <AccessGuard allow={(actor, store) => canViewProject(actor, project, store)}>
      <Card data-detail="found" data-entity="project" data-id={project.id}>
        <CardHeader>
          <CardDescription>{project.code}</CardDescription>
          <CardTitle as="h1">{project.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Badge variant={PROJECT_STATUS_TONES[project.status]} dot>
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
          <PlaceholderNote />
        </CardContent>
      </Card>
    </AccessGuard>
  );
}

function TaskDetailPlaceholder({ taskId }: { taskId: string }) {
  const data = useMockStore();
  const task = data.tasks.find((t) => t.id === taskId);
  if (!task) notFound();

  return (
    <AccessGuard allow={(actor, store) => canViewTask(actor, task, store)}>
      <Card data-detail="found" data-entity="task" data-id={task.id}>
        <CardHeader>
          <CardDescription>{task.code}</CardDescription>
          <CardTitle as="h1">{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Badge variant={TASK_STATUS_TONES[task.status]} dot>
            {TASK_STATUS_LABELS[task.status]}
          </Badge>
          <PlaceholderNote />
        </CardContent>
      </Card>
    </AccessGuard>
  );
}

export { ProjectDetailPlaceholder, TaskDetailPlaceholder };
