import * as React from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = Omit<React.ComponentProps<"header">, "title"> & {
  title: string;
  description?: React.ReactNode;
  /** Teks kecil di atas judul, mis. kode proyek. */
  eyebrow?: React.ReactNode;
  /** Aksi halaman (tombol). Di mobile tampil di bawah judul; di layar lebar sejajar di kanan. */
  actions?: React.ReactNode;
  /** Tingkat judul. Default `h1` (satu per halaman); pakai `h2`/`h3` untuk header di dalam panel, tab, atau bagian. */
  as?: "h1" | "h2" | "h3";
};

/** Judul halaman responsif: bertumpuk di mobile, sejajar di desktop. */
function PageHeader({ title, description, eyebrow, actions, as: Heading = "h1", className, ...props }: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn("flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p> : null}
        <Heading className="text-2xl font-semibold tracking-tight text-charcoal">{title}</Heading>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">{actions}</div> : null}
    </header>
  );
}

export { PageHeader };
export type { PageHeaderProps };
