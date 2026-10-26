import * as React from "react";

import { cn } from "@/lib/utils";
import { textareaVariants, type ControlSize } from "@/components/ui/control-variants";

type TextareaProps = React.ComponentProps<"textarea"> & {
  /** Tandai kontrol sebagai tidak valid (aria-invalid + gaya galat). */
  invalid?: boolean;
  /** `touch`: font 16px dan tinggi minimal lebih besar untuk alur mobile. */
  size?: ControlSize;
};

function Textarea({ className, invalid, size = "default", ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      aria-invalid={invalid || undefined}
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  );
}

export { Textarea };
export type { TextareaProps };
