"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  FileText,
  Files,
  Users,
  Settings,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { NavItem } from "@/lib/navigation";
import { ROLE_LABELS } from "@/lib/labels";
import type { User } from "@/types";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  FileText,
  Files,
  Users,
  Settings,
};

interface SidebarProps {
  items: NavItem[];
  user: User;
  open: boolean;
  onClose: () => void;
  onLogout?: () => void;
  /** Sesi belum diketahui: placeholder agar menu role yang salah tidak sempat tampil. */
  pending?: boolean;
}

function Sidebar({ items, user, open, onClose, onLogout, pending = false }: SidebarProps) {
  const pathname = usePathname();

  const nav = pending ? (
    <nav aria-label="Navigasi utama" aria-busy="true" className="flex flex-1 flex-col gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </nav>
  ) : (
    <nav aria-label="Navigasi utama" className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-graphite hover:bg-muted hover:text-foreground",
                )}
              >
                {Icon ? <Icon className="size-5 shrink-0" /> : null}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const userBlock = pending ? (
    <div className="border-t border-border px-3 py-4" aria-busy="true">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  ) : (
    <div className="border-t border-border px-3 py-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
      </div>
      {onLogout ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => {
            onClose();
            onLogout();
          }}
        >
          <LogOut aria-hidden="true" />
          Keluar
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        data-slot="sidebar-desktop"
        className="hidden lg:fixed lg:inset-y-0 lg:z-sticky lg:flex lg:w-64 lg:flex-col"
      >
        <div className="flex h-full flex-col border-r border-border bg-surface">
          <div className="flex h-16 shrink-0 items-center px-4">
            <Logo />
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-2">
            {nav}
          </div>
          {userBlock}
        </div>
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-modal lg:hidden">
          <div
            className="fixed inset-0 bg-charcoal/50 transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside
            data-slot="sidebar-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi utama"
            className="fixed inset-y-0 left-0 z-modal flex w-72 flex-col bg-surface shadow-xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Tutup navigasi"
                onClick={onClose}
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-2">
              {nav}
            </div>
            {userBlock}
          </aside>
        </div>
      ) : null}
    </>
  );
}

export { Sidebar };
