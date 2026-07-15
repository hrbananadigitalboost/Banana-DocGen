const TINGKAT_LABEL: Record<string, string> = {
  I: "PERTAMA (SP 1)",
  II: "KEDUA (SP 2)",
  III: "KETIGA (SP 3)",
};

const TINGKAT_SINGKAT: Record<string, string> = {
  I: "SP 1",
  II: "SP 2",
  III: "SP 3",
};

/** "I" -> "PERTAMA (SP 1)", dst. Dipakai di judul & kalimat pembuka surat. */
export function tingkatPeringatanLabel(tingkat: string): string {
  return TINGKAT_LABEL[tingkat] ?? tingkat;
}

export function tingkatPeringatanSingkat(tingkat: string): string {
  return TINGKAT_SINGKAT[tingkat] ?? tingkat;
}

/** Deskripsi eskalasi kalau pelanggaran berulang selama masa berlaku SP ini. */
export function eskalasiBerikutnya(tingkat: string): string {
  if (tingkat === "I") return "Surat Peringatan Kedua (SP 2)";
  if (tingkat === "II") return "Surat Peringatan Ketiga (SP 3)";
  return "tindakan lebih lanjut sesuai ketentuan perusahaan, termasuk kemungkinan pemutusan hubungan kerja";
}
