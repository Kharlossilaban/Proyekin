"use client";

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent",
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
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Menampilkan spinner dan memblokir klik tanpa kehilangan fokus. */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  onClick,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (event) => event.preventDefault() : onClick}
      {...props}
    >
      {loading ? (
        <Loader2
          aria-hidden="true"
          className="animate-spin motion-reduce:animate-none"
        />
      ) : null}
      {children}
      {loading ? <span className="sr-only">Sedang memproses</span> : null}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
