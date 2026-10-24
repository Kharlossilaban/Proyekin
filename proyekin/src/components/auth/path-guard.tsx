"use client";

// Guard URL untuk seluruh route di (app): bagian aplikasi ditentukan dari path (menu), aturan dari `canAccessSection`
// (access.ts) — sumber yang sama dengan menu, sehingga menu dan URL langsung tidak bisa berbeda.
// Path di luar menu (mis. halaman uji development) tidak dibatasi per bagian. Lihat `AccessGuard` untuk keterbatasan:
// ini representasi UI, BUKAN otorisasi.

import * as React from "react";
import { usePathname } from "next/navigation";

import { AccessGuard } from "@/components/auth/access-guard";
import { canAccessSection } from "@/lib/access";
import { getSectionForPath } from "@/lib/navigation";

function PathGuard({ children }: { children: React.ReactNode }) {
  const section = getSectionForPath(usePathname());
  return <AccessGuard allow={(actor) => !section || canAccessSection(actor, section)}>{children}</AccessGuard>;
}

export { PathGuard };
