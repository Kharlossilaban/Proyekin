// PERINGATAN — SIMULASI UI, BUKAN AUTENTIKASI.
// Modul ini hanya mensimulasikan pengalaman login/registrasi/reset di frontend.
// - Tidak ada backend, token, cookie, JWT, atau pemeriksaan kata sandi.
// - Kata sandi TIDAK dibaca, disimpan, maupun dikirim ke mana pun.
// - Sesi di sessionStorage bisa diubah siapa saja lewat DevTools; ini BUKAN authorization.
// - Redirect dan penyembunyian menu di frontend hanya representasi UI.
// Saat backend siap, ganti isi fungsi `mock*` dengan pemanggilan API (tanda tangan dipertahankan
// async agar komponen UI tidak perlu berubah); penegakan akses sesungguhnya ada di server.

import { MOCK_USERS } from "@/data/mock";
import type { User } from "@/types";

const SESSION_KEY = "proyekin-demo-session";
const SIMULATED_LATENCY_MS = 800;

export interface MockSession {
  userId: string;
  loginAt: string;
}

export interface MockCredentials {
  email: string;
  /** Sengaja tidak dibaca (lihat peringatan di atas). */
  password: string;
}

export type MockLoginResult = { ok: true; user: User } | { ok: false };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Nilai mentah sesi; string stabil agar cocok dengan useSyncExternalStore. */
export function getSessionSnapshot(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function resolveSession(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MockSession>;
    return MOCK_USERS.find((user) => user.id === parsed.userId) ?? null;
  } catch {
    return null;
  }
}

export async function mockLogin(credentials: MockCredentials): Promise<MockLoginResult> {
  await wait(SIMULATED_LATENCY_MS);
  const email = credentials.email.trim().toLowerCase();
  const user = MOCK_USERS.find((candidate) => candidate.email.toLowerCase() === email);
  if (!user) return { ok: false };
  const session: MockSession = { userId: user.id, loginAt: new Date().toISOString() };
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    return { ok: false };
  }
  notify();
  return { ok: true, user };
}

export function mockLogout(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* penyimpanan tidak tersedia */
  }
  notify();
}

/** Simulasi pembuatan akun Owner: tidak ada data yang disimpan. */
export async function mockRegisterOwner(input: { name: string; email: string }): Promise<{ ok: true }> {
  void input;
  await wait(SIMULATED_LATENCY_MS);
  return { ok: true };
}

/** Simulasi permintaan tautan pemulihan: tidak ada email yang dikirim. */
export async function mockRequestPasswordReset(email: string): Promise<{ ok: true }> {
  void email;
  await wait(SIMULATED_LATENCY_MS);
  return { ok: true };
}

/** Simulasi penggantian kata sandi: tidak ada yang diubah. */
export async function mockResetPassword(): Promise<{ ok: true }> {
  await wait(SIMULATED_LATENCY_MS);
  return { ok: true };
}
