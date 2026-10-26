import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressBarProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Nilai 0–100 (dibulatkan dan dibatasi). Hanya ditampilkan; komponen ini tidak menghitung apa pun. */
  value: number;
  /** Nama yang dibacakan pembaca layar, mis. "Progres proyek PRJ-001". */
  label: string;
  /** Tampilkan angka persen di samping bar. Default: true (status tidak hanya bergantung pada warna). */
  showValue?: boolean;
};

/** Bar progres DISPLAY-ONLY (tidak interaktif, tidak mengubah data). */
function ProgressBar({ value, label, showValue = true, className, ...props }: ProgressBarProps) {
  const clamped = Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;

  return (
    <div data-slot="progress-bar" className={cn("flex items-center gap-2", className)} {...props}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-valuetext={`${clamped}%`}
        className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-brand-700" style={{ width: `${clamped}%` }} />
      </div>
      {showValue ? (
        <span aria-hidden="true" className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {clamped}%
        </span>
      ) : null}
    </div>
  );
}

export { ProgressBar };
export type { ProgressBarProps };
