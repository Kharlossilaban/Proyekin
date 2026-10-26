"use client";

import * as React from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { getNavForUser } from "@/lib/navigation";
import type { User } from "@/types";

interface AppShellProps {
  user: User;
  pageTitle?: string;
  /** Aksi keluar; tombol "Keluar" hanya tampil bila diberikan. */
  onLogout?: () => void;
  /** Sesi belum diketahui (server/hydration): menu dan blok user menjadi placeholder. */
  pending?: boolean;
  /** Pemberitahuan di atas konten halaman (mis. mode demo). */
  notice?: React.ReactNode;
  children: React.ReactNode;
}

function AppShell({ user, pageTitle, onLogout, pending, notice, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const items = React.useMemo(() => (pending ? [] : getNavForUser(user)), [pending, user]);

  return (
    <>
      <Sidebar
        items={items}
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        pending={pending}
      />

      <div className="flex flex-1 flex-col lg:pl-64">
        <AppHeader
          title={pageTitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main id="main-content" className="flex-1 px-4 py-6 lg:px-6">
          {notice}
          {children}
        </main>
      </div>
    </>
  );
}

export { AppShell };
