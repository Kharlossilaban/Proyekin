import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { BackButton } from "@/components/auth/back-button";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const metadata = { title: "Akses Tidak Tersedia — Proyekin" };

export default function AksesDitolakPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex h-16 items-center border-b border-border px-4 lg:px-8">
        <Link href="/" className="inline-flex rounded-sm" aria-label="Proyekin — kembali ke beranda">
          <Logo />
        </Link>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center bg-canvas px-4 py-16">
        <div className="flex max-w-lg flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="flex size-16 items-center justify-center rounded-full bg-accent text-brand-text"
          >
            <ShieldAlert className="size-8" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-charcoal">Akses tidak tersedia</h1>
          <p className="mt-3 text-base leading-7 text-graphite">
            Anda tidak memiliki izin untuk membuka halaman ini. Jika merasa seharusnya memiliki akses, hubungi Owner
            atau Admin Kantor proyek Anda.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BackButton>Kembali ke halaman sebelumnya</BackButton>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Ke beranda
            </Link>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            Demo: halaman ini hanya tampilan. Pembatasan akses sesungguhnya akan ditegakkan oleh backend.
          </p>
        </div>
      </main>
    </div>
  );
}
