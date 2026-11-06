"use client";

// Form proyek (U4-6): dipakai untuk tambah dan ubah. Hanya UI: tidak membaca atau menulis store; penyimpanan dan
// pemeriksaan izin dilakukan pemanggil (`project-form-dialog.tsx`). Tanpa field penunjukan Admin Kantor (U4-7).
//
// Wajib: nama dan klien. Opsional: lokasi, tanggal, deskripsi. Arsip tidak ada di pilihan status (J7).
// Aksesibilitas: setiap kontrol berlabel, galat tertaut ke kontrol lewat `aria-describedby` (FormField), fokus
// pindah ke galat pertama sesuai urutan tampilan, kontrol dikunci selama menyimpan.
// Ukuran: kontrol `touch` (44px, font 16px) agar nyaman di ponsel; di `lg` kembali ke ukuran bawaan.

import * as React from "react";

import { FormField } from "@/components/auth/form-field";
import { FIELD_TOUCH } from "@/components/auth/touch-classes";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_OPTIONS } from "@/lib/labels";
import {
  normalizeProjectValues,
  PROJECT_FORM_FIELD_ORDER,
  PROJECT_LIMITS,
  validateProjectForm,
  type ProjectFormErrors,
  type ProjectFormValues,
} from "@/lib/project-validation";
import type { ProjectStatus } from "@/types";

// ID kontrol unik per instans form (React.useId): Next.js 16 menyimpan halaman sebelumnya tersembunyi di DOM, sehingga dua form
// (mis. dialog tambah di daftar dan dialog ubah di detail) bisa ada bersamaan. ID tetap akan membuat label tertaut ke kontrol
// yang salah. Nama field (atribut `name`) tetap stabil dan dipakai untuk fokus galat di dalam form ini saja.
const fieldIds = (uid: string) =>
  ({
    name: `${uid}-name`,
    client: `${uid}-client`,
    location: `${uid}-location`,
    startDate: `${uid}-start-date`,
    endDate: `${uid}-end-date`,
    status: `${uid}-status`,
    description: `${uid}-description`,
  }) as const;

type ProjectFormProps = {
  mode: "create" | "edit";
  initialValues: ProjectFormValues;
  submitting: boolean;
  /** Galat tingkat form (mis. izin berubah saat menyimpan). Tampil sebagai peringatan, bukan galat satu field. */
  formError?: string | null;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel: () => void;
};

function ProjectForm({ mode, initialValues, submitting, formError, onSubmit, onCancel }: ProjectFormProps) {
  const [values, setValues] = React.useState<ProjectFormValues>(initialValues);
  const [errors, setErrors] = React.useState<ProjectFormErrors>({});
  const formRef = React.useRef<HTMLFormElement>(null);
  const FIELD_ID = fieldIds(`project-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`);

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validateProjectForm(values);
    setErrors(nextErrors);
    const firstInvalid = PROJECT_FORM_FIELD_ORDER.find((key) => nextErrors[key]);
    if (firstInvalid) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus());
      return;
    }
    onSubmit(normalizeProjectValues(values));
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} data-slot="project-form" data-mode={mode} className="flex flex-col gap-5">
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField id={FIELD_ID.name} label="Nama proyek" required error={errors.name}>
            {(control) => (
              <Input
                {...control}
                size="touch"
                className={FIELD_TOUCH}
                name="name"
                autoComplete="off"
                autoFocus
                placeholder="Contoh: Renovasi Gedung Kantor Batam"
                value={values.name}
                disabled={submitting}
                onChange={(e) => set("name", e.target.value)}
              />
            )}
          </FormField>
        </div>

        <FormField id={FIELD_ID.client} label="Klien" required error={errors.client}>
          {(control) => (
            <Input
              {...control}
              size="touch"
              className={FIELD_TOUCH}
              name="client"
              autoComplete="off"
              placeholder="Nama klien atau pemilik pekerjaan"
              value={values.client}
              disabled={submitting}
              onChange={(e) => set("client", e.target.value)}
            />
          )}
        </FormField>

        <FormField id={FIELD_ID.location} label="Lokasi (opsional)" error={errors.location}>
          {(control) => (
            <Input
              {...control}
              size="touch"
              className={FIELD_TOUCH}
              name="location"
              autoComplete="off"
              placeholder="Contoh: Batam, Kepulauan Riau"
              value={values.location}
              disabled={submitting}
              onChange={(e) => set("location", e.target.value)}
            />
          )}
        </FormField>

        <FormField id={FIELD_ID.startDate} label="Tanggal mulai (opsional)" error={errors.startDate}>
          {(control) => (
            <Input
              {...control}
              type="date"
              size="touch"
              className={FIELD_TOUCH}
              name="startDate"
              value={values.startDate}
              disabled={submitting}
              onChange={(e) => set("startDate", e.target.value)}
            />
          )}
        </FormField>

        <FormField id={FIELD_ID.endDate} label="Tanggal selesai (opsional)" error={errors.endDate}>
          {(control) => (
            <Input
              {...control}
              type="date"
              size="touch"
              className={FIELD_TOUCH}
              name="endDate"
              value={values.endDate}
              disabled={submitting}
              onChange={(e) => set("endDate", e.target.value)}
            />
          )}
        </FormField>

        <FormField
          id={FIELD_ID.status}
          label="Status"
          required
          error={errors.status}
          hint={mode === "create" ? "Proyek baru dimulai dari Draf. Status Arsip tidak dapat dipilih." : "Status Arsip tidak dapat dipilih."}
        >
          {(control) => (
            <Select
              {...control}
              size="touch"
              className={FIELD_TOUCH}
              name="status"
              value={values.status}
              disabled={submitting}
              onChange={(e) => set("status", e.target.value as ProjectStatus)}
            >
              {PROJECT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {PROJECT_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <div className="sm:col-span-2">
          <FormField
            id={FIELD_ID.description}
            label="Deskripsi (opsional)"
            error={errors.description}
            hint={`Ringkasan pekerjaan. Maksimal ${PROJECT_LIMITS.descriptionMax.toLocaleString("id-ID")} karakter.`}
          >
            {(control) => (
              <Textarea
                {...control}
                size="touch"
                name="description"
                rows={4}
                value={values.description}
                disabled={submitting}
                onChange={(e) => set("description", e.target.value)}
              />
            )}
          </FormField>
        </div>
      </div>

      {formError ? (
        <FieldError role="alert" aria-live="assertive" data-slot="project-form-error">
          {formError}
        </FieldError>
      ) : null}

      <div data-slot="dialog-footer" className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="touch" disabled={submitting} onClick={onCancel} className="w-full sm:w-auto">
          Batal
        </Button>
        <Button type="submit" size="touch" loading={submitting} className="w-full sm:w-auto">
          {mode === "create" ? "Simpan proyek" : "Simpan perubahan"}
        </Button>
      </div>
    </form>
  );
}

export { ProjectForm };
export type { ProjectFormProps };
