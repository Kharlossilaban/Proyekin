"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
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

type ConfirmDialogProps = {
  /** Elemen pemicu (dirender oleh DialogTrigger), mis. `<Button variant="destructive">Hapus contoh</Button>`. Fokus kembali ke sini saat dialog ditutup. */
  trigger?: React.ReactElement;
  title: string;
  /** Jelaskan dampak aksi dengan jelas, terutama untuk aksi destruktif. */
  description: React.ReactNode;
  /** Teks tombol konfirmasi yang menyebut aksinya, mis. "Ya, hapus contoh" (bukan "OK"/"Ya"). */
  confirmLabel: string;
  cancelLabel?: string;
  /** Aksi destruktif: tombol konfirmasi merah dan fokus awal di "Batal". Default: true. */
  destructive?: boolean;
  /** Dipanggil saat dikonfirmasi. Dialog menampilkan loading selama promise berjalan dan tertutup bila berhasil. */
  onConfirm: () => void | Promise<void>;
  /** Mode terkendali (opsional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Rincian tambahan di bawah deskripsi (mis. daftar dampak). */
  children?: React.ReactNode;
};

/**
 * Dialog konfirmasi di atas primitive Dialog (focus trap, Esc, dan pengembalian fokus ke pemicu ditangani Base UI).
 * Komponen ini TIDAK menghapus atau mengubah data; aksi ditentukan sepenuhnya oleh `onConfirm`.
 * Selama `onConfirm` berjalan: tombol dikunci, Esc/klik luar/Batal/X tidak menutup dialog.
 */
function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Batal",
  destructive = true,
  onConfirm,
  open: openProp,
  onOpenChange,
  children,
}: ConfirmDialogProps) {
  const [openState, setOpenState] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const open = openProp ?? openState;

  const applyOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };

  const handleOpenChange = (next: boolean) => {
    if (busy) return;
    setFailed(false);
    applyOpen(next);
  };

  async function handleConfirm() {
    setBusy(true);
    setFailed(false);
    try {
      await onConfirm();
      setBusy(false);
      applyOpen(false);
    } catch {
      setBusy(false);
      setFailed(true);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent showClose={!busy} initialFocus={destructive ? cancelRef : true}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        {failed ? (
          <p role="alert" className="text-sm text-destructive">
            Aksi gagal diproses. Coba lagi.
          </p>
        ) : null}
        <DialogFooter className="[&>button]:w-full sm:[&>button]:w-auto">
          <DialogClose render={<Button ref={cancelRef} variant="outline" size="touch" disabled={busy} />}>
            {cancelLabel}
          </DialogClose>
          <Button variant={destructive ? "destructive" : "primary"} size="touch" loading={busy} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDialog };
export type { ConfirmDialogProps };
