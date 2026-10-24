import Link from "next/link";
import { SearchX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

// SPIKE U4-0 — state not-found minimal untuk route dinamis; teks final ditentukan di U4-4/U4-8.
function SpikeNotFound({ title, backHref, backLabel }: { title: string; backHref: string; backLabel: string }) {
  return (
    <div data-spike="not-found">
      <EmptyState
        icon={<SearchX aria-hidden="true" />}
        title={title}
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

export { SpikeNotFound };
