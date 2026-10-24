"use client";

// SPIKE U4-0 — UI minimal untuk membuktikan route dinamis. Bukan desain final U4 (diganti di U4-4/U4-5/U4-8/U4-9).
// Server hanya meneruskan id; pencarian data dilakukan di klien karena data runtime hanya ada di memori tab.
// Sejak U4-1 data dibaca dari `mock-store` (bukan store spike lagi).

import * as React from "react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockStore } from "@/lib/use-mock-store";

function SpikeNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Spike U4-0 (bukan desain final). Data demo di memori tab ini; hilang saat halaman dimuat ulang.
    </p>
  );
}

function ProjectProbe({ projectId }: { projectId: string }) {
  const project = useMockStore().projects.find((p) => p.id === projectId);
  if (!project) notFound();

  return (
    <Card data-spike="found" data-entity="project" data-id={project.id}>
      <CardHeader>
        <CardDescription>{project.code}</CardDescription>
        <CardTitle as="h1">{project.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Badge variant="neutral">{project.status}</Badge>
        <SpikeNote />
      </CardContent>
    </Card>
  );
}

function TaskProbe({ taskId }: { taskId: string }) {
  const task = useMockStore().tasks.find((t) => t.id === taskId);
  if (!task) notFound();

  return (
    <Card data-spike="found" data-entity="task" data-id={task.id}>
      <CardHeader>
        <CardDescription>{task.code}</CardDescription>
        <CardTitle as="h1">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Badge variant="neutral">{task.status}</Badge>
        <SpikeNote />
      </CardContent>
    </Card>
  );
}

export { ProjectProbe, TaskProbe };
