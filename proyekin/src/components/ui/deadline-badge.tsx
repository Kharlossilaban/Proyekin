import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { DEMO_DATE_NOTICE, DEMO_REFERENCE_DATE, formatDemoDate, getDeadlineState } from "@/lib/demo-date";
import { DEADLINE_STATE_LABELS, DEADLINE_STATE_TONES } from "@/lib/labels";
import type { Task } from "@/types";

type DeadlineBadgeProps = Omit<React.ComponentProps<typeof Badge>, "variant" | "children"> & {
  task: Pick<Task, "status" | "dueDate">;
  /** Tanggal acuan (YYYY-MM-DD). Default: `DEMO_REFERENCE_DATE` (21 Maret 2026, BUKAN hari ini). */
  reference?: string;
  /** Tampilkan tanggal tenggat di samping label. */
  showDate?: boolean;
  /** Tampilkan juga untuk tugas selesai atau tanpa tenggat (default: tidak dirender). */
  showAll?: boolean;
};

/**
 * Lencana status tenggat. Status dihitung oleh `getDeadlineState` (demo-date.ts) dan label/nada berasal dari
 * `labels.ts`; komponen ini TIDAK menghitung ulang. Terhadap tanggal acuan demo, bukan tanggal hari ini:
 * halaman yang memakainya wajib menampilkan `<DemoDataNotice showDeadlineReference />`.
 */
function DeadlineBadge({ task, reference = DEMO_REFERENCE_DATE, showDate = false, showAll = false, ...props }: DeadlineBadgeProps) {
  const state = getDeadlineState(task, reference);
  if (!showAll && (state === "NONE" || state === "DONE")) return null;

  const due = showDate ? formatDemoDate(task.dueDate) : null;
  return (
    <Badge
      data-slot="deadline-badge"
      data-deadline-state={state}
      variant={DEADLINE_STATE_TONES[state]}
      dot
      // Tambahan saja (tidak diandalkan): penjelasan utama ada di DemoDataNotice pada halaman.
      title={DEMO_DATE_NOTICE}
      {...props}
    >
      {DEADLINE_STATE_LABELS[state]}
      {due ? <span className="font-normal"> · {due}</span> : null}
    </Badge>
  );
}

export { DeadlineBadge };
export type { DeadlineBadgeProps };
