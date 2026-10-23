"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { mockRegisterOwner } from "@/lib/auth-mock";
import {
  hasErrors,
  validateConfirmation,
  validateEmail,
  validateName,
  validateNewPassword,
} from "@/lib/auth-validation";

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmation?: string;
  terms?: string;
}

function RegisterForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [accepted, setAccepted] = React.useState(false);
  const [errors, setErrors] = React.useState<RegisterErrors>({});
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = event.currentTarget;
    const nextErrors: RegisterErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validateNewPassword(password),
      confirmation: validateConfirmation(password, confirmation),
      terms: accepted ? undefined : "Anda harus menyetujui syarat dan ketentuan untuk melanjutkan.",
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setLoading(true);
    await mockRegisterOwner({ name, email });
    router.push("/masuk?registered=1");
  }

  return (
    <AuthCard
      title="Daftar sebagai Owner"
      description="Pendaftaran publik hanya untuk Owner (pemilik proyek). Admin Kantor, Mandor, dan Anggota Tim ditambahkan oleh Owner di dalam aplikasi."
      demoNote="Demo: pendaftaran hanya simulasi. Tidak ada akun, data perusahaan, atau email verifikasi yang dibuat atau dikirim, dan data yang Anda isi tidak disimpan."
      footer={
        <p>
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-medium text-brand-text underline underline-offset-4">
            Masuk
          </Link>
        </p>
      }
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField id="name" label="Nama Lengkap" required error={errors.name}>
          {(control) => (
            <Input
              {...control}
              name="name"
              autoComplete="name"
              autoFocus
              placeholder="Nama lengkap Anda"
              value={name}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </FormField>

        <FormField id="email" label="Alamat Email" required error={errors.email}>
          {(control) => (
            <Input
              {...control}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="nama@perusahaan.co.id"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </FormField>

        <div className="flex flex-col gap-3">
          <FormField id="password" label="Kata Sandi" required error={errors.password}>
            {(control) => (
              <PasswordInput
                {...control}
                aria-describedby={[control["aria-describedby"], "password-rules"].filter(Boolean).join(" ")}
                name="password"
                autoComplete="new-password"
                placeholder="Buat kata sandi"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </FormField>
          <PasswordStrength id="password-rules" value={password} />
        </div>

        <FormField id="confirmation" label="Konfirmasi Kata Sandi" required error={errors.confirmation}>
          {(control) => (
            <PasswordInput
              {...control}
              name="confirmation"
              autoComplete="new-password"
              placeholder="Ulangi kata sandi"
              value={confirmation}
              disabled={loading}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          )}
        </FormField>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="terms" className="flex items-start gap-2 text-sm text-foreground">
            <input
              id="terms"
              type="checkbox"
              name="terms"
              checked={accepted}
              disabled={loading}
              aria-invalid={errors.terms ? true : undefined}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              aria-required="true"
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-secondary"
            />
            <span>Saya menyetujui Syarat dan Ketentuan serta Kebijakan Privasi Proyekin.</span>
          </label>
          {errors.terms ? <FieldError id="terms-error">{errors.terms}</FieldError> : null}
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Buat Akun
        </Button>
      </form>
    </AuthCard>
  );
}

export { RegisterForm };
