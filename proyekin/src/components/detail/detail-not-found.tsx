import Link from "next/link";
import { SearchX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

/**
 * State "tidak ditemukan" untuk route detail dinamis. Judulnya `h1` karena state ini menggantikan seluruh isi halaman
 * (tanpa `h1`, axe `page-has-heading-one` gagal). Teks tugas final ditentukan di U4-9.
 */
function DetailNotFound({ title, backHref, backLabel }: { title: string; backHref: string; backLabel: string }) {
  return (
    <div data-detail="not-found">
      <EmptyState
        icon={<SearchX aria-hidden="true" />}
        title={title}
        titleAs="h1"
        description="ID tidak dikenal, atau data demo yang dibuat selama sesi ini hilang karena halaman dimuat ulang."
        action={
          <Link href={backHref} className={cn(buttonVariants({ variant: "outline" }))}>
            {backLabel}
          </Link>
        }
      />
    </div>
  );
}

export { DetailNotFound };
