"use client";

// Dialog tambah/ubah proyek (U4-6). Hak datang SEPENUHNYA dari `access.ts` (canCreateProject, canEditProject); komponen
// ini tidak menulis aturan role. Izin diperiksa ulang saat menyimpan terhadap snapshot store terbaru, karena data bisa
// berubah antara dialog dibuka dan disimpan. Representasi UI di atas data mock, BUKAN otorisasi.
//
// Tambah: kode otomatis (J7), progres awal 0, tanpa Admin Kantor penanggung jawab (penetapan = U4-7); lalu
// `router.push` ke detail proyek baru dengan penanda `?dibuat=1` untuk pesan sukses (simulasi).
// Ubah: hanya field di `ProjectEditInput`; kode, relasi (Admin, anggota, tugas), dan progres tidak tersentuh.
// Latensi simulasi (`lib/simulate-latency.ts`) memperlihatkan keadaan memuat; kirim ganda dicegah penjaga `ref`.

import * as React from "react";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/components/auth/use-current-user";
import { ProjectForm } from "@/components/projects/project-form";
import { DemoDataNotice } from "@/components/ui/demo-data-notice";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { canCreateProject, canEditProject, isProjectReadOnly } from "@/lib/access";
import { DENY_REASON_LABELS } from "@/lib/labels";
import { createProject, getMockStoreSnapshot, updateProject } from "@/lib/mock-store";
import { EMPTY_PROJECT_VALUES, type ProjectFormValues } from "@/lib/project-validation";
import { simulateLatency } from "@/lib/simulate-latency";
import type { Project } from "@/types";

type ProjectFormDialogProps =
  | { mode: "create"; trigger: React.ReactElement; project?: undefined; onSaved?: undefined }
  | { mode: "edit"; trigger: React.ReactElement; project: Project; onSaved?: (project: Project) => void };

const toValues = (project: Project): ProjectFormValues => ({
  name: project.name,
  client: project.client,
  location: project.location,
  startDate: project.startDate,
  endDate: project.endDate,
  // Arsip tidak dapat dipilih; proyek Arsip memang tidak dapat diubah, jadi nilai ini tidak pernah dipakai untuknya.
  status: isProjectReadOnly(project) ? "DRAFT" : project.status,
  description: project.description,
});

function ProjectFormDialog(props: ProjectFormDialogProps) {
  const { mode, trigger } = props;
  const router = useRouter();
  const current = useCurrentUser();
  const actor = current.status === "ready" ? current.user : null;
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  // Penjaga kirim ganda: state `submitting` baru terlihat setelah render, sehingga dua klik dalam satu tick bisa lolos.
  const busyRef = React.useRef(false);

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    setOpen(next);
    if (!next) setFormError(null);
  };

  const fail = (message: string) => {
    busyRef.current = false;
    setFormError(message);
    setSubmitting(false);
  };

  async function handleSubmit(values: ProjectFormValues) {
    if (busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    setFormError(null);
    await simulateLatency();

    if (props.mode === "create") {
      if (!canCreateProject(actor)) return fail(DENY_REASON_LABELS.ROLE);
      const created = createProject({ ...values, progress: 0 });
      busyRef.current = false;
      setSubmitting(false);
      setOpen(false);
      router.push(`/proyek/${created.id}?dibuat=1`);
      return;
    }

    const latest = getMockStoreSnapshot().projects.find((p) => p.id === props.project.id);
    if (!latest) return fail("Proyek ini sudah tidak ada di data demo.");
    if (!canEditProject(actor, latest)) {
      return fail(isProjectReadOnly(latest) ? DENY_REASON_LABELS.ARCHIVED : DENY_REASON_LABELS.ROLE);
    }
    const saved = updateProject(latest.id, values);
    if (!saved) return fail(DENY_REASON_LABELS.ARCHIVED);
    busyRef.current = false;
    setSubmitting(false);
    setOpen(false);
    props.onSaved?.(saved);
  }

  const title = mode === "create" ? "Tambah proyek" : "Ubah proyek";
  const description =
    mode === "create"
      ? "Isi data dasar proyek. Kode proyek dibuat otomatis. Admin Kantor penanggung jawab ditetapkan terpisah."
      : "Perbarui data proyek. Kode proyek, tim, dan tugas tidak berubah.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-2xl" data-dialog={`project-${mode}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DemoDataNotice />
        <ProjectForm
          mode={mode}
          initialValues={props.mode === "edit" ? toValues(props.project) : EMPTY_PROJECT_VALUES}
          submitting={submitting}
          formError={formError}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export { ProjectFormDialog };
