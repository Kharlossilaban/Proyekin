import { SessionShell } from "@/components/auth/session-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <SessionShell>{children}</SessionShell>;
}
