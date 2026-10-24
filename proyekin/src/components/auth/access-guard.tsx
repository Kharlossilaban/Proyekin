"use client";

// GUARD TAMPILAN UI — BUKAN OTORISASI DAN BUKAN KONTROL KEAMANAN.
// Pola "menyembunyikan" yang dibuktikan di U4-0 (docs/u4-evidence/U4-0-SPIKE.md): `children` SELALU dirender
// (agar prerender dan segmen halaman tetap utuh, pelajaran commit d8cd209) dan hanya disembunyikan (`hidden` + `inert`)
// sampai sesi diketahui dan aturan `allow` terpenuhi. Pengguna yang tidak berhak dialihkan ke /akses-ditolak.
//
// Keterbatasan (mock/prerender), WAJIB dipahami:
// - HTML dan payload RSC halaman tetap memuat data seed untuk SEMUA pengunjung; `hidden`/`inert` hanya menyembunyikan
//   secara visual. Data masih terbaca lewat inspeksi HTML, tab Network, atau saat JavaScript dimatikan.
// - Sesi hanya `sessionStorage` yang bisa diubah siapa saja. Aturan `allow` berjalan di klien.
// Penegakan sesungguhnya wajib di server/backend (backlog U3-B1, U3-B2).

import * as React from "react";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/components/auth/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import type { MockStoreState } from "@/lib/mock-store";
import { useMockStore } from "@/lib/use-mock-store";
import type { User } from "@/types";

type GuardStatus = "pending" | "allowed" | "denied";

type AccessGuardProps = {
  /** Aturan akses. Harus memanggil fungsi di `lib/access.ts`; jangan menulis ulang aturan role di sini. */
  allow: (actor: User, data: MockStoreState) => boolean;
  children: React.ReactNode;
};

function AccessGuard({ allow, children }: AccessGuardProps) {
  const router = useRouter();
  const current = useCurrentUser();
  const data = useMockStore();
  const status: GuardStatus = current.status === "loading" ? "pending" : allow(current.user, data) ? "allowed" : "denied";

  React.useEffect(() => {
    if (status === "denied") router.replace("/akses-ditolak");
  }, [status, router]);

  return (
    <>
      {status === "allowed" ? null : (
        <div data-slot="access-guard-placeholder" aria-busy={status === "pending"}>
          <span className="sr-only" role="status">
            Memeriksa akses
          </span>
          <Skeleton className="h-10 w-48" />
        </div>
      )}
      <div
        data-slot="access-guard"
        data-guard-status={status}
        hidden={status !== "allowed"}
        inert={status !== "allowed"}
      >
        {children}
      </div>
    </>
  );
}

export { AccessGuard };
export type { AccessGuardProps };
