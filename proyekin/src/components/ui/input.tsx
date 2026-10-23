"use client";

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

type InputProps = InputPrimitive.Props & {
  /** Tandai kontrol sebagai tidak valid (aria-invalid + gaya galat). */
  invalid?: boolean;
};

function Input({ className, invalid, type = "text", ...props }: InputProps) {
  return (
    <InputPrimitive
      data-slot="input"
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-sm text-foreground",
        "placeholder:text-muted-foreground transition-colors",
        "hover:border-graphite",
        "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
        "read-only:bg-canvas",
        "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground",
        "aria-invalid:border-destructive aria-invalid:hover:border-destructive-hover",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
