"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError, FieldHint, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TYPOGRAPHY } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/** Menampilkan nilai hex token dengan membaca CSS variable (tanpa menyalin nilai). */
export function HexLabel({ token }: { token: string }) {
  return (
    <code
      className="text-xs text-muted-foreground"
      ref={(el) => {
        if (el) {
          el.textContent = getComputedStyle(document.documentElement)
            .getPropertyValue(`--color-${token}`)
            .trim()
            .toUpperCase();
        }
      }}
    />
  );
}

const VARIANTS = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

/** State yang disimulasikan lewat class agar bisa dilihat/di-screenshot sekaligus. */
const FORCED: Record<string, Record<string, string>> = {
  hover: {
    primary: "bg-primary-hover",
    secondary: "bg-secondary-hover",
    outline: "bg-accent",
    ghost: "bg-muted",
    destructive: "bg-destructive-hover",
    link: "underline",
  },
  active: {
    primary: "bg-primary-active",
    secondary: "bg-secondary-hover",
    outline: "bg-brand-100",
    ghost: "bg-border",
    destructive: "bg-destructive-hover",
    link: "underline",
  },
  focus: {
    primary: "outline-2 outline-offset-2 outline-ring",
    secondary: "outline-2 outline-offset-2 outline-ring",
    outline: "outline-2 outline-offset-2 outline-ring",
    ghost: "outline-2 outline-offset-2 outline-ring",
    destructive: "outline-2 outline-offset-2 outline-ring",
    link: "outline-2 outline-offset-2 outline-ring",
  },
};

export function ButtonMatrix() {
  const [saving, setSaving] = React.useState(false);

  function simulateSave() {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 1800);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Matriks state tombol">
        <table className="w-full min-w-[44rem] text-sm">
          <caption className="sr-only">
            Varian tombol dan state-nya. Hover, active, dan focus disimulasikan.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="py-2 pr-4 text-left text-xs font-semibold text-muted-foreground uppercase">
                Varian
              </th>
              {["Default", "Hover*", "Active*", "Focus*", "Disabled", "Loading"].map((s) => (
                <th key={s} scope="col" className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map((variant) => (
              <tr key={variant} className="border-t border-border">
                <th scope="row" className="py-3 pr-4 text-left font-medium text-foreground">
                  {variant}
                </th>
                <td className="px-2 py-3">
                  <Button variant={variant}>Simpan</Button>
                </td>
                {(["hover", "active", "focus"] as const).map((state) => (
                  <td key={state} className="px-2 py-3">
                    <Button variant={variant} className={FORCED[state][variant]} tabIndex={-1}>
                      Simpan
                    </Button>
                  </td>
                ))}
                <td className="px-2 py-3">
                  <Button variant={variant} disabled>
                    Simpan
                  </Button>
                </td>
                <td className="px-2 py-3">
                  <Button variant={variant} loading>
                    Simpan
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={TYPOGRAPHY.caption}>
        * State hover, active, dan focus disimulasikan lewat class. Coba
        langsung dengan mouse dan Tab pada tombol Default.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <span className={TYPOGRAPHY.label}>Ukuran:</span>
        <Button size="sm">Kecil</Button>
        <Button size="md">Sedang</Button>
        <Button size="lg">Besar</Button>
        <Button size="icon" variant="outline" aria-label="Contoh tombol ikon">
          <span aria-hidden="true">+</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className={TYPOGRAPHY.label}>Interaktif:</span>
        <Button loading={saving} onClick={simulateSave}>
          {saving ? "Menyimpan" : "Simpan contoh"}
        </Button>
      </div>
    </div>
  );
}

export function FormStates() {
  const [value, setValue] = React.useState("");
  const invalid = value.length > 0 && value.length < 3;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FieldBlock id="f-default" label="Default" hint="Teks bantuan opsional.">
        {(p) => <Input {...p} placeholder="Placeholder contoh" />}
      </FieldBlock>
      <FieldBlock id="f-hover" label="Hover (simulasi)">
        {(p) => <Input {...p} className="border-graphite" defaultValue="Nilai contoh" />}
      </FieldBlock>
      <FieldBlock id="f-focus" label="Focus (simulasi)">
        {(p) => (
          <Input {...p} className="outline-2 outline-ring" defaultValue="Nilai contoh" />
        )}
      </FieldBlock>
      <FieldBlock id="f-disabled" label="Disabled">
        {(p) => <Input {...p} disabled defaultValue="Tidak dapat diubah" />}
      </FieldBlock>
      <FieldBlock id="f-readonly" label="Read-only">
        {(p) => <Input {...p} readOnly defaultValue="Hanya dibaca" />}
      </FieldBlock>
      <FieldBlock
        id="f-error"
        label="Error"
        required
        error="Kolom ini wajib diisi dengan format yang benar."
      >
        {(p) => <Input {...p} defaultValue="x" />}
      </FieldBlock>
      <FieldBlock
        id="f-live"
        label="Validasi langsung"
        hint="Ketik minimal 3 karakter."
        error={invalid ? "Minimal 3 karakter." : undefined}
        required
      >
        {(p) => (
          <Input
            {...p}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Coba ketik 1–2 karakter"
          />
        )}
      </FieldBlock>
    </div>
  );
}

type ControlProps = {
  id: string;
  "aria-describedby"?: string;
  invalid?: boolean;
  required?: boolean;
};

function FieldBlock({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: ControlProps) => React.ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({
        id,
        "aria-describedby": describedBy,
        invalid: Boolean(error),
        required,
      })}
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

export function DialogDemos() {
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  function confirm() {
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setOpen(false);
    }, 1500);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>
          Dialog informasi
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Judul dialog contoh</DialogTitle>
            <DialogDescription>
              Dialog ini menjebak fokus, dapat ditutup dengan tombol Esc, dan
              mengembalikan fokus ke tombol pemicu.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dlg-name">Nama</Label>
            <Input id="dlg-name" placeholder="Isi contoh" />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Batal</DialogClose>
            <DialogClose render={<Button />}>Simpan</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogTrigger render={<Button variant="destructive" />}>
          Dialog konfirmasi destruktif
        </DialogTrigger>
        <DialogContent showClose={!busy}>
          <DialogHeader>
            <DialogTitle>Hapus item contoh?</DialogTitle>
            <DialogDescription>
              Ini hanya contoh tampilan. Tindakan destruktif sebaiknya
              menjelaskan dampaknya dengan jelas sebelum dikonfirmasi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" disabled={busy} />}>
              Batal
            </DialogClose>
            <Button variant="destructive" loading={busy} onClick={confirm}>
              Ya, hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const WIDTHS = [
  { label: "Mobile 375", value: 375 },
  { label: "Tablet 768", value: 768 },
  { label: "Desktop 1024", value: 1024 },
] as const;

export function ResponsivePreview() {
  const [width, setWidth] = React.useState<number>(375);

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Lebar pratinjau" className="flex flex-wrap gap-2">
        {WIDTHS.map((w) => (
          <Button
            key={w.value}
            size="sm"
            variant={width === w.value ? "secondary" : "outline"}
            aria-pressed={width === w.value}
            onClick={() => setWidth(w.value)}
          >
            {w.label}
          </Button>
        ))}
      </div>
      <p className={TYPOGRAPHY.caption}>
        Pratinjau memakai container query, jadi layout bereaksi pada lebar
        kotak ini. Pengujian viewport asli dilakukan terpisah di browser.
      </p>
      <div className="overflow-x-auto rounded-lg border border-dashed border-input bg-canvas p-4">
        <div
          className="@container mx-auto bg-canvas"
          style={{ width, maxWidth: "100%" }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 @md:flex-row @md:items-center @md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Ringkasan contoh</h3>
                <p className="text-sm text-muted-foreground">Konten netral untuk uji layout.</p>
              </div>
              <Button className="@md:w-auto">Aksi utama</Button>
            </div>
            <div className="grid gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
              {["Item A", "Item B", "Item C"].map((name, i) => (
                <Card key={name}>
                  <CardHeader>
                    <CardTitle>{name}</CardTitle>
                    <CardDescription>Deskripsi singkat contoh</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <span className="font-mono tabular-nums">{(i + 1) * 12}%</span>
                    <Badge variant={i === 0 ? "success" : i === 1 ? "warning" : "neutral"} dot>
                      {i === 0 ? "Contoh baik" : i === 1 ? "Perlu cek" : "Netral"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Table label="Tabel contoh responsif">
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead align="right">Nilai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {["Contoh satu", "Contoh dua", "Contoh tiga"].map((n, i) => (
                  <TableRow key={n}>
                    <TableCell className="whitespace-nowrap font-medium text-foreground">{n}</TableCell>
                    <TableCell className="whitespace-nowrap">Kategori {i + 1}</TableCell>
                    <TableCell align="right">{(i + 1) * 1250}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <CardFooter className={cn("justify-end")}>
              <Button variant="ghost">Batal</Button>
              <Button>Simpan</Button>
            </CardFooter>
          </div>
        </div>
      </div>
    </div>
  );
}
