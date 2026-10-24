import { PathGuard } from "@/components/auth/path-guard";
import { SessionShell } from "@/components/auth/session-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionShell>
      <PathGuard>{children}</PathGuard>
    </SessionShell>
  );
}
