import * as React from "react";

import { FieldError, FieldHint, Label } from "@/components/ui/field";

interface FieldControlProps {
  id: string;
  invalid: boolean;
  "aria-describedby": string | undefined;
  "aria-required": boolean | undefined;
}

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  children: (control: FieldControlProps) => React.ReactNode;
}

/** Menghubungkan label, petunjuk, dan pesan galat ke kontrol lewat aria-describedby. */
function FormField({ id, label, required, error, hint, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({
        id,
        invalid: Boolean(error),
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })}
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

export { FormField };
