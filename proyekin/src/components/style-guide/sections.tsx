import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TYPOGRAPHY } from "@/lib/tokens";

import { HexLabel } from "./interactive";

export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="min-w-0 scroll-mt-24 border-t border-border pt-10">
      <h2 id={`${id}-title`} className={TYPOGRAPHY.h2}>
        {title}
      </h2>
      {description ? <p className={`${TYPOGRAPHY.body} mt-2 max-w-2xl`}>{description}</p> : null}
      <div className="mt-6 min-w-0">{children}</div>
    </section>
  );
}

function Swatch({ token, note }: { token: string; note?: string }) {
  return (
    <li className="flex flex-col gap-2">
      <div
        aria-hidden="true"
        className="h-14 rounded-md border border-border"
        style={{ backgroundColor: `var(--color-${token})` }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{token}</span>
        <HexLabel token={token} />
        {note ? <span className={TYPOGRAPHY.caption}>{note}</span> : null}
      </div>
    </li>
  );
}

function SwatchGroup({ title, tokens }: { title: string; tokens: [string, string?][] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className={TYPOGRAPHY.h4}>{title}</h3>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tokens.map(([token, note]) => (
          <Swatch key={token} token={token} note={note} />
        ))}
      </ul>
    </div>
  );
}

export function ColorSection() {
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  return (
    <div className="flex flex-col gap-8">
      <SwatchGroup
        title="Brand — Orange (500 = Primary)"
        tokens={shades.map((s) => [`brand-${s}`, s === 500 ? "Primary Orange" : s === 800 ? "Teks/tautan oranye" : undefined])}
      />
      <SwatchGroup
        title="Netral brand"
        tokens={[
          ["charcoal", "Secondary Charcoal"],
          ["graphite", "Supporting Gray"],
          ["canvas", "Background"],
          ["highlight", "Warm Highlight"],
          ["surface", "Permukaan"],
          ["muted", "Latar lembut"],
          ["muted-foreground", "Teks pendukung"],
          ["border", "Pemisah"],
          ["input", "Border kontrol"],
        ]}
      />
      <SwatchGroup
        title="Semantic"
        tokens={[
          ["success", "Hijau hanya untuk semantic"],
          ["warning"],
          ["danger"],
          ["info"],
          ["success-soft"],
          ["warning-soft"],
          ["danger-soft"],
          ["info-soft"],
        ]}
      />
      <p className={TYPOGRAPHY.caption}>
        Kontras diverifikasi dengan <code className="font-mono">npm run check:contrast</code>.
        Oranye <code className="font-mono">brand-500</code> hanya sebagai latar (teks charcoal), bukan sebagai teks,
        ikon, atau border tunggal di latar terang.
      </p>
    </div>
  );
}

export function TypographySection() {
  const rows: [string, string, string][] = [
    ["display", TYPOGRAPHY.display, "Display — Kelola proyek"],
    ["h1", TYPOGRAPHY.h1, "Heading 1 — Ringkasan proyek"],
    ["h2", TYPOGRAPHY.h2, "Heading 2 — Daftar tugas"],
    ["h3", TYPOGRAPHY.h3, "Heading 3 — Detail laporan"],
    ["h4", TYPOGRAPHY.h4, "Heading 4 — Catatan lapangan"],
    ["body", TYPOGRAPHY.body, "Body — Teks paragraf standar untuk penjelasan dan konten utama yang nyaman dibaca."],
    ["bodySm", TYPOGRAPHY.bodySm, "Body kecil — Teks sekunder pada kartu dan tabel."],
    ["label", TYPOGRAPHY.label, "Label — Nama kolom isian"],
    ["caption", TYPOGRAPHY.caption, "Caption — Keterangan tambahan atau waktu pembaruan"],
    ["overline", TYPOGRAPHY.overline, "Overline — Kategori"],
    ["link", TYPOGRAPHY.link, "Tautan contoh"],
    ["numeric", TYPOGRAPHY.numeric, "Rp 1.250.000 — 0123456789"],
  ];
  return (
    <div className="flex flex-col gap-6">
      <p className={TYPOGRAPHY.body}>
        Font utama: <strong className="font-semibold text-foreground">Geist Sans</strong>; angka dan kode memakai{" "}
        <span className="font-mono">Geist Mono</span>.
      </p>
      <dl className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {rows.map(([name, cls, sample]) => (
          <div key={name} className="grid gap-1 p-4 md:grid-cols-[8rem_1fr] md:items-baseline md:gap-6">
            <dt className={TYPOGRAPHY.caption}>{name}</dt>
            <dd className={cls}>{sample}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function BadgeSection() {
  const variants = ["neutral", "brand", "success", "warning", "danger", "info"] as const;
  const labels = { neutral: "Netral", brand: "Brand", success: "Berhasil", warning: "Perlu cek", danger: "Gagal", info: "Info" };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {variants.map((v) => (
          <Badge key={v} variant={v}>
            {labels[v]}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {variants.map((v) => (
          <Badge key={v} variant={v} dot>
            {labels[v]}
          </Badge>
        ))}
      </div>
      <p className={TYPOGRAPHY.caption}>
        Badge selalu memuat teks (dan titik opsional) sehingga makna tidak bergantung pada warna saja. Label di atas
        hanya contoh tampilan, bukan label status bisnis.
      </p>
    </div>
  );
}

export function CardSection() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Card standar</CardTitle>
          <CardDescription>Deskripsi singkat contoh.</CardDescription>
        </CardHeader>
        <CardContent>Isi card berupa teks netral untuk menguji spacing dan hierarki.</CardContent>
        <CardFooter>
          <Button size="sm">Aksi</Button>
          <Button size="sm" variant="ghost">
            Batal
          </Button>
        </CardFooter>
      </Card>
      <Card interactive>
        <CardHeader>
          <CardTitle>Card interaktif</CardTitle>
          <CardDescription>Berubah saat hover atau fokus di dalamnya.</CardDescription>
        </CardHeader>
        <CardContent>
          <a href="#kartu" className={TYPOGRAPHY.link}>
            Tautan di dalam card
          </a>
        </CardContent>
      </Card>
      <Card className="bg-accent">
        <CardHeader>
          <CardTitle>Card highlight</CardTitle>
          <CardDescription className="text-graphite">Memakai Warm Highlight.</CardDescription>
        </CardHeader>
        <CardContent>Gunakan hemat untuk informasi yang perlu perhatian lembut.</CardContent>
      </Card>
    </div>
  );
}

export function TableSection() {
  const rows = [
    ["Contoh satu", "Kategori A", "Berjalan", 1250],
    ["Contoh dua", "Kategori B", "Perlu cek", 840],
    ["Contoh tiga", "Kategori A", "Selesai", 12600],
  ] as const;
  const variant = { Berjalan: "info", "Perlu cek": "warning", Selesai: "success" } as const;
  return (
    <div className="flex flex-col gap-6">
      <Table label="Tabel contoh dengan data">
        <TableCaption>Contoh tabel dengan baris terpilih dan angka rata kanan.</TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nama</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="right">Jumlah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([name, cat, status, amount], i) => (
            <TableRow key={name} selected={i === 1}>
              <TableCell className="font-medium text-foreground">{name}</TableCell>
              <TableCell>{cat}</TableCell>
              <TableCell>
                <Badge variant={variant[status]} dot>
                  {status}
                </Badge>
              </TableCell>
              <TableCell align="right">{amount.toLocaleString("id-ID")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Table label="Tabel contoh kosong">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nama</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead align="right">Jumlah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty colSpan={3} title="Belum ada data" description="Data yang ditambahkan akan tampil di sini." />
        </TableBody>
      </Table>
    </div>
  );
}
