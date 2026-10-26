import * as React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = Omit<React.ComponentProps<typeof Card>, "children"> & {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  /** Keterangan kecil di bawah angka (mis. "dari 6 tugas"). */
  description?: string;
  /** `danger`: ikon dan angka bernada galat, untuk hitungan yang butuh perhatian (mis. tugas terlambat). */
  tone?: "default" | "danger";
};

/** Kartu ringkasan angka (dashboard). Display-only. */
function StatCard({ icon, label, value, description, tone = "default", className, ...props }: StatCardProps) {
  return (
    <Card data-slot="stat-card" className={cn("flex-row items-center gap-4 p-4", className)} {...props}>
      <div
        aria-hidden="true"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5",
          tone === "danger" ? "bg-danger-soft text-danger" : "bg-accent text-brand-text",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-semibold tabular-nums", tone === "danger" ? "text-danger" : "text-charcoal")}>
          {value}
        </p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
    </Card>
  );
}

export { StatCard };
export type { StatCardProps };
