import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Atur Ulang Kata Sandi — Proyekin" };

export default function ResetSandiPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
