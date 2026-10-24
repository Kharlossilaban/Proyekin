import * as React from "react";
import { Info } from "lucide-react";

import { DEMO_DATE_NOTICE } from "@/lib/demo-date";
import { cn } from "@/lib/utils";

/** Teks penjelasan perubahan mock (keputusan J9). Tidak mengklaim data tersimpan ke server. */
export const DEMO_MEMORY_NOTICE =
  "Perubahan yang Anda buat hanya disimpan sementara di memori tab ini dan hilang saat halaman dimuat ulang. Tidak ada data yang dikirim atau disimpan ke server.";

type DemoDataNoticeProps = React.ComponentProps<"div"> & {
  /** Tambahkan penjelasan bahwa status tenggat memakai tanggal acuan demo (21 Maret 2026), bukan hari ini. */
  showDeadlineReference?: boolean;
};

/** Catatan netral untuk halaman yang memakai data mock di memori. */
function DemoDataNotice({ showDeadlineReference = false, className, ...props }: DemoDataNoticeProps) {
  return (
    <div
      data-slot="demo-data-notice"
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-md border border-info/30 bg-info-soft p-3 text-sm text-foreground",
        className,
      )}
      {...props}
    >
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
      <div className="flex min-w-0 flex-col gap-1">
        <p>
          <strong className="font-semibold">Data demo.</strong> {DEMO_MEMORY_NOTICE}
        </p>
        {showDeadlineReference ? <p data-slot="deadline-reference">{DEMO_DATE_NOTICE}</p> : null}
      </div>
    </div>
  );
}

export { DemoDataNotice };
export type { DemoDataNoticeProps };
