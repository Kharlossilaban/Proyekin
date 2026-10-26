import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent",
    "text-sm font-medium whitespace-nowrap select-none transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Disabled: warna eksplisit (bukan opacity) agar teks tetap terbaca.
    "data-disabled:pointer-events-none data-disabled:cursor-not-allowed",
    "data-disabled:border-border data-disabled:bg-muted data-disabled:text-muted-foreground",
    // Loading: tampilan tetap normal, interaksi diblokir.
    "aria-busy:cursor-progress",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        outline:
          "border-input bg-surface text-foreground hover:bg-accent active:bg-brand-100",
        ghost: "text-foreground hover:bg-muted active:bg-border",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        link: "h-auto rounded-sm px-0 text-brand-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
        // Alur mobile (Mandor/Anggota Tim): target sentuh minimal 44x44px. Ukuran lain tidak berubah.
        touch: "min-h-11 min-w-11 px-4 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
