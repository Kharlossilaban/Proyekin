"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

interface AppHeaderProps {
  title?: string;
  onMenuClick: () => void;
}

function AppHeader({ title, onMenuClick }: AppHeaderProps) {
  return (
    <header
      data-slot="app-header"
      className="sticky top-0 z-sticky flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 lg:px-6"
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Buka navigasi"
        aria-expanded={false}
        onClick={onMenuClick}
        className="size-11 lg:hidden"
      >
        <Menu className="size-5" />
      </Button>
      <div className="lg:hidden">
        <Logo size="sm" />
      </div>
      {title ? (
        <h1 className="text-lg font-semibold text-charcoal">{title}</h1>
      ) : null}
    </header>
  );
}

export { AppHeader };
