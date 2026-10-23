"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LinkIcon, LockKeyhole } from "lucide-react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import { mockResetPassword } from "@/lib/auth-mock";
import { hasErrors, validateConfirmation, validateNewPassword } from "@/lib/auth-validation";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [errors, setErrors] = React.useState<{ password?: string; confirmation?: string }>({});
  const [loading, setLoading] = React.useState(false);

  if (!token) {
    return (
      <AuthCard
        icon={<LinkIcon />}
        title="Tautan tidak valid"
        description="Tautan pengaturan ulang kata sandi tidak lengkap atau sudah kedaluwarsa. Minta tautan baru untuk melanjutkan."
        demoNote="Demo: halaman ini memerlukan parameter ?token=… pada alamat. Tautan simulasi dibuat dari halaman Lupa Kata Sandi."
      >
        <Link href="/lupa-sandi" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          Minta tautan baru
        </Link>
        <Link href="/masuk" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
          Kembali ke halaman masuk
        </Link>
      </AuthCard>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = event.currentTarget;
    const nextErrors = {
      password: validateNewPassword(password),
      confirmation: validateConfirmation(password, confirmation),
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setLoading(true);
    await mockResetPassword();
    router.push("/masuk?reset=1");
  }

  return (
    <AuthCard
      icon={<LockKeyhole />}
      title="Buat kata sandi baru"
      description="Pilih kata sandi kuat yang belum pernah Anda gunakan."
      demoNote="Demo: tidak ada kata sandi yang diubah atau disimpan, dan tautan simulasi ini tidak diverifikasi."
      footer={
        <Link href="/masuk" className="font-medium text-brand-text underline underline-offset-4">
          Kembali ke halaman masuk
        </Link>
      }
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <FormField id="password" label="Kata Sandi Baru" required error={errors.password}>
            {(control) => (
              <PasswordInput
                {...control}
                aria-describedby={[control["aria-describedby"], "password-rules"].filter(Boolean).join(" ")}
                name="password"
                autoComplete="new-password"
                autoFocus
                placeholder="Buat kata sandi baru"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </FormField>
          <PasswordStrength id="password-rules" value={password} />
        </div>

        <FormField id="confirmation" label="Konfirmasi Kata Sandi Baru" required error={errors.confirmation}>
          {(control) => (
            <PasswordInput
              {...control}
              name="confirmation"
              autoComplete="new-password"
              placeholder="Ulangi kata sandi baru"
              value={confirmation}
              disabled={loading}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          )}
        </FormField>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Atur Ulang Kata Sandi
        </Button>
      </form>
    </AuthCard>
  );
}

export { ResetPasswordForm };
