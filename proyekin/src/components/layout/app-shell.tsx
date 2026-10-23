"use client";

import * as React from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { getNavForRole } from "@/lib/navigation";
import type { User } from "@/types";

interface AppShellProps {
  user: User;
  pageTitle?: string;
  children: React.ReactNode;
}

function AppShell({ user, pageTitle, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const items = React.useMemo(() => getNavForRole(user.role), [user.role]);

  return (
    <>
      <Sidebar
        items={items}
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col lg:pl-64">
        <AppHeader
          title={pageTitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main id="main-content" className="flex-1 px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </>
  );
}

export { AppShell };
