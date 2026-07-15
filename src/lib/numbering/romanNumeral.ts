const MONTH_ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

/** Konversi angka bulan (1-12) ke angka Romawi sesuai format nomor surat. */
export function toRomanMonth(month: number): string {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Bulan harus antara 1-12, diterima: ${month}`);
  }
  return MONTH_ROMAN[month - 1];
}
