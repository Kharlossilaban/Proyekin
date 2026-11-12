"use client";

// Dialog "Tambah anggota proyek" (U4-7). Hak datang SEPENUHNYA dari `access.ts`: tombol pemicu hanya dirender pemanggil bila
// `canAddProjectMember` (Owner atau Admin principal proyek itu, bukan Arsip), dan SAAT MENYIMPAN keputusan dihitung ulang
// (`decideAddProjectMember`) terhadap snapshot store terbaru, karena data atau hak bisa berubah selama dialog terbuka.
// Kandidat hanya Mandor/Anggota Tim yang belum menjadi anggota (`getProjectMemberCandidates`); tanpa email.
// Representasi UI di atas data mock (memori tab), BUKAN otorisasi server.

import * as React from "react";

import { useCurrentUser } from "@/components/auth/use-current-user";
import { FIELD_TOUCH } from "@/components/auth/touch-classes";
import { Button } from "@/components/ui/button";
import { DemoDataNotice } from "@/components/ui/demo-data-notice";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldError, FieldHint, Label } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { decideAddProjectMember, getProjectMemberCandidates } from "@/lib/access";
import { getTeamActionFailureText, ROLE_LABELS, TEAM_GENERIC_ERROR, TEAM_VALIDATION_TEXT } from "@/lib/labels";
import { addProjectMember, getMockStoreSnapshot } from "@/lib/mock-store";
import { PROJECT_MEMBER_ROLES } from "@/lib/roles";
import { simulateLatency } from "@/lib/simulate-latency";
import { useMockStore } from "@/lib/use-mock-store";
import type { Project, User } from "@/types";

type ProjectMemberAddDialogProps = {
  project: Project;
  /** Dialog dikendalikan panel Tim (dirender di tingkat panel agar tetap ada walau pemicunya hilang karena data berubah). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dipanggil setelah anggota benar-benar tersimpan di store. */
  onAdded: (user: User) => void;
};

/** Dipasang (mount) oleh panel saat dibuka; state awal = keadaan saat dibuka. */
function ProjectMemberAddDialog({ project, open, onOpenChange, onAdded }: ProjectMemberAddDialogProps) {
  const current = useCurrentUser();
  const actor = current.status === "ready" ? current.user : null;
  const data = useMockStore();
  const [selected, setSelected] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  // Penjaga kirim ganda: state `submitting` baru terlihat setelah render, sehingga dua klik dalam satu tick bisa lolos.
  const busyRef = React.useRef(false);
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const id = `anggota-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Kandidat dihitung dari store terkini: bila pilihan berubah menjadi tidak tersedia (mis. sudah ditambahkan), pilihan
  // dikosongkan dan pengguna diberi tahu, bukan dikirim dengan data lama.
  const candidates = getProjectMemberCandidates(project, data);
  const selectedStillAvailable = candidates.some((u) => u.id === selected);
  const staleSelection = selected !== "" && !selectedStillAvailable && !submitting;
  const value = selectedStillAvailable ? selected : "";
  const groups = PROJECT_MEMBER_ROLES.map((role) => ({ role, users: candidates.filter((u) => u.role === role) })).filter((g) => g.users.length > 0);

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
      setFieldError(TEAM_VALIDATION_TEXT.member);
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
    const user = fresh.users.find((u) => u.id === value);
    if (!latest) return fail(getTeamActionFailureText("PROJECT_NOT_FOUND"));
    const decision = decideAddProjectMember(actor, latest, value, fresh);
    if (!decision.allowed) return fail(getTeamActionFailureText(decision.reason, { memberName: user?.name }));
    const added = addProjectMember(latest.id, value);
    if (!added || !user) return fail(TEAM_GENERIC_ERROR);
    busyRef.current = false;
    setSubmitting(false);
    onAdded(user);
    onOpenChange(false);
  }

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hintId, fieldError || staleSelection ? errorId : null].filter(Boolean).join(" ");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-dialog="member-add" showClose={!submitting}>
        <DialogHeader>
          <DialogTitle>Tambah anggota proyek</DialogTitle>
          <DialogDescription>
            Pilih Mandor atau Anggota Tim untuk proyek {project.code} {project.name}.
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 && !submitting ? (
          <>
            <p data-slot="member-add-empty" className="text-sm text-foreground">
              Semua Mandor dan Anggota Tim sudah terdaftar di proyek ini.
            </p>
            {formError ? (
              <FieldError role="alert" data-slot="member-add-error">
                {formError}
              </FieldError>
            ) : null}
            <DialogFooter className="[&>button]:w-full sm:[&>button]:w-auto">
              <DialogClose render={<Button size="touch" />}>Tutup</DialogClose>
            </DialogFooter>
          </>
        ) : (
          <form noValidate onSubmit={handleSubmit} data-slot="member-add-form" className="flex flex-col gap-4">
            <DemoDataNotice />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id} required>
                Anggota
              </Label>
              <Select
                ref={selectRef}
                id={id}
                name="anggota"
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
                <option value="">Pilih Mandor atau Anggota Tim</option>
                {groups.map((g) => (
                  <optgroup key={g.role} label={ROLE_LABELS[g.role]}>
                    {g.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <FieldHint id={hintId}>
                Mandor dapat melihat proyek ini, semua tugasnya, dan susunan tim. Anggota Tim hanya melihat tugas miliknya.
              </FieldHint>
              {fieldError || staleSelection ? (
                <FieldError id={errorId}>
                  {fieldError ?? "Pilihan sebelumnya sudah tidak tersedia. Pilih lagi."}
                </FieldError>
              ) : null}
            </div>

            {formError ? (
              <FieldError role="alert" aria-live="assertive" data-slot="member-add-error">
                {formError}
              </FieldError>
            ) : null}

            <div data-slot="dialog-footer" className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" size="touch" disabled={submitting} onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
                Batal
              </Button>
              <Button type="submit" size="touch" loading={submitting} className="w-full sm:w-auto" data-action="submit-add-member">
                Tambahkan ke proyek
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { ProjectMemberAddDialog };
