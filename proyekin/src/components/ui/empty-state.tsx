import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.ComponentProps<"div"> {
  icon?: React.ReactNode;
  title: string;
  /** Tingkat judul. Default `h3` (di bawah `h2` bagian halaman); pakai `h1` bila state ini menggantikan seluruh halaman (mis. not-found). */
  titleAs?: "h1" | "h2" | "h3";
  description?: string;
  action?: React.ReactNode;
}

function EmptyState({
  icon,
  title,
  titleAs: Title = "h3",
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center px-4 py-16 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 text-muted-foreground [&_svg]:size-12">{icon}</div>
      ) : null}
      <Title className="text-base font-semibold text-foreground">{title}</Title>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
