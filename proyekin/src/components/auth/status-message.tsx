import * as React from "react";
import { AlertCircle, CheckCircle2, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "success" | "error" | "warning";

interface StatusMessageProps {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
}

const STYLES: Record<Variant, { box: string; Icon: typeof AlertCircle }> = {
  success: { box: "border-success/30 bg-success-soft text-success", Icon: CheckCircle2 },
  error: { box: "border-danger/30 bg-danger-soft text-danger", Icon: AlertCircle },
  warning: { box: "border-warning/30 bg-warning-soft text-warning", Icon: TriangleAlert },
};

/** Banner status: ikon + teks (tidak bergantung pada warna saja). */
function StatusMessage({ variant, children, className }: StatusMessageProps) {
  const { box, Icon } = STYLES[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-md border p-3 text-sm", box, className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export { StatusMessage };
