import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-8">
        <Logo />
        <Link href="/dashboard">
          <Button size="sm">Masuk</Button>
        </Link>
      </header>

      <main id="main-content" className="flex flex-1 flex-col">
        <section className="flex flex-1 items-center justify-center bg-canvas px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-text">
              Platform Manajemen Proyek Konstruksi
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-charcoal sm:text-5xl">
              Kelola proyek konstruksi Anda dengan{" "}
              <span className="text-primary">Proyekin</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-graphite">
              Pantau progres proyek, kelola tugas tim, dan dokumentasikan
              aktivitas lapangan dalam satu platform terpadu.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/dashboard">
                <Button size="lg">Mulai Sekarang</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  Lihat Demo
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Demo — belum terhubung ke backend. Data yang ditampilkan adalah
              contoh.
            </p>
          </div>
        </section>

        <section className="border-t border-border bg-surface px-4 py-16 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-brand-text">
                  {f.emoji}
                </div>
                <h3 className="text-base font-semibold text-charcoal">
                  {f.title}
                </h3>
                <p className="text-sm leading-6 text-graphite">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface px-4 py-6 text-center text-xs text-muted-foreground">
        Proyekin — Platform Manajemen Proyek Konstruksi
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    emoji: "\u{1F4CA}",
    title: "Dashboard Analitik",
    description:
      "Ringkasan statistik proyek, progres tim, dan tugas tertunda dalam satu tampilan.",
  },
  {
    emoji: "\u{1F4CB}",
    title: "Manajemen Tugas",
    description:
      "Buat, tugaskan, dan lacak status tugas dari awal sampai selesai.",
  },
  {
    emoji: "\u{1F4F1}",
    title: "Laporan Harian",
    description:
      "Mandor dapat membuat laporan langsung dari lapangan, lengkap dengan foto.",
  },
  {
    emoji: "\u{1F4C1}",
    title: "Dokumen Proyek",
    description:
      "Upload, unduh, dan kategorisasi dokumen dalam repositori terstruktur.",
  },
  {
    emoji: "\u{1F465}",
    title: "Manajemen Anggota",
    description:
      "Kelola tim proyek dengan peran yang jelas: Owner, Admin, Mandor, Anggota.",
  },
  {
    emoji: "\u{1F4C5}",
    title: "Jadwal & Gantt",
    description:
      "Visualisasikan timeline proyek untuk perencanaan yang lebih baik.",
  },
];
