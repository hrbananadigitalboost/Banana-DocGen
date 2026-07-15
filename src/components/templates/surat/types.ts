export type SuratTemplateProps = {
  nomorSuratFull: string;
  tanggalSurat: Date;
  values: Record<string, string>;
  /** Nama penerima yang sudah diresolusi dari employeeRef/clientRef/manual. */
  penerimaNama: string;
  /** Hanya terisi kalau penerima adalah karyawan (dari MasterKaryawan). */
  penerimaJabatan?: string | null;
  penerimaDivisi?: string | null;
  signatoryNama: string;
  signatoryJabatan: string;
  signatureImageUrl: string;
  stampImageUrl?: string | null;
  qrDataUrl?: string | null;
};
