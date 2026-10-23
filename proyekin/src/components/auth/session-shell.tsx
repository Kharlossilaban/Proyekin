"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useMockSession } from "@/components/auth/use-mock-session";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusMessage } from "@/components/auth/status-message";
import { MOCK_USER } from "@/data/mock";
import { mockLogout } from "@/lib/auth-mock";

/**
 * Menghubungkan App Shell dengan sesi simulasi.
 * BUKAN penjaga keamanan: tanpa sesi, aplikasi tetap terbuka sebagai Owner demo agar developer
 * dapat menguji semua route. Pembatasan akses sesungguhnya harus ditegakkan di backend.
 */
function SessionShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useMockSession();
  const sessionUser = session.status === "ready" ? session.user : null;
  const isGuest = sessionUser?.role === "GUEST";

  React.useEffect(() => {
    if (isGuest) router.replace("/akses-ditolak");
  }, [isGuest, router]);

  if (session.status === "loading" || isGuest) {
    return (
      <div aria-busy="true" className="flex flex-1 flex-col gap-4 p-6 lg:pl-64">
        <span className="sr-only" role="status">
          Memuat aplikasi
        </span>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const handleLogout = () => {
    mockLogout();
    router.push("/masuk");
  };

  return (
    <AppShell
      user={sessionUser ?? MOCK_USER}
      onLogout={sessionUser ? handleLogout : undefined}
      notice={
        sessionUser ? null : (
          <StatusMessage variant="warning" className="mb-6">
            Mode pengembangan: Anda belum masuk, sehingga tampilan memakai Owner demo. Akses ini hanya untuk pengujian
            dan bukan kontrol keamanan.{" "}
            <Link href="/masuk" className="font-medium underline underline-offset-4">
              Masuk dengan akun demo
            </Link>
          </StatusMessage>
        )
      }
    >
      {children}
    </AppShell>
  );
}

export { SessionShell };
