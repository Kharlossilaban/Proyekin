import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Masuk — Proyekin" };

export default function MasukPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
