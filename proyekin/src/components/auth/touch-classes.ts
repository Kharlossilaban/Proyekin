// Kelas target sentuh bersama untuk form autentikasi (login, daftar, lupa sandi, reset sandi).
// Mandor mobile-first: kontrol 44px dengan font 16px di bawah `lg`; di `lg` ke atas kembali PERSIS ke ukuran bawaan U1/U3
// (input 40px/14px, tombol mata 40x40, tautan setinggi teks). Tailwind membaca string utuh di sini, jadi jangan
// menyusun nama kelas secara dinamis.

/** Input: dipakai bersama `size="touch"` (h-11, text-base); `lg:` mengembalikan ukuran bawaan. */
export const FIELD_TOUCH = "lg:h-10 lg:text-sm";

/** Lebar tombol tampil/sembunyikan kata sandi: `PasswordInput size="touch"` memberi w-11; `lg:` mengembalikan w-10. */
export const TOGGLE_TOUCH = "lg:w-10";

/**
 * Tautan di dalam teks atau footer: area sentuh 44px lewat padding yang diimbangi margin negatif, sehingga tata letak
 * dan posisi teks tidak bergeser. Di `lg` kembali ke `inline` tanpa padding.
 */
export const LINK_TOUCH = "inline-block py-3 -my-3 lg:inline lg:py-0 lg:my-0";

/** Label pembungkus checkbox: area sentuh minimal 44px di bawah `lg` (seluruh label dapat diketuk). */
export const CHECKBOX_LABEL_TOUCH = "min-h-11 lg:min-h-0";

/** Kotak checkbox: lebih besar di mobile, kembali size-4 di `lg`. */
export const CHECKBOX_BOX_TOUCH = "size-5 lg:size-4";
