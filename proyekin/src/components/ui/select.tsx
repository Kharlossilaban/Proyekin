import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { controlVariants, type ControlSize } from "@/components/ui/control-variants";

type SelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  /** Tandai kontrol sebagai tidak valid (aria-invalid + gaya galat). */
  invalid?: boolean;
  /** `touch`: tinggi minimal 44px dan font 16px (alur mobile). */
  size?: ControlSize;
};

/**
 * Select NATIVE: mengikuti pemilih bawaan perangkat (nyaman di mobile, keyboard dan pembaca layar bekerja
 * tanpa kode tambahan). Isi dengan <option>/<optgroup>. Hubungkan label dengan `id` + <Label htmlFor>.
 */
function Select({ className, invalid, size = "default", children, ...props }: SelectProps) {
  return (
    <div data-slot="select-wrapper" className="relative w-full min-w-0">
      <select
        data-slot="select"
        aria-invalid={invalid || undefined}
        className={cn(controlVariants({ size }), "cursor-pointer appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-graphite",
          size === "touch" ? "size-5" : "size-4",
        )}
      />
    </div>
  );
}

export { Select };
export type { SelectProps };
