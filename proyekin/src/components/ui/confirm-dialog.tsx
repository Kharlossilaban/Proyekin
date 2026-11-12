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
  /**
   * Pesan galat bila `onConfirm` gagal (U4-7). Teks tetap, atau fungsi yang menerima galat yang dilempar `onConfirm` sehingga
   * pemanggil dapat menampilkan sebab yang spesifik. Tanpa prop ini (atau bila fungsi mengembalikan teks kosong) dipakai
   * pesan bawaan "Aksi gagal diproses. Coba lagi." — perilaku pemanggil lama tidak berubah.
   */
  errorMessage?: string | ((error: unknown) => string);
};

/** Pesan galat bawaan ConfirmDialog (dipertahankan untuk semua pemanggil yang tidak memberi `errorMessage`). */
export const CONFIRM_DIALOG_DEFAULT_ERROR = "Aksi gagal diproses. Coba lagi.";

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
  errorMessage,
}: ConfirmDialogProps) {
  const [openState, setOpenState] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  // Penjaga kirim ganda: state `busy` baru terlihat setelah render, sehingga dua klik dalam satu tick bisa lolos.
  const busyRef = React.useRef(false);
  const open = openProp ?? openState;

  const applyOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };

  const handleOpenChange = (next: boolean) => {
    if (busyRef.current) return;
    setFailure(null);
    applyOpen(next);
  };

  const describeFailure = (error: unknown): string => {
    const text = typeof errorMessage === "function" ? errorMessage(error) : errorMessage;
    return text || CONFIRM_DIALOG_DEFAULT_ERROR;
  };

  async function handleConfirm() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFailure(null);
    try {
      await onConfirm();
      busyRef.current = false;
      setBusy(false);
      applyOpen(false);
    } catch (error) {
      busyRef.current = false;
      setBusy(false);
      setFailure(describeFailure(error));
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
        {failure ? (
          <p role="alert" data-slot="confirm-dialog-error" className="text-sm text-destructive">
            {failure}
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
