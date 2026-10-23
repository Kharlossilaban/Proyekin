"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  retry?: () => void;
}

function ErrorState({
  title = "Terjadi kesalahan",
  description = "Tidak dapat memuat halaman. Silakan coba lagi.",
  retry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center px-4 py-16 text-center",
        className,
      )}
      {...props}
    >
      <div className="mb-4 text-danger">
        <AlertTriangle className="size-12" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {retry ? (
        <Button variant="outline" className="mt-4" onClick={retry}>
          Coba lagi
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorState };
export type { ErrorStateProps };
