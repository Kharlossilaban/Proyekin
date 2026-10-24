"use client";

// SPIKE U4-0 — dua varian guard tingkat halaman untuk dibandingkan terhadap prerender (lihat docs/u4-evidence/U4-0-SPIKE.md).
// BUKAN kontrol keamanan: sesi hanya `sessionStorage` yang bisa diubah siapa saja; HTML prerender sama untuk semua
// pengunjung. Penegakan akses sesungguhnya ada di server (backlog U3-B1/B2). Guard hanya merapikan tampilan UI.

import * as React from "react";
import { useRouter } from "next/navigation";

import { useMockSession } from "@/components/auth/use-mock-session";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_USER } from "@/data/mock";
import type { Role } from "@/types";

type GuardStatus = "pending" | "allowed" | "denied";

/** Mengikuti SessionShell: tanpa sesi, pengguna efektif adalah Owner demo (akses developer). */
function useGuardStatus(allow: readonly Role[]): GuardStatus {
  const router = useRouter();
  const session = useMockSession();
  const user = session.status === "ready" ? (session.user ?? MOCK_USER) : null;
  const status: GuardStatus = !user ? "pending" : allow.includes(user.role) ? "allowed" : "denied";

  React.useEffect(() => {
    if (status === "denied") router.replace("/akses-ditolak");
  }, [status, router]);

  return status;
}

/** Varian A — menahan: `children` tidak dirender sampai sesi diketahui dan diizinkan. */
function GatingGuard({ allow, children }: { allow: readonly Role[]; children: React.ReactNode }) {
  const status = useGuardStatus(allow);
  if (status !== "allowed") {
    return (
      <div data-spike-guard="gating" data-guard-status={status} aria-busy="true">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }
  return (
    <div data-spike-guard="gating" data-guard-status={status}>
      {children}
    </div>
  );
}

/** Varian B — menyembunyikan: `children` selalu dirender (ikut prerender), tetapi `hidden` + `inert` sampai diizinkan. */
function HiddenGuard({ allow, children }: { allow: readonly Role[]; children: React.ReactNode }) {
  const status = useGuardStatus(allow);
  const allowed = status === "allowed";
  return (
    <>
      {allowed ? null : (
        <div data-spike-guard="hidden-placeholder" aria-busy={status === "pending"}>
          <Skeleton className="h-10 w-48" />
        </div>
      )}
      <div data-spike-guard="hidden" data-guard-status={status} hidden={!allowed} inert={!allowed}>
        {children}
      </div>
    </>
  );
}

export { GatingGuard, HiddenGuard };
