import { cva } from "class-variance-authority";

/**
 * Gaya dasar bersama untuk kontrol formulir (Input, Select, Textarea).
 * Ukuran: `default` = ukuran U1 (tidak berubah). `touch` = alur mobile (Mandor/Anggota Tim): tinggi minimal 44px
 * dan font 16px (juga mencegah zoom otomatis iOS saat fokus).
 */
const CONTROL_BASE = [
  "w-full min-w-0 rounded-md border border-input bg-surface px-3 text-foreground",
  "placeholder:text-muted-foreground transition-colors",
  "hover:border-graphite",
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
  "read-only:bg-canvas",
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground",
  "aria-invalid:border-destructive aria-invalid:hover:border-destructive-hover",
];

/** Kontrol satu baris (Input, Select). */
export const controlVariants = cva(CONTROL_BASE, {
  variants: {
    size: {
      default: "h-10 text-sm",
      touch: "h-11 text-base",
    },
  },
  defaultVariants: { size: "default" },
});

/** Textarea: tinggi minimal, bukan tinggi tetap. */
export const textareaVariants = cva([...CONTROL_BASE, "block"], {
  variants: {
    size: {
      default: "min-h-20 py-2 text-sm",
      touch: "min-h-28 py-2.5 text-base",
    },
  },
  defaultVariants: { size: "default" },
});

export type ControlSize = "default" | "touch";
