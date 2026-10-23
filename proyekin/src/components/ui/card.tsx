import * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div"> & {
  /** Beri gaya hover/fokus bila seluruh card adalah target klik. */
  interactive?: boolean;
};

function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm",
        interactive &&
          "transition-colors hover:border-input hover:bg-canvas focus-within:border-input",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("text-sm text-graphite", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-2 border-t border-border pt-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
