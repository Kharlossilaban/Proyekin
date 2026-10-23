"use client";

import * as React from "react";

import { getSessionSnapshot, resolveSession, subscribeSession } from "@/lib/auth-mock";
import type { User } from "@/types";

type MockSessionState =
  | { status: "loading" }
  | { status: "ready"; user: User | null };

/** `undefined` dipakai server/hydration sebagai penanda "belum diketahui". */
const getServerSnapshot = (): string | null | undefined => undefined;

export function useMockSession(): MockSessionState {
  const raw = React.useSyncExternalStore<string | null | undefined>(
    subscribeSession,
    getSessionSnapshot,
    getServerSnapshot,
  );
  return React.useMemo<MockSessionState>(
    () => (raw === undefined ? { status: "loading" } : { status: "ready", user: resolveSession(raw) }),
    [raw],
  );
}
