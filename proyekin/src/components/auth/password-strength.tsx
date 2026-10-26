import { Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import { PASSWORD_RULES } from "@/lib/auth-validation";

interface PasswordStrengthProps {
  value: string;
  id?: string;
  className?: string;
}

function PasswordStrength({ value, id, className }: PasswordStrengthProps) {
  const results = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(value) }));
  const metCount = results.filter((r) => r.met).length;

  return (
    <div id={id} className={cn("flex flex-col gap-2", className)}>
      <p className="text-sm font-medium text-foreground">Kriteria kata sandi</p>
      <ul role="list" className="grid gap-1 sm:grid-cols-2">
        {results.map((rule) => (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-2 text-sm",
              rule.met ? "text-success" : "text-muted-foreground",
            )}
          >
            {rule.met ? (
              <Check aria-hidden="true" className="size-4 shrink-0" />
            ) : (
              <Circle aria-hidden="true" className="size-4 shrink-0" />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{rule.met ? " (terpenuhi)" : " (belum terpenuhi)"}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {metCount} dari {PASSWORD_RULES.length} kriteria kata sandi terpenuhi.
      </p>
    </div>
  );
}

export { PasswordStrength };
