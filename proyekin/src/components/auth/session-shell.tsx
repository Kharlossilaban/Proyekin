"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useMockSession } from "@/components/auth/use-mock-session";
import { AppShell } from "@/components/layout/app-shell";
import { StatusMessage } from "@/components/auth/status-message";
import { MOCK_USER } from "@/data/mock";
import { mockLogout } from "@/lib/auth-mock";

/**
 * Menghubungkan App Shell dengan sesi simulasi.
 * BUKAN penjaga keamanan: tanpa sesi, aplikasi tetap terbuka sebagai Owner demo agar developer
 * dapat menguji semua route. Pembatasan akses sesungguhnya harus ditegakkan di backend.
 * `children` selalu dirender (termasuk di server) agar halaman tetap bisa di-prerender;
 * hanya menu dan blok user yang menjadi placeholder sampai sesi diketahui di klien.
 */
function SessionShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useMockSession();
  const pending = session.status === "loading";
  const sessionUser = session.status === "ready" ? session.user : null;
  const isGuest = sessionUser?.role === "GUEST";

  React.useEffect(() => {
    if (isGuest) router.replace("/akses-ditolak");
  }, [isGuest, router]);

  const handleLogout = () => {
    mockLogout();
    router.push("/masuk");
  };

  const showNotice = !pending && !sessionUser;

  return (
    <AppShell
      user={sessionUser ?? MOCK_USER}
      pending={pending || isGuest}
      onLogout={sessionUser ? handleLogout : undefined}
      notice={
        showNotice ? (
          <StatusMessage variant="warning" className="mb-6">
            Mode pengembangan: Anda belum masuk, sehingga tampilan memakai Owner demo. Akses ini hanya untuk pengujian
            dan bukan kontrol keamanan.{" "}
            <Link href="/masuk" className="font-medium underline underline-offset-4">
              Masuk dengan akun demo
            </Link>
          </StatusMessage>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}

export { SessionShell };
