"use client";

// Hapus proyek (U4-6). ATURAN MUTLAK pemilik: proyek yang masih memiliki Task, ProjectMember, atau Admin principal TIDAK
// dapat dihapus, dan tidak ada penghapusan berantai. Aturannya hidup di `access.ts` (`getProjectDeleteBlockers`,
// `decideDeleteProject`) dan juga dijaga `mock-store.deleteProject`; komponen ini hanya menampilkannya.
//
// - Ada penghalang → dialog penjelasan (tanpa tombol hapus) yang menyebut tiap keterkaitan; tidak ada data berubah.
// - Tanpa penghalang → ConfirmDialog yang menyebut akibatnya. Izin diperiksa ulang saat konfirmasi.
// Representasi UI di atas data mock, BUKAN otorisasi.

import * as React from "react";
import { Trash2 } from "lucide-react";

import { useCurrentUser } from "@/components/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { decideDeleteProject, getProjectDeleteBlockers } from "@/lib/access";
import { getProjectDeleteBlockerText } from "@/lib/labels";
import { deleteProject, getMockStoreSnapshot } from "@/lib/mock-store";
import { getUserName } from "@/lib/project-relations";
import { simulateLatency } from "@/lib/simulate-latency";
import { useMockStore } from "@/lib/use-mock-store";
import type { Project } from "@/types";

type ProjectDeleteDialogProps = {
  project: Project;
  /** Dipanggil setelah proyek terhapus dari store (untuk menampilkan keadaan "dihapus"). */
  onDeleted?: (project: Project) => void;
};

function ProjectDeleteDialog({ project, onDeleted }: ProjectDeleteDialogProps) {
  const current = useCurrentUser();
  const data = useMockStore();
  const actor = current.status === "ready" ? current.user : null;
  const blockers = getProjectDeleteBlockers(project, data);

  const trigger = (
    <Button variant="outline" size="touch" className="text-destructive" data-action="delete-project">
      <Trash2 aria-hidden="true" className="size-4" />
      <span>
        Hapus<span className="sr-only sm:not-sr-only"> proyek</span>
      </span>
    </Button>
  );

  if (blockers.length > 0) {
    return (
      <Dialog>
        <DialogTrigger render={trigger} />
        <DialogContent data-dialog="project-delete-blocked">
          <DialogHeader>
            <DialogTitle>Proyek belum bisa dihapus</DialogTitle>
            <DialogDescription>
              {project.code} masih terhubung dengan data lain. Tidak ada data yang dihapus.
            </DialogDescription>
          </DialogHeader>
          <ul data-slot="delete-blockers" className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-foreground">
            {blockers.map((blocker) => (
              <li key={blocker.reason} data-blocker={blocker.reason}>
                {getProjectDeleteBlockerText(blocker.reason, blocker.count, getUserName(data.users, project.adminId))}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Proyek hanya dapat dihapus setelah tidak memiliki tugas, anggota tim, maupun Admin Kantor penanggung jawab.
          </p>
          <DialogFooter className="[&>button]:w-full sm:[&>button]:w-auto">
            <DialogClose render={<Button size="touch" />}>Mengerti</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <ConfirmDialog
      trigger={trigger}
      title={`Hapus proyek ${project.code}?`}
      description={`Proyek “${project.name}” akan dihapus dari data demo. Proyek ini tidak memiliki tugas, anggota tim, maupun Admin Kantor penanggung jawab, jadi tidak ada data lain yang terdampak. Karena hanya simulasi, proyek muncul kembali setelah halaman dimuat ulang.`}
      confirmLabel="Ya, hapus proyek"
      cancelLabel="Batal"
      onConfirm={async () => {
        await simulateLatency();
        const fresh = getMockStoreSnapshot();
        const latest = fresh.projects.find((p) => p.id === project.id);
        if (!latest) throw new Error("NOT_FOUND");
        const decision = decideDeleteProject(actor, latest, fresh);
        if (!decision.allowed) throw new Error(decision.reason);
        if (!deleteProject(latest.id)) throw new Error("DELETE_REFUSED");
        onDeleted?.(latest);
      }}
    />
  );
}

export { ProjectDeleteDialog };
