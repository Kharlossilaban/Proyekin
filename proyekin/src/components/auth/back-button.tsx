"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

function BackButton({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <Button
      size="lg"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
    >
      <ArrowLeft aria-hidden="true" />
      {children}
    </Button>
  );
}

export { BackButton };
