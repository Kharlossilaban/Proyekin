"use client";

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";
import { controlVariants, type ControlSize } from "@/components/ui/control-variants";

type InputProps = Omit<InputPrimitive.Props, "size"> & {
  /** Tandai kontrol sebagai tidak valid (aria-invalid + gaya galat). */
  invalid?: boolean;
  /** `touch`: tinggi minimal 44px, font 16px (alur mobile). Bawaan `default` tidak berubah. */
  size?: ControlSize;
};

function Input({ className, invalid, size = "default", type = "text", ...props }: InputProps) {
  return (
    <InputPrimitive
      data-slot="input"
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(controlVariants({ size }), className)}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
