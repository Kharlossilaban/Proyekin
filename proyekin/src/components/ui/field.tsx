import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

function Label({
  className,
  required,
  children,
  ...props
}: React.ComponentProps<"label"> & { required?: boolean }) {
  return (
    <label
      data-slot="label"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="ml-0.5 text-destructive">
          *
        </span>
      ) : null}
    </label>
  );
}

function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-hint"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Pesan galat: ikon + teks (tidak bergantung pada warna saja). */
function FieldError({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-error"
      aria-live="polite"
      className={cn(
        "flex items-start gap-1.5 text-sm text-destructive",
        className,
      )}
      {...props}
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export { Label, FieldHint, FieldError };
