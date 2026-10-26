"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";

type PasswordInputProps = Omit<InputProps, "type"> & {
  /** Kelas tambahan untuk tombol tampilkan/sembunyikan (mis. mengembalikan lebar di layar lebar). */
  toggleClassName?: string;
};

function PasswordInput({ className, toggleClassName, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        // `size="touch"` pada input: tombol selebar 44px dan setinggi input (min. 44px). Ukuran bawaan tidak berubah.
        className={cn(
          "absolute inset-y-0 right-0 text-graphite",
          props.size === "touch" && "h-auto w-11",
          toggleClassName,
        )}
        disabled={props.disabled}
      >
        <Icon aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

export { PasswordInput };
export type { PasswordInputProps };
