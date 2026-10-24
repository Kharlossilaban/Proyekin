"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { StatusMessage } from "@/components/auth/status-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { mockLogin } from "@/lib/auth-mock";
import { hasErrors, validateEmail, validateRequiredPassword } from "@/lib/auth-validation";
import { MOCK_USERS } from "@/data/mock";
import { ROLE_LABELS } from "@/lib/labels";

const NOTICES: Record<string, string> = {
  registered: "Pendaftaran Owner disimulasikan. Tidak ada akun yang benar-benar dibuat; masuk memakai akun demo di bawah.",
  reset: "Pengaturan ulang kata sandi disimulasikan. Tidak ada kata sandi yang diubah.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const notice = params.get("registered") ? NOTICES.registered : params.get("reset") ? NOTICES.reset : null;

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = event.currentTarget;
    const nextErrors = { email: validateEmail(email), password: validateRequiredPassword(password) };
    setErrors(nextErrors);
    setFormError(null);
    if (hasErrors(nextErrors)) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setLoading(true);
    const result = await mockLogin({ email, password });
    if (result.ok) {
      router.push("/dashboard");
      return;
    }
    setLoading(false);
    setFormError("Email atau kata sandi salah. Periksa kembali lalu coba lagi.");
  }

  return (
    <AuthCard
      title="Masuk ke Proyekin"
      description="Masuk untuk mengelola proyek konstruksi Anda."
      demoNote="Demo: login hanya menerima email akun demo dengan kata sandi apa saja. Kata sandi tidak diperiksa, disimpan, atau dikirim; ini bukan autentikasi yang aman."
      footer={
        <p>
          Pemilik proyek baru?{" "}
          <Link href="/daftar" className="font-medium text-brand-text underline underline-offset-4">
            Daftar sebagai Owner
          </Link>
        </p>
      }
    >
      {notice ? <StatusMessage variant="success">{notice}</StatusMessage> : null}
      {formError ? <StatusMessage variant="error">{formError}</StatusMessage> : null}

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField id="email" label="Alamat Email" required error={errors.email}>
          {(control) => (
            <Input
              {...control}
              type="email"
              name="email"
              autoComplete="username"
              autoFocus
              placeholder="nama@perusahaan.co.id"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </FormField>

        <FormField id="password" label="Kata Sandi" required error={errors.password}>
          {(control) => (
            <PasswordInput
              {...control}
              name="password"
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </FormField>

        <div className="flex justify-end">
          <Link href="/lupa-sandi" className="text-sm font-medium text-brand-text underline underline-offset-4">
            Lupa kata sandi?
          </Link>
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Masuk
        </Button>
      </form>

      <details className="rounded-md border border-border bg-canvas p-3 text-sm">
        <summary className="cursor-pointer font-medium text-foreground">Akun demo untuk pengujian</summary>
        <ul role="list" className="mt-2 flex flex-col gap-1 text-graphite">
          {MOCK_USERS.map((user) => (
            <li key={user.id}>
              <span className="font-mono text-xs">{user.email}</span> · {ROLE_LABELS[user.role]}
            </li>
          ))}
        </ul>
      </details>
    </AuthCard>
  );
}

export { LoginForm };
