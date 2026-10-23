import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ButtonMatrix,
  DialogDemos,
  FormStates,
  ResponsivePreview,
} from "@/components/style-guide/interactive";
import {
  BadgeSection,
  CardSection,
  ColorSection,
  Section,
  TableSection,
  TypographySection,
} from "@/components/style-guide/sections";
import { Badge } from "@/components/ui/badge";
import { TYPOGRAPHY } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Style Guide — Proyekin",
  robots: { index: false, follow: false },
};

const NAV = [
  ["warna", "Warna"],
  ["tipografi", "Tipografi"],
  ["tombol", "Tombol"],
  ["formulir", "Input"],
  ["badge", "Badge"],
  ["kartu", "Card"],
  ["tabel", "Tabel"],
  ["dialog", "Dialog"],
  ["responsif", "Responsif"],
] as const;

/**
 * Halaman internal khusus development. Pada build/deployment production
 * halaman ini selalu mengembalikan 404.
 */
export default function StyleGuidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-secondary focus:px-4 focus:py-2 focus:text-secondary-foreground"
      >
        Lewati ke konten
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:px-6">
          <Badge variant="brand" className="self-start">
            Internal — hanya development
          </Badge>
          <h1 className={TYPOGRAPHY.h1}>Style Guide Proyekin</h1>
          <p className={`${TYPOGRAPHY.body} max-w-2xl`}>
            Rujukan visual design system (Orange + Charcoal, Geist, light mode). Semua konten adalah contoh netral dan
            bukan data bisnis.
          </p>
        </div>
        <nav aria-label="Bagian style guide" className="border-t border-border">
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-graphite hover:bg-muted hover:text-foreground"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="konten" className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6">
        <Section id="warna" title="Warna" description="Brand, netral, dan semantic. Nilai berasal dari design token di globals.css.">
          <ColorSection />
        </Section>
        <Section id="tipografi" title="Tipografi" description="Skala tipografi dari tokens.ts.">
          <TypographySection />
        </Section>
        <Section id="tombol" title="Tombol" description="Varian, ukuran, dan state: default, hover, focus, active, disabled, loading.">
          <ButtonMatrix />
        </Section>
        <Section id="formulir" title="Input dan validasi" description="Label terhubung, bantuan, dan galat dengan ikon plus teks.">
          <FormStates />
        </Section>
        <Section id="badge" title="Badge">
          <BadgeSection />
        </Section>
        <Section id="kartu" title="Card">
          <CardSection />
        </Section>
        <Section id="tabel" title="Tabel" description="Header semantik, baris terpilih, angka rata kanan, dan state kosong.">
          <TableSection />
        </Section>
        <Section id="dialog" title="Dialog" description="Focus trap, Esc, fokus kembali ke pemicu, dan state loading.">
          <DialogDemos />
        </Section>
        <Section id="responsif" title="Pratinjau responsif">
          <ResponsivePreview />
        </Section>
      </main>
    </div>
  );
}
