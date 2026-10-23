"use client";

import * as React from "react";
import Link from "next/link";
import { KeyRound, MailQuestion } from "lucide-react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { mockRequestPasswordReset } from "@/lib/auth-mock";
import { validateEmail } from "@/lib/auth-validation";

function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const headingRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (submitted) headingRef.current?.querySelector<HTMLElement>("h1")?.focus();
  }, [submitted]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = event.currentTarget;
    const nextError = validateEmail(email);
    setError(nextError);
    if (nextError) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setLoading(true);
    await mockRequestPasswordReset(email);
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div ref={headingRef}>
        <AuthCard
          icon={<MailQuestion />}
          title="Periksa email Anda"
          description="Jika alamat tersebut terdaftar, tautan pemulihan akan dikirim ke sana. Pesan ini sama untuk semua alamat demi privasi."
          demoNote="Demo: tidak ada email yang benar-benar dikirim. Gunakan tombol simulasi di bawah untuk melanjutkan ke halaman pengaturan ulang."
        >
          <Link href="/reset-sandi?token=demo-token" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            Buka halaman reset (simulasi)
          </Link>
          <Link href="/masuk" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
            Kembali ke halaman masuk
          </Link>
        </AuthCard>
      </div>
    );
  }

  return (
    <AuthCard
      icon={<KeyRound />}
      title="Lupa kata sandi?"
      description="Masukkan alamat email Anda untuk meminta tautan pemulihan kata sandi."
      demoNote="Demo: tidak ada email yang dikirim dan tidak ada akun yang diperiksa."
      footer={
        <Link href="/masuk" className="font-medium text-brand-text underline underline-offset-4">
          Kembali ke halaman masuk
        </Link>
      }
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField id="email" label="Alamat Email" required error={error}>
          {(control) => (
            <Input
              {...control}
              type="email"
              name="email"
              autoComplete="email"
              autoFocus
              placeholder="nama@perusahaan.co.id"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </FormField>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Kirim Tautan Pemulihan
        </Button>
      </form>
    </AuthCard>
  );
}

export { ForgotPasswordForm };
