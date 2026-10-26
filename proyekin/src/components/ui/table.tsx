import * as React from "react";

import { cn } from "@/lib/utils";

type TableProps = React.ComponentProps<"table"> & {
  /** Nama area tabel untuk pembaca layar; wrapper scroll dapat difokus keyboard. */
  label: string;
};

function Table({ className, label, ...props }: TableProps) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-lg border border-border bg-card"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        "border-t border-border px-4 py-3 text-left text-xs text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableRow({
  className,
  selected,
  ...props
}: React.ComponentProps<"tr"> & { selected?: boolean }) {
  return (
    <tr
      data-slot="table-row"
      data-state={selected ? "selected" : undefined}
      aria-selected={selected || undefined}
      className={cn(
        "border-b border-border transition-colors hover:bg-canvas",
        "data-[state=selected]:bg-accent",
        className,
      )}
      {...props}
    />
  );
}

type CellAlign = "left" | "right";

function TableHead({
  className,
  align = "left",
  ...props
}: React.ComponentProps<"th"> & { align?: CellAlign }) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn(
        "h-11 px-4 text-xs font-semibold tracking-wide whitespace-nowrap text-foreground uppercase",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  align = "left",
  ...props
}: React.ComponentProps<"td"> & { align?: CellAlign }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3 align-middle text-graphite",
        align === "right" ? "text-right tabular-nums" : "text-left",
        className,
      )}
      {...props}
    />
  );
}

/** Baris pengganti bila tidak ada data. */
function TableEmpty({
  colSpan,
  title,
  description,
}: {
  colSpan: number;
  title: string;
  description?: string;
}) {
  return (
    <tr data-slot="table-empty">
      <td colSpan={colSpan} className="px-4 py-10 text-center">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </td>
    </tr>
  );
}

export {
  Table,
  TableCaption,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
};
