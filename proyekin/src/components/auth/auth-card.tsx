import * as React from "react";

import { Badge } from "@/components/ui/badge";

interface AuthCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** Penjelasan singkat bagian mana dari flow ini yang hanya simulasi. */
  demoNote: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

function AuthCard({ icon, title, description, demoNote, footer, children }: AuthCardProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3">
        <Badge variant="warning" dot className="self-start">
          Mode demo
        </Badge>
        {icon ? (
          <div
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-lg bg-accent text-brand-text [&_svg]:size-6"
          >
            {icon}
          </div>
        ) : null}
        <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight text-charcoal focus:outline-none">
          {title}
        </h1>
        {description ? <p className="text-sm leading-6 text-graphite">{description}</p> : null}
      </div>

      <div className="mt-6 flex flex-col gap-5">{children}</div>

      <p className="mt-6 text-xs leading-5 text-muted-foreground">{demoNote}</p>

      {footer ? <div className="mt-5 border-t border-border pt-5 text-sm text-graphite">{footer}</div> : null}
    </section>
  );
}

export { AuthCard };
