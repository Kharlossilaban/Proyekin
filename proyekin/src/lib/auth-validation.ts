// Validasi form auth (sisi klien, murni UI). Validasi sesungguhnya wajib diulang di backend.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "Minimal 8 karakter", test: (v) => v.length >= 8 },
  { id: "upper", label: "Satu huruf besar", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "Satu huruf kecil", test: (v) => /[a-z]/.test(v) },
  { id: "digit", label: "Satu angka", test: (v) => /\d/.test(v) },
];

export function validateName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Nama lengkap wajib diisi.";
  if (v.length < 2) return "Nama lengkap minimal 2 karakter.";
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const v = value.trim();
  if (!v) return "Alamat email wajib diisi.";
  if (!EMAIL_PATTERN.test(v)) return "Format email tidak valid. Contoh: nama@perusahaan.co.id";
  return undefined;
}

export function validateRequiredPassword(value: string): string | undefined {
  if (!value) return "Kata sandi wajib diisi.";
  return undefined;
}

export function validateNewPassword(value: string): string | undefined {
  if (!value) return "Kata sandi wajib diisi.";
  if (!PASSWORD_RULES.every((rule) => rule.test(value))) {
    return "Kata sandi belum memenuhi semua kriteria.";
  }
  return undefined;
}

export function validateConfirmation(password: string, confirmation: string): string | undefined {
  if (!confirmation) return "Konfirmasi kata sandi wajib diisi.";
  if (confirmation !== password) return "Konfirmasi kata sandi tidak cocok.";
  return undefined;
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}
