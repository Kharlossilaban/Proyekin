import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Aset logo sementara (JPEG berisi simbol + tulisan "Proyekin").
 * Untuk mengganti ke SVG/PNG transparan, ubah LOGO_ASSET saja; layout tidak berubah
 * selama rasio lebar:tinggi diperbarui di `ratio`.
 */
const LOGO_ASSET = {
  src: "/logo-proyekin.jpeg",
  width: 1540,
  height: 672,
} as const;

/** Tinggi tampilan (px). Lebar mengikuti rasio aset. */
const HEIGHTS = { sm: 32, md: 40, lg: 56 } as const;

interface LogoProps {
  size?: keyof typeof HEIGHTS;
  className?: string;
}

function Logo({ size = "md", className }: LogoProps) {
  const height = HEIGHTS[size];
  const width = Math.round((height * LOGO_ASSET.width) / LOGO_ASSET.height);
  return (
    <Image
      src={LOGO_ASSET.src}
      alt="Proyekin"
      width={width}
      height={height}
      className={cn("h-auto max-w-full shrink-0 object-contain", className)}
      style={{ height, width: "auto" }}
      priority
    />
  );
}

export { Logo };
