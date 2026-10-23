import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

const SIZES = { sm: 28, md: 36, lg: 48 } as const;

function Logo({ size = "md", className, showText = true }: LogoProps) {
  const px = SIZES[size];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2", className)}>
      <Image
        src="/logo-proyekin.jpeg"
        alt=""
        width={px}
        height={px}
        className="rounded-md"
        priority
      />
      {showText ? (
        <span className="text-lg font-semibold tracking-tight text-charcoal">
          Proyekin
        </span>
      ) : null}
    </span>
  );
}

export { Logo };
