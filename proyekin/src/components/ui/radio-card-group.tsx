"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type RadioCardOption<T extends string> = {
  value: T;
  label: string;
  /** Keterangan singkat di bawah label (opsional). */
  description?: string;
  disabled?: boolean;
};

type RadioCardGroupProps<T extends string> = {
  /** Nama grup yang dibacakan pembaca layar (<legend>), mis. "Status tugas". */
  legend: string;
  /** Nama field native (mengelompokkan radio; wajib unik di halaman). */
  name: string;
  options: readonly RadioCardOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Grup radio berbentuk kartu besar untuk alur sentuh (mis. status tugas Mandor/Anggota Tim).
 * Memakai radio NATIVE: Tab masuk ke grup, panah memindah dan memilih, tanpa kode keyboard tambahan.
 * Setiap pilihan minimal 44px tinggi; elemen input menutupi seluruh kartu sehingga seluruh kartu menjadi target sentuh.
 * Pilihan terpilih ditandai titik + garis tepi + latar (tidak hanya warna). Tidak ada kontrol yang bergantung pada hover.
 * Komponen ini hanya presentasi: menyimpan atau mengubah data adalah tugas pemakainya.
 */
function RadioCardGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onValueChange,
  disabled = false,
  className,
}: RadioCardGroupProps<T>) {
  return (
    <fieldset data-slot="radio-card-group" disabled={disabled} className={cn("min-w-0", className)}>
      <legend className="mb-2 text-sm font-medium text-foreground">{legend}</legend>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            data-slot="radio-card"
            className={cn(
              "group/radio relative flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-input bg-surface px-4 py-2 text-base text-foreground",
              "transition-colors has-checked:border-brand-700 has-checked:bg-accent",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
              "has-disabled:cursor-not-allowed has-disabled:border-border has-disabled:bg-muted has-disabled:text-muted-foreground",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onValueChange(option.value)}
              className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-input group-has-[:checked]/radio:border-brand-700"
            >
              <span className="size-2.5 scale-0 rounded-full bg-brand-700 transition-transform group-has-[:checked]/radio:scale-100 motion-reduce:transition-none" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{option.label}</span>
              {option.description ? <span className="text-sm text-muted-foreground">{option.description}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export { RadioCardGroup };
export type { RadioCardGroupProps, RadioCardOption };
