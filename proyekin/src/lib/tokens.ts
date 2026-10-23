/**
 * Referensi design token PROYEKIN.
 * Nilai warna TIDAK didefinisikan di sini; sumber tunggalnya adalah
 * `src/app/globals.css` (blok `@theme`). File ini hanya memberi akses bertipe
 * ke token tersebut (mis. untuk chart atau style inline) dan skala tipografi.
 */

const cssVar = (name: string) => `var(--color-${name})` as const;

const BRAND_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
type BrandShade = (typeof BRAND_SHADES)[number];

export const COLORS = {
  brand: Object.fromEntries(
    BRAND_SHADES.map((shade) => [shade, cssVar(`brand-${shade}`)]),
  ) as Record<BrandShade, string>,
  charcoal: cssVar("charcoal"),
  graphite: cssVar("graphite"),
  canvas: cssVar("canvas"),
  highlight: cssVar("highlight"),
  surface: cssVar("surface"),
  muted: cssVar("muted"),
  mutedForeground: cssVar("muted-foreground"),
  ring: cssVar("ring"),
  card: cssVar("card"),
  secondary: cssVar("secondary"),
  secondaryForeground: cssVar("secondary-foreground"),
  accent: cssVar("accent"),
  destructive: cssVar("destructive"),
  border: cssVar("border"),
  input: cssVar("input"),
  primary: cssVar("primary"),
  primaryForeground: cssVar("primary-foreground"),
  brandText: cssVar("brand-text"),
  semantic: {
    success: cssVar("success"),
    successSoft: cssVar("success-soft"),
    warning: cssVar("warning"),
    warningSoft: cssVar("warning-soft"),
    danger: cssVar("danger"),
    dangerSoft: cssVar("danger-soft"),
    info: cssVar("info"),
    infoSoft: cssVar("info-soft"),
  },
} as const;

/**
 * Skala tipografi (font utama: Geist, diatur di layout.tsx dan globals.css).
 * Berupa kelas Tailwind agar konsisten antar halaman dan komponen.
 */
export const TYPOGRAPHY = {
  display: "text-4xl font-semibold tracking-tight text-charcoal sm:text-5xl",
  h1: "text-3xl font-semibold tracking-tight text-charcoal",
  h2: "text-2xl font-semibold tracking-tight text-charcoal",
  h3: "text-xl font-semibold text-charcoal",
  h4: "text-base font-semibold text-charcoal",
  body: "text-base leading-7 text-graphite",
  bodySm: "text-sm leading-6 text-graphite",
  label: "text-sm font-medium text-charcoal",
  caption: "text-xs leading-5 text-muted-foreground",
  overline: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
  link: "font-medium text-brand-text underline-offset-4 hover:underline",
  numeric: "font-mono tabular-nums",
} as const;

export const SPACING = {
  px: "1px",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const RADIUS = {
  none: "0",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
} as const;

export const SHADOW = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
};

export const ZINDEX = {
  dropdown: 1000,
  sticky: 1020,
  modalBackdrop: 1040,
  modal: 1050,
  toast: 1070,
};
