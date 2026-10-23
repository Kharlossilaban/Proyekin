"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Terjadi kesalahan"
      description="Halaman gagal dimuat. Silakan coba lagi."
      retry={reset}
    />
  );
}
