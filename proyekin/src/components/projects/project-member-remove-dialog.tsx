"use client";

// "Keluarkan dari proyek" (U4-7). Owner saja (`canRemoveProjectMembers` menentukan apakah tombol dirender panel).
// ATURAN (pemilik, U4-7): anggota yang masih tercatat sebagai penanggung jawab tugas APA PUN di proyek ini, termasuk tugas
// Selesai, TIDAK dapat dikeluarkan (fail-closed). Mengeluarkan hanya menghapus keanggotaan: akun, tugas, dan data lain tetap.
//
// - Dialog dikendalikan dan dirender oleh panel Tim (bukan di dalam baris), sehingga tetap ada walau baris anggota hilang
//   karena data berubah; keadaannya (blokir atau konfirmasi) DITETAPKAN saat dipasang dan tidak berganti jenis selama terbuka
//   (temuan review U4-6 7b).
// - Saat konfirmasi, keputusan dihitung ulang (`decideRemoveProjectMember`) terhadap snapshot store terbaru; bila ditolak,
//   ConfirmDialog menampilkan sebab yang spesifik (prop `errorMessage`) dan tidak ada data yang berubah.
// Representasi UI di atas data mock (memori tab), BUKAN otorisasi server.

import * as React from "react";

import { useCurrentUser } from "@/components/auth/use-current-user";
import { describeTeamActionError, TeamActionError } from "@/components/projects/team-action-error";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { countMemberTasks, decideRemoveProjectMember } from "@/lib/access";
import { getMemberRemoveBlockedText, getTeamActionFailureText } from "@/lib/labels";
import { getMockStoreSnapshot, removeProjectMember } from "@/lib/mock-store";
import { simulateLatency } from "@/lib/simulate-latency";
import type { Project, User } from "@/types";

type Mode = { kind: "confirm" } | { kind: "blocked"; tasks: { total: number; done: number } } | { kind: "stale"; text: string };

type ProjectMemberRemoveDialogProps = {
  project: Project;
  member: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dipanggil setelah keanggotaan benar-benar dihapus dari store. */
  onRemoved: (user: User) => void;
};

/** Dipasang (mount) oleh panel saat dibuka. */
function ProjectMemberRemoveDialog({ project, member, open, onOpenChange, onRemoved }: ProjectMemberRemoveDialogProps) {
  const current = useCurrentUser();
  const actor = current.status === "ready" ? current.user : null;
  // Keadaan dibekukan saat dibuka, dihitung dari snapshot store saat itu.
  const [mode] = React.useState<Mode>(() => {
    const snapshot = getMockStoreSnapshot();
    const decision = decideRemoveProjectMember(actor, project, member.id, snapshot);
    if (decision.allowed) return { kind: "confirm" };
    if (decision.reason === "HAS_TASKS") return { kind: "blocked", tasks: countMemberTasks(project, member.id, snapshot) };
    return { kind: "stale", text: getTeamActionFailureText(decision.reason, { memberName: member.name }) };
  });

  if (mode.kind === "confirm") {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title={`Keluarkan ${member.name} dari proyek?`}
        description={`${member.name} tidak lagi dapat membuka proyek ${project.code} dan namanya hilang dari tim. Akun dan perannya tidak berubah, dan tidak ada tugas atau data lain yang dihapus. Perubahan ini hanya simulasi dan hilang saat halaman dimuat ulang.`}
        confirmLabel="Keluarkan dari proyek"
        cancelLabel="Batal"
        errorMessage={describeTeamActionError}
        onConfirm={async () => {
          await simulateLatency();
          const fresh = getMockStoreSnapshot();
          const latest = fresh.projects.find((p) => p.id === project.id);
          if (!latest) throw new TeamActionError("PROJECT_NOT_FOUND");
          const fresher = decideRemoveProjectMember(actor, latest, member.id, fresh);
          if (!fresher.allowed) {
            throw new TeamActionError(fresher.reason, { memberName: member.name, tasks: countMemberTasks(latest, member.id, fresh) });
          }
          if (!removeProjectMember(latest.id, member.id)) throw new TeamActionError("STORE_REFUSED");
          onRemoved(member);
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-dialog={mode.kind === "blocked" ? "member-remove-blocked" : "member-remove-stale"}>
        <DialogHeader>
          <DialogTitle>{member.name} belum dapat dikeluarkan</DialogTitle>
          <DialogDescription>{mode.kind === "blocked" ? getMemberRemoveBlockedText(member.name, mode.tasks) : mode.text}</DialogDescription>
        </DialogHeader>
        {mode.kind === "blocked" ? (
          <p className="text-sm text-muted-foreground">
            Anggota hanya dapat dikeluarkan setelah tidak lagi tercatat sebagai penanggung jawab tugas di proyek ini, termasuk tugas
            yang sudah selesai.
          </p>
        ) : null}
        <DialogFooter className="[&>button]:w-full sm:[&>button]:w-auto">
          <DialogClose render={<Button size="touch" />}>Mengerti</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ProjectMemberRemoveDialog };
