"use client";

// Tab "Tim" di detail proyek: susunan tim (U4-5) dan kelola anggota serta Admin penanggung jawab (U4-7).
// Arah visual "papan jabatan": Admin penanggung jawab selalu BARIS PERTAMA dengan latar Warm Highlight (token `accent`) plus
// teks "Penanggung jawab" (tidak hanya warna); bila kosong tampil slot bergaris putus-putus. Aksi berada di dekat objeknya
// (Ganti/Cabut di baris Admin, Keluarkan di baris anggota, Tambah di kepala panel) dan selalu terlihat (tanpa hover).
//
// Hak datang SEPENUHNYA dari `access.ts`; komponen ini tidak menulis aturan role:
// - Tambah anggota                → `canAddProjectMember` (Owner, Admin principal proyek itu; bukan Arsip)
// - Keluarkan dari proyek          → `canRemoveProjectMembers` (Owner; bukan Arsip) + keputusan per anggota di dialog
// - Tetapkan/Ganti/Cabut Admin     → `canAssignAdminPrincipal` (Owner; bukan Arsip)
// - email                          → `showEmail` dari pemanggil (`canViewOrgUsers`; Mandor tanpa email)
// Dialog dirender di TINGKAT PANEL (bukan di dalam baris) dan dipasang saat dibuka, sehingga keadaan saat dibuka dibekukan dan
// dialog tetap ada walau barisnya hilang karena data berubah (stale); setiap aksi diperiksa ulang terhadap snapshot store
// terbaru saat menyimpan. Representasi UI di atas data mock (memori tab), BUKAN otorisasi server. `data-slot` lama (U4-5)
// dipertahankan karena dipakai pengujian.

import * as React from "react";
import { CircleCheck, UserPlus, Users, X } from "lucide-react";

import { ProjectAdminDialog, ProjectAdminRevokeDialog, type AdminChange } from "@/components/projects/project-admin-dialog";
import { ProjectMemberAddDialog } from "@/components/projects/project-member-add-dialog";
import { ProjectMemberRemoveDialog } from "@/components/projects/project-member-remove-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RecordCard, RecordCardList } from "@/components/ui/record-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canAddProjectMember, canAssignAdminPrincipal, canRemoveProjectMembers, type Actor } from "@/lib/access";
import { getTeamSuccessText, ROLE_LABELS, ROLE_TONES } from "@/lib/labels";
import type { MockStoreState } from "@/lib/mock-store";
import { getProjectTeam, type TeamEntry } from "@/lib/project-relations";
import type { Project, User } from "@/types";

type OpenDialog =
  | { kind: "add" }
  | { kind: "remove"; user: User }
  | { kind: "assign" }
  | { kind: "replace" }
  | { kind: "revoke"; user: User };

const HEADING = "#tim-proyek";

/**
 * Fokus ke elemen TERLIHAT pertama yang cocok dari daftar selektor (tabel dan kartu sama-sama ada di DOM; hanya satu yang tampil).
 * Base UI juga mengembalikan fokus setelah animasi tutup; bila pemicu sudah hilang, fokus jatuh ke <body>. Karena itu dicoba di
 * frame berikutnya lalu sekali lagi setelah animasi bila fokus masih hilang.
 */
const isShown = (el: HTMLElement): boolean =>
  // `checkVisibility` belum ada di Safari < 17.4 / WebView lama; cadangan: elemen tersembunyi (display:none) tanpa kotak layout.
  typeof el.checkVisibility === "function" ? el.checkVisibility() : el.getClientRects().length > 0;

function focusFirstVisible(root: HTMLElement | null, selectors: readonly string[]) {
  const run = () => {
    if (!root?.isConnected) return; // panel sudah dilepas (pindah tab/halaman): jangan memindahkan fokus
    for (const selector of selectors) {
      const el = [...root.querySelectorAll<HTMLElement>(selector)].find(isShown);
      if (el) {
        el.focus();
        return;
      }
    }
  };
  requestAnimationFrame(run);
  window.setTimeout(() => {
    if (!document.activeElement || document.activeElement === document.body) run();
  }, 320);
}

function TeamNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div data-slot="team-notice" className="flex items-start gap-2 rounded-md border border-success/30 bg-success-soft p-3 text-sm text-foreground">
      <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
      <p className="min-w-0 flex-1">{message}</p>
      <Button variant="ghost" size="icon" aria-label="Tutup pesan" onClick={onDismiss} className="-m-2.5 size-11 shrink-0">
        <X aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

function RoleCell({ entry }: { entry: TeamEntry }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Badge variant={ROLE_TONES[entry.user.role]}>{ROLE_LABELS[entry.user.role]}</Badge>
      {entry.isAdminPrincipal ? <Badge variant="neutral">Penanggung jawab</Badge> : null}
    </span>
  );
}

type ProjectTeamPanelProps = {
  project: Project;
  actor: Actor;
  data: MockStoreState;
  showEmail: boolean;
};

function ProjectTeamPanel({ project, actor, data, showEmail }: ProjectTeamPanelProps) {
  const team = getProjectTeam(project, data);
  const admin = team.find((e) => e.isAdminPrincipal)?.user;
  const memberCount = team.filter((e) => !e.isAdminPrincipal).length;
  const canAdd = canAddProjectMember(actor, project);
  const canRemove = canRemoveProjectMembers(actor, project);
  const canManageAdmin = canAssignAdminPrincipal(actor, project);
  const showActionColumn = canRemove || canManageAdmin;

  const rootRef = React.useRef<HTMLElement>(null);
  const [dialog, setDialog] = React.useState<OpenDialog | null>(null);
  // Tujuan fokus setelah dialog ditutup: tombol asal; setelah sukses, tujuan yang relevan (mis. "Ganti Admin" setelah Tetapkan).
  const focusAfterClose = React.useRef<string[]>([HEADING]);
  const [notice, setNotice] = React.useState<string | null>(null);

  // Dikosongkan dulu lalu diisi pada frame berikutnya, agar pesan yang sama tetap diumumkan pembaca layar.
  const announce = (message: string) => {
    setNotice(null);
    requestAnimationFrame(() => setNotice(message));
  };
  const open = (next: OpenDialog, origin: string) => {
    focusAfterClose.current = [origin, HEADING];
    setDialog(next);
  };
  const handleOpenChange = (next: boolean) => {
    if (next) return;
    setDialog(null);
    focusFirstVisible(rootRef.current, focusAfterClose.current);
  };

  const onAdded = (user: User) => announce(getTeamSuccessText("member-added", { name: user.name }));
  const onRemoved = (user: User) => {
    focusAfterClose.current = [HEADING];
    announce(getTeamSuccessText("member-removed", { name: user.name }));
  };
  const onAdminSaved = (change: AdminChange) => {
    focusAfterClose.current = ['[data-action="replace-admin"]', HEADING];
    announce(getTeamSuccessText(change.kind, change));
  };
  const onAdminRevoked = (user: User) => {
    focusAfterClose.current = ['[data-action="assign-admin"]', HEADING];
    announce(getTeamSuccessText("admin-revoked", { name: user.name }));
  };

  // Ukuran tombol: kartu (di bawah lg, alur sentuh) memakai target 44px; tabel (lg ke atas, desktop) ukuran bawaan.
  // Tombol baris sengaja NETRAL (outline tanpa merah): tiga atau lebih tombol merah per tabel menjadikan aksi destruktif elemen
  // paling mencolok. Penekanan destruktif ada di dialog konfirmasi (tombol merah), tempat keputusan diambil.
  const btn = (touch: boolean) => ({
    variant: "outline" as const,
    size: touch ? ("touch" as const) : ("md" as const),
    className: touch ? "w-full sm:w-auto" : undefined,
  });

  const rowActions = (entry: TeamEntry, touch: boolean) => {
    const { user } = entry;
    if (entry.isAdminPrincipal) {
      if (!canManageAdmin) return null;
      return (
        <>
          <Button {...btn(touch)} data-action="replace-admin" data-user-id={user.id} onClick={() => open({ kind: "replace" }, '[data-action="replace-admin"]')}>
            Ganti Admin<span className="sr-only"> {user.name}</span>
          </Button>
          <Button {...btn(touch)} data-action="revoke-admin" data-user-id={user.id} onClick={() => open({ kind: "revoke", user }, '[data-action="revoke-admin"]')}>
            Cabut Admin<span className="sr-only"> {user.name}</span>
          </Button>
        </>
      );
    }
    if (!canRemove) return null;
    const origin = `[data-action="remove-member"][data-user-id="${user.id}"]`;
    return (
      <Button {...btn(touch)} data-action="remove-member" data-user-id={user.id} onClick={() => open({ kind: "remove", user }, origin)}>
        Keluarkan dari proyek<span className="sr-only"> {user.name}</span>
      </Button>
    );
  };

  // Slot Admin kosong: Owner (bukan Arsip) melihat tombol Tetapkan; peran lain hanya melihat keterangan bila tim berisi anggota.
  const showVacantSlot = !admin && (canManageAdmin || team.length > 0);

  return (
    <section ref={rootRef} aria-labelledby="tim-proyek" data-slot="project-team" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          {/* Fokus programatik (tabIndex -1) setelah anggota dikeluarkan; judul bukan kontrol, jadi cincin fokus disembunyikan. */}
          <h2 id="tim-proyek" tabIndex={-1} style={{ outline: "none" }} className="text-base font-semibold text-foreground">
            Tim proyek
          </h2>
          <p className="text-sm text-muted-foreground">{team.length} orang terdaftar di proyek ini.</p>
        </div>
        {canAdd ? (
          <div data-slot="team-actions" className="flex shrink-0">
            <Button size="touch" className="w-full sm:w-auto" data-action="add-member" onClick={() => open({ kind: "add" }, '[data-action="add-member"]')}>
              <UserPlus aria-hidden="true" className="size-4" />
              Tambah anggota
            </Button>
          </div>
        ) : null}
      </div>

      {/* Pengumum selalu ada (sr-only); banner visual tanpa role agar tidak diumumkan dua kali. */}
      <p role="status" data-slot="team-notice-region" className="sr-only">
        {notice ?? ""}
      </p>
      {notice ? (
        <TeamNotice
          message={notice}
          onDismiss={() => {
            setNotice(null);
            focusFirstVisible(rootRef.current, [HEADING]);
          }}
        />
      ) : null}

      {showVacantSlot ? (
        <div data-slot="admin-vacant" className="flex flex-col gap-3 rounded-lg border border-dashed border-input p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground">Admin Kantor penanggung jawab belum ditetapkan.</p>
          {canManageAdmin ? (
            <Button variant="outline" size="touch" className="w-full shrink-0 sm:w-auto" data-action="assign-admin" onClick={() => open({ kind: "assign" }, '[data-action="assign-admin"]')}>
              Tetapkan Admin
            </Button>
          ) : null}
        </div>
      ) : null}

      {team.length === 0 ? (
        <Card data-slot="project-team-empty">
          <EmptyState
            icon={<Users aria-hidden="true" />}
            title="Belum ada tim di proyek ini"
            description={
              canAdd
                ? "Tetapkan Admin penanggung jawab dan tambahkan Mandor atau Anggota Tim dengan tombol di atas."
                : "Belum ada Admin Kantor penanggung jawab atau anggota yang terdaftar di proyek ini."
            }
          />
        </Card>
      ) : (
        <>
          <RecordCardList label="Daftar tim proyek" data-slot="project-team-cards">
            {team.map((entry) => (
              <RecordCard
                key={entry.user.id}
                title={entry.user.name}
                data-user-id={entry.user.id}
                data-admin-principal={entry.isAdminPrincipal || undefined}
                className={entry.isAdminPrincipal ? "bg-accent" : undefined}
                fields={[
                  { label: "Peran", value: <RoleCell entry={entry} /> },
                  ...(showEmail ? [{ label: "Email", value: entry.user.email }] : []),
                ]}
                actions={showActionColumn ? rowActions(entry, true) : undefined}
              />
            ))}
          </RecordCardList>
          <div data-slot="project-team-table" className="hidden lg:block">
            <Table label="Tabel tim proyek">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nama</TableHead>
                  <TableHead>Peran</TableHead>
                  {showEmail ? <TableHead>Email</TableHead> : null}
                  {showActionColumn ? <TableHead>Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((entry) => (
                  <TableRow
                    key={entry.user.id}
                    data-slot="project-team-row"
                    data-user-id={entry.user.id}
                    data-admin-principal={entry.isAdminPrincipal || undefined}
                    className={entry.isAdminPrincipal ? "bg-accent hover:bg-accent" : undefined}
                  >
                    <TableCell className="min-w-48 font-medium text-foreground">{entry.user.name}</TableCell>
                    <TableCell>
                      <RoleCell entry={entry} />
                    </TableCell>
                    {showEmail ? <TableCell className="break-all">{entry.user.email}</TableCell> : null}
                    {showActionColumn ? (
                      <TableCell>
                        <div className="flex flex-wrap gap-2">{rowActions(entry, false)}</div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {admin && memberCount === 0 ? (
            <p data-slot="team-no-members" className="text-sm text-muted-foreground">
              Belum ada Mandor atau Anggota Tim di proyek ini.
            </p>
          ) : null}
        </>
      )}

      {/* Dialog tim: satu pada satu waktu, dipasang saat dibuka (keadaan saat dibuka dibekukan). */}
      {dialog?.kind === "add" ? <ProjectMemberAddDialog project={project} open onOpenChange={handleOpenChange} onAdded={onAdded} /> : null}
      {dialog?.kind === "remove" ? (
        <ProjectMemberRemoveDialog project={project} member={dialog.user} open onOpenChange={handleOpenChange} onRemoved={onRemoved} />
      ) : null}
      {dialog?.kind === "assign" || dialog?.kind === "replace" ? (
        <ProjectAdminDialog project={project} mode={dialog.kind} open onOpenChange={handleOpenChange} onSaved={onAdminSaved} />
      ) : null}
      {dialog?.kind === "revoke" ? (
        <ProjectAdminRevokeDialog project={project} admin={dialog.user} open onOpenChange={handleOpenChange} onRevoked={onAdminRevoked} />
      ) : null}
    </section>
  );
}

export { ProjectTeamPanel };
