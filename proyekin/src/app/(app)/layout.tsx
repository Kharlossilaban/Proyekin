import { AppShell } from "@/components/layout/app-shell";
import { MOCK_USER } from "@/data/mock";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell user={MOCK_USER}>{children}</AppShell>;
}
