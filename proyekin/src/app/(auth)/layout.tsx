import Link from "next/link";

import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[5fr_7fr]">
      <aside
        aria-label="Tentang Proyekin"
        className="hidden flex-col justify-between bg-secondary p-12 text-secondary-foreground lg:flex"
      >
        <p className="text-sm font-medium uppercase tracking-wide text-secondary-foreground/80">
          Platform Manajemen Proyek Konstruksi
        </p>
        <div className="max-w-md">
          <p className="text-4xl font-semibold leading-tight tracking-tight">
            Kantor dan lapangan. Satu irama kerja.
          </p>
          <p className="mt-4 text-base leading-7 text-secondary-foreground/80">
            Rencanakan proyek, koordinasikan tim, dan pantau progres lapangan.
          </p>
        </div>
        <p className="text-xs text-secondary-foreground/80">Untuk tim konstruksi · Proyekin</p>
      </aside>

      <div className="flex min-h-screen flex-col bg-surface px-4 py-6 sm:px-8 lg:min-h-0">
        <header>
          {/* Target sentuh >= 44px di bawah `lg` tanpa mengubah ukuran logo (gambar tetap 40px, hanya area tautan). */}
          <Link href="/" className="inline-flex min-h-11 items-center rounded-sm lg:min-h-0" aria-label="Proyekin — kembali ke beranda">
            <Logo />
          </Link>
        </header>
        <main id="main-content" className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
        <footer className="text-center text-xs text-muted-foreground">
          © 2026 Proyekin · Antarmuka demo, belum terhubung ke backend
        </footer>
      </div>
    </div>
  );
}
