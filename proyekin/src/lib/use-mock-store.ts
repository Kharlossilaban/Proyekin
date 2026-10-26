"use client";

import * as React from "react";

import {
  getMockStoreServerSnapshot,
  getMockStoreSnapshot,
  subscribeMockStore,
  type MockStoreState,
} from "@/lib/mock-store";

/** State store mock (memori klien). Bentuknya juga memenuhi `AccessData` untuk `access.ts`. */
export function useMockStore(): MockStoreState {
  return React.useSyncExternalStore(subscribeMockStore, getMockStoreSnapshot, getMockStoreServerSnapshot);
}
