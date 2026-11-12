"use client";

// Admin Kantor penanggung jawab proyek (Admin principal, U4-7): TETAPKAN (proyek tanpa Admin), GANTI, dan CABUT.
// Owner saja (`canAssignAdminPrincipal` menentukan apakah pemicu dirender pemanggil). Satu Admin per proyek: penggantian adalah
// SATU perubahan field (`setProjectAdmin`), jadi proyek tidak pernah memiliki dua Admin. Mencabut hanya menghapus relasi
// Admin principal; akun dan role global Admin Kantor, anggota, dan tugas tidak berubah (keputusan pemilik U4-O10).
//
// Admin yang terlihat saat dialog DIBUKA dibekukan sebagai `expectedAdminId`. Saat menyimpan, keputusan dihitung ulang terhadap
// snapshot store terbaru; bila Admin sudah berubah/dicabut, aksi ditolak (`ADMIN_CHANGED`/`NO_ADMIN`) tanpa mengubah data.
// Representasi UI di atas data mock (memori tab), BUKAN otorisasi server.

import * as React from "react";

import { useCurrentUser } from "@/components/auth/use-current-user";
import { FIELD_TOUCH } from "@/components/auth/touch-classes";
import { describeTeamActionError, TeamActionError } from "@/components/projects/team-action-error";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DemoDataNotice } from "@/components/ui/demo-data-notice";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError, FieldHint, Label } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { decideAssignAdminPrincipal, decideRevokeAdminPrincipal, getAdminReplacementCandidates } from "@/lib/access";
import { getTeamActionFailureText, TEAM_GENERIC_ERROR, TEAM_VALIDATION_TEXT } from "@/lib/labels";
import { getMockStoreSnapshot, setProjectAdmin } from "@/lib/mock-store";
import { getUserName } from "@/lib/project-relations";
import { simulateLatency } from "@/lib/simulate-latency";
import { useMockStore } from "@/lib/use-mock-store";
import type { Project, User } from "@/types";

export type AdminChange = { kind: "admin-assigned" | "admin-replaced"; name: string; previousName?: string };

type ProjectAdminDialogProps = {
  project: Project;
  /** `assign`: proyek belum memiliki Admin. `replace`: mengganti Admin yang sedang menjabat. Ditetapkan panel saat dibuka. */
  mode: "assign" | "replace";
  /** Dialog dikendalikan panel Tim (dirender di tingkat panel agar tetap ada walau pemicunya hilang karena data berubah). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dipanggil setelah perubahan benar-benar tersimpan di store. */
  onSaved: (change: AdminChange) => void;
};

/** Dipasang (mount) oleh panel saat dibuka; Admin yang terlihat saat itu dibekukan sebagai acuan. */
function ProjectAdminDialog({ project, mode, open, onOpenChange, onSaved }: ProjectAdminDialogProps) {
  const current = useCurrentUser();
  const actor = current.status === "ready" ? current.user : null;
  const data = useMockStore();
  const [expectedAdminId] = React.useState<string | undefined>(project.adminId);
  const [selected, setSelected] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const busyRef = React.useRef(false);
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const id = `admin-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const candidates = getAdminReplacementCandidates(project, data);
  const value = candidates.some((u) => u.id === selected) ? selected : "";
  const staleSelection = selected !== "" && value === "" && !submitting;
  const previousName = getUserName(data.users, expectedAdminId) ?? "Admin sebelumnya";
  const chosenName = getUserName(data.users, value);
  const replace = mode === "replace";

  const handleOpenChange = (next: boolean) => {
    if (busyRef.current) return;
    onOpenChange(next);
  };

  const fail = (message: string) => {
    busyRef.current = false;
    setSubmitting(false);
    setFormError(message);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    if (!value) {
      setFieldError(TEAM_VALIDATION_TEXT.admin);
      setFormError(null);
      requestAnimationFrame(() => selectRef.current?.focus());
      return;
    }
    busyRef.current = true;
    setSubmitting(true);
    setFieldError(null);
    setFormError(null);
    await simulateLatency();

    const fresh = getMockStoreSnapshot();
    const latest = fresh.projects.find((p) => p.id === project.id);
    if (!latest) return fail(getTeamActionFailureText("PROJECT_NOT_FOUND"));
    const decision = decideAssignAdminPrincipal(actor, latest, value, expectedAdminId, fresh);
    if (!decision.allowed) {
      return fail(
        getTeamActionFailureText(decision.reason, {
          adminName: getUserName(fresh.users, value),
          currentAdminName: getUserName(fresh.users, latest.adminId),
        }),
      );
    }
    const saved = setProjectAdmin(latest.id, value);
    const name = getUserName(fresh.users, value);
    if (!saved || !name) return fail(TEAM_GENERIC_ERROR);
    busyRef.current = false;
    setSubmitting(false);
    onSaved(replace ? { kind: "admin-replaced", name, previousName } : { kind: "admin-assigned", name });
    onOpenChange(false);
  }

  const consequence = replace
    ? chosenName
      ? `Setelah diganti, ${previousName} tidak lagi dapat membuka proyek ini. ${chosenName} menjadi penanggung jawab dan dapat membuka serta mengubah data proyek ini. Akun dan peran keduanya tidak berubah.`
      : `Setelah diganti, ${previousName} tidak lagi dapat membuka proyek ini. Akun dan perannya tidak berubah.`
    : chosenName
      ? `${chosenName} akan dapat membuka dan mengubah data proyek ini serta menambah anggota.`
      : "Admin yang ditetapkan dapat membuka dan mengubah data proyek ini serta menambah anggota.";
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hintId, fieldError || staleSelection ? errorId : null].filter(Boolean).join(" ");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-dialog={replace ? "admin-replace" : "admin-assign"} showClose={!submitting}>
        <DialogHeader>
          <DialogTitle>{replace ? "Ganti Admin penanggung jawab" : "Tetapkan Admin penanggung jawab"}</DialogTitle>
          <DialogDescription>
            {replace
              ? `Admin saat ini: ${previousName}.`
              : `Pilih Admin Kantor yang bertanggung jawab atas proyek ${project.code} ${project.name}. Satu proyek hanya memiliki satu Admin penanggung jawab.`}
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 && !submitting ? (
          <>
            <p data-slot="admin-empty" className="text-sm text-foreground">
              {replace
                ? `Tidak ada Admin Kantor lain yang dapat dipilih. ${previousName} tetap menjadi Admin penanggung jawab.`
                : "Belum ada pengguna Admin Kantor yang dapat dipilih."}
            </p>
            <DialogFooter className="[&>button]:w-full sm:[&>button]:w-auto">
              <DialogClose render={<Button size="touch" />}>Tutup</DialogClose>
            </DialogFooter>
          </>
        ) : (
          <form noValidate onSubmit={handleSubmit} data-slot="admin-form" className="flex flex-col gap-4">
            <DemoDataNotice />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id} required>
                {replace ? "Admin pengganti" : "Admin Kantor"}
              </Label>
              <Select
                ref={selectRef}
                id={id}
                name="admin"
                size="touch"
                className={FIELD_TOUCH}
                value={value}
                invalid={Boolean(fieldError) || staleSelection}
                aria-required
                aria-describedby={describedBy}
                disabled={submitting}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setFieldError(null);
                  setFormError(null);
                }}
              >
                <option value="">Pilih Admin Kantor</option>
                {candidates.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
              <FieldHint id={hintId} data-slot="admin-consequence">
                {consequence}
              </FieldHint>
              {fieldError || staleSelection ? (
                <FieldError id={errorId}>
                  {fieldError ?? "Pilihan sebelumnya sudah tidak tersedia. Pilih lagi."}
                </FieldError>
              ) : null}
            </div>

            {formError ? (
              <FieldError role="alert" aria-live="assertive" data-slot="admin-error">
                {formError}
              </FieldError>
            ) : null}

            <div data-slot="dialog-footer" className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" size="touch" disabled={submitting} onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
                Batal
              </Button>
              <Button type="submit" size="touch" loading={submitting} className="w-full sm:w-auto" data-action={replace ? "submit-replace-admin" : "submit-assign-admin"}>
                {replace ? "Ganti Admin" : "Tetapkan Admin"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

type ProjectAdminRevokeDialogProps = {
  project: Project;
  /** Admin yang hendak dicabut, sebagaimana terlihat saat dialog dibuka (panel membekukannya). */
  admin: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dipanggil setelah relasi Admin principal benar-benar dicabut di store. */
  onRevoked: (admin: User) => void;
};

/** Konfirmasi "Cabut Admin" (U4-O10). Dipasang (mount) oleh panel saat dibuka. */
function ProjectAdminRevokeDialog({ project, admin: target, open, onOpenChange, onRevoked }: ProjectAdminRevokeDialogProps) {
  const current = useCurrentUser();
  const actor = current.status === "ready" ? current.user : null;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Cabut ${target.name} sebagai Admin penanggung jawab?`}
      description={`${target.name} tidak lagi dapat membuka proyek ${project.code}. Proyek tidak memiliki Admin penanggung jawab sampai Anda menetapkan yang baru. Akun dan peran Admin Kantor ${target.name} tidak berubah, dan anggota serta tugas proyek tetap utuh. Perubahan ini hanya simulasi dan hilang saat halaman dimuat ulang.`}
      confirmLabel="Cabut Admin"
      cancelLabel="Batal"
      errorMessage={describeTeamActionError}
      onConfirm={async () => {
        await simulateLatency();
        const fresh = getMockStoreSnapshot();
        const latest = fresh.projects.find((p) => p.id === project.id);
        if (!latest) throw new TeamActionError("PROJECT_NOT_FOUND");
        const decision = decideRevokeAdminPrincipal(actor, latest, target.id);
        if (!decision.allowed) throw new TeamActionError(decision.reason, { adminName: target.name, currentAdminName: getUserName(fresh.users, latest.adminId) });
        if (!setProjectAdmin(latest.id, null)) throw new TeamActionError("STORE_REFUSED");
        onRevoked(target);
      }}
    />
  );
}

export { ProjectAdminDialog, ProjectAdminRevokeDialog };
