"use client";

import * as React from "react";

import { useMockSession } from "@/components/auth/use-mock-session";
import { MOCK_USER } from "@/data/mock";
import type { User } from "@/types";

export type CurrentUserState =
  | { status: "loading" }
  | {
      status: "ready";
      user: User;
      /** true = tidak ada sesi demo, memakai Owner demo (akses developer, mode pengembangan). */
      isDemoFallback: boolean;
    };

/**
 * Pengguna efektif, konsisten dengan `SessionShell`: sesi demo U3 bila ada; bila tidak, Owner demo (mode
 * pengembangan). BUKAN identitas yang diautentikasi: sesi hanya `sessionStorage` yang bisa diubah siapa saja,
 * dan hasil hook ini hanya dipakai untuk representasi UI (lihat `access.ts`).
 * `loading` selama sesi belum diketahui (server/hidrasi).
 */
export function useCurrentUser(): CurrentUserState {
  const session = useMockSession();
  return React.useMemo<CurrentUserState>(() => {
    if (session.status === "loading") return { status: "loading" };
    return session.user
      ? { status: "ready", user: session.user, isDemoFallback: false }
      : { status: "ready", user: MOCK_USER, isDemoFallback: true };
  }, [session]);
}
