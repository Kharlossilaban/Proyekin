import * as React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RecordField = {
  /** Label field; samakan dengan header kolom tabel pasangannya agar istilah konsisten. */
  label: string;
  /** Nilai field (teks atau Badge). Nilai panjang (mis. email) otomatis dipecah baris. */
  value: React.ReactNode;
};

type RecordCardProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Judul kartu (mis. tanggal laporan, nama dokumen, nama anggota). */
  title: string;
  /** Tingkat judul; sesuaikan dengan hierarki halaman. Default `h3` (di bawah `h2` bagian daftar). */
  titleAs?: "h2" | "h3" | "h4";
  /** Teks kecil di atas judul (opsional), mis. kode. */
  eyebrow?: React.ReactNode;
  /** Penanda dekoratif di sisi kiri judul (mis. avatar inisial). Jangan memuat teks yang bermakna. */
  leading?: React.ReactNode;
  /** Seluruh kolom tabel pasangannya, selain yang menjadi judul. */
  fields: readonly RecordField[];
};

/**
 * Kartu data PRESENTASI SAJA untuk daftar responsif di bawah `lg` (satu kolom di 375px, dua kolom di 768px).
 * Pasangan tabel di `lg` ke atas. Tidak interaktif: tanpa tautan, aksi, atau efek hover, karena halaman yang memakainya
 * belum memiliki halaman detail. Bila nanti perlu tautan, pakai pola `TaskCard`/kartu proyek (tautan teregang), jangan
 * menambah aksi di komponen ini. Label dan nilai memakai `<dl>` semantik agar pembaca layar membacanya berpasangan.
 */
function RecordCard({ title, titleAs: Title = "h3", eyebrow, leading, fields, className, ...props }: RecordCardProps) {
  return (
    <Card data-slot="record-card" className={cn("gap-3 p-4", className)} {...props}>
      <div className="flex items-start gap-3">
        {leading}
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow ? <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p> : null}
          <Title className="text-base font-semibold break-words text-foreground">{title}</Title>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
        {fields.map((field) => (
          <React.Fragment key={field.label}>
            <dt className="text-muted-foreground">{field.label}</dt>
            <dd className="min-w-0 break-words text-foreground">{field.value}</dd>
          </React.Fragment>
        ))}
      </dl>
    </Card>
  );
}

type RecordCardListProps = React.ComponentProps<"ul"> & {
  /** Nama daftar untuk pembaca layar, mis. "Daftar laporan harian". */
  label: string;
};

/**
 * Daftar `RecordCard`: satu kolom, dua kolom mulai `md`, dan DISEMBUNYIKAN mulai `lg` (di sana tabel yang tampil).
 * Di luar pola itu (mis. contoh di style guide), timpa dengan `className="lg:grid"`.
 */
function RecordCardList({ label, className, children, ...props }: RecordCardListProps) {
  return (
    <ul
      role="list"
      aria-label={label}
      data-slot="record-card-list"
      className={cn("grid list-none gap-4 p-0 md:grid-cols-2 lg:hidden", className)}
      {...props}
    >
      {React.Children.map(children, (child) => (child ? <li className="min-w-0">{child}</li> : null))}
    </ul>
  );
}

export { RecordCard, RecordCardList };
export type { RecordCardProps, RecordCardListProps, RecordField };
