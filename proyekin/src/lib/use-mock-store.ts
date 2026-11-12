"use client";

import * as React from "react";

import {
  getMockStoreServerSnapshot,
  getMockStoreSnapshot,
  subscribeMockStore,
  type MockStoreState,
} from "@/lib/mock-store";

// Hook uji U4-7: HANYA development (lihat lib/dev-test-hooks.ts). Cabang ini dibuang saat build production.
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  void import("@/lib/dev-test-hooks").then((m) => m.installDevTestHooks());
}

/** State store mock (memori klien). Bentuknya juga memenuhi `AccessData` untuk `access.ts`. */
export function useMockStore(): MockStoreState {
  return React.useSyncExternalStore(subscribeMockStore, getMockStoreSnapshot, getMockStoreServerSnapshot);
}
