import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DeadlineBadge } from "@/components/ui/deadline-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_TONES, TASK_STATUS_LABELS, TASK_STATUS_TONES } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

type TaskCardProps = {
  task: Task;
  /** Teks proyek (mis. "PRJ-001 · Renovasi Gedung Kantor Batam"). Diberikan pemanggil; kartu tidak mencari data. */
  projectLabel?: string;
  /** Nama penanggung jawab. Diberikan pemanggil (U4-8 mengambilnya dari User). */
  assigneeName?: string;
  /** Bila ada, seluruh kartu menjadi satu target tautan (area sentuh penuh). */
  href?: string;
  /** Tingkat judul kartu; sesuaikan dengan hierarki halaman. Default `h3`. */
  titleAs?: "h2" | "h3" | "h4";
  className?: string;
};

/**
 * Kartu tugas satu kolom untuk mobile (Mandor/Anggota Tim). Presentasi saja: tidak ada aksi ubah/hapus/penugasan.
 * Status memakai label + titik (tidak hanya warna); tenggat memakai `DeadlineBadge` (acuan demo, bukan hari ini).
 */
function TaskCard({ task, projectLabel, assigneeName, href, titleAs: Title = "h3", className }: TaskCardProps) {
  return (
    <Card
      data-slot="task-card"
      data-task-id={task.id}
      interactive={!!href}
      className={cn("relative gap-3 p-4", className)}
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{task.code}</p>
        <Title className="text-base font-semibold text-foreground">
          {href ? (
            <Link
              href={href}
              className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {task.title}
            </Link>
          ) : (
            task.title
          )}
        </Title>
        {projectLabel ? <p className="text-sm text-muted-foreground">{projectLabel}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={TASK_STATUS_TONES[task.status]} dot>
          {TASK_STATUS_LABELS[task.status]}
        </Badge>
        <Badge variant={TASK_PRIORITY_TONES[task.priority]}>Prioritas {TASK_PRIORITY_LABELS[task.priority]}</Badge>
        <DeadlineBadge task={task} showDate />
      </div>

      <ProgressBar value={task.progress} label={`Progres ${task.code}`} />

      {assigneeName ? <p className="text-sm text-graphite">Penanggung jawab: {assigneeName}</p> : null}
    </Card>
  );
}

export { TaskCard };
export type { TaskCardProps };
