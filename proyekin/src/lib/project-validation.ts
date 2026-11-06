// Validasi form proyek (U4-6, sisi klien, murni UI). Validasi sesungguhnya wajib diulang di backend.
// Wajib: nama dan klien. Opsional (boleh kosong, J7): lokasi, tanggal mulai, tanggal selesai, deskripsi.
// Status hanya dari PROJECT_STATUS_OPTIONS; Arsip tidak dapat dipilih. Kode proyek otomatis, bukan input.

import { PROJECT_STATUS_OPTIONS } from "@/lib/labels";
import type { ProjectStatus } from "@/types";

export const PROJECT_LIMITS = {
  nameMin: 3,
  nameMax: 120,
  clientMax: 120,
  locationMax: 160,
  descriptionMax: 1000,
} as const;

export interface ProjectFormValues {
  name: string;
  client: string;
  location: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  description: string;
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>;

/** Urutan field di form; dipakai agar fokus galat pertama mengikuti urutan tampilan. */
export const PROJECT_FORM_FIELD_ORDER: readonly (keyof ProjectFormValues)[] = [
  "name",
  "client",
  "location",
  "startDate",
  "endDate",
  "status",
  "description",
];

/** Tanggal ISO `yyyy-mm-dd` yang benar-benar ada di kalender. */
function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const formatLimit = (n: number): string => n.toLocaleString("id-ID");

export function validateProjectForm(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {};

  const name = values.name.trim();
  if (!name) errors.name = "Nama proyek wajib diisi.";
  else if (name.length < PROJECT_LIMITS.nameMin) errors.name = `Nama proyek minimal ${PROJECT_LIMITS.nameMin} karakter.`;
  else if (name.length > PROJECT_LIMITS.nameMax) errors.name = `Nama proyek maksimal ${PROJECT_LIMITS.nameMax} karakter.`;

  const client = values.client.trim();
  if (!client) errors.client = "Nama klien wajib diisi.";
  else if (client.length > PROJECT_LIMITS.clientMax) errors.client = `Nama klien maksimal ${PROJECT_LIMITS.clientMax} karakter.`;

  if (values.location.trim().length > PROJECT_LIMITS.locationMax) {
    errors.location = `Lokasi maksimal ${PROJECT_LIMITS.locationMax} karakter.`;
  }

  const start = values.startDate.trim();
  const end = values.endDate.trim();
  if (start && !isValidIsoDate(start)) errors.startDate = "Tanggal mulai tidak valid. Pilih tanggal dari kalender.";
  if (end && !isValidIsoDate(end)) errors.endDate = "Tanggal selesai tidak valid. Pilih tanggal dari kalender.";
  if (!errors.startDate && !errors.endDate && start && end && end < start) {
    errors.endDate = "Tanggal selesai tidak boleh sebelum tanggal mulai.";
  }

  if (!PROJECT_STATUS_OPTIONS.includes(values.status)) errors.status = "Pilih status proyek.";

  if (values.description.trim().length > PROJECT_LIMITS.descriptionMax) {
    errors.description = `Deskripsi maksimal ${formatLimit(PROJECT_LIMITS.descriptionMax)} karakter.`;
  }

  return errors;
}

/** Nilai tersimpan: teks dirapikan (trim); field opsional kosong menjadi string kosong. */
export function normalizeProjectValues(values: ProjectFormValues): ProjectFormValues {
  return {
    name: values.name.trim(),
    client: values.client.trim(),
    location: values.location.trim(),
    startDate: values.startDate.trim(),
    endDate: values.endDate.trim(),
    status: values.status,
    description: values.description.trim(),
  };
}

export const EMPTY_PROJECT_VALUES: ProjectFormValues = {
  name: "",
  client: "",
  location: "",
  startDate: "",
  endDate: "",
  status: "DRAFT",
  description: "",
};
