import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { COLORS, RADIUS, SPACING, SHADOW } from "./tokens";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(idDate: string): string {
  const date = new Date(idDate);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(idDate: string): string {
  const date = new Date(idDate);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function cnColor(color: string, shade: number = 600): string {
  return COLORS.green[shade as keyof typeof COLORS.green];
}

export function truncate(str: string, len: number): string {
  if (!str || str.length <= len) return str;
  return str.slice(0, len) + "...";
}

export function fileBytesToSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function getStatusLabel(key: string, lang: "id" | "en" = "id"): string {
  const map: Record<string, Record<string, string>> = {
    project: {
      DRAFT: "Draf",
      ON_PROGRESS: "Berjalan",
      PAUSED: "Tertunda",
      COMPLETED: "Selesai",
      ARCHIVED: "Arsip",
    },
    task: {
      TODO: "Belum Dimulai",
      IN_PROGRESS: "Dalam Progress",
      DONE: "Selesai",
    },
    report: {
      DRAFT: "Draft",
      SUBMITTED: "Terkirim",
      APPROVED: "Disetujui",
      REJECTED: "Ditolak",
    },
    document: {
      PUBLIK: "Publik",
      PRIVAT: "Privat",
      ARKIP: "Arsip",
    },
  };
  return map[lang === "en" ? "project" : "project"][key] || key;
}

export function cnTw(...classes: string[]): string {
  return twMerge(clsx(classes));
}
