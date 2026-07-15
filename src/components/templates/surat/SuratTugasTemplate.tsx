import { LetterheadLayout } from "./LetterheadLayout";
import { SignatureBlock } from "./SignatureBlock";
import { QrFooter } from "./QrFooter";
import { formatTanggalIndonesia } from "@/lib/format/tanggal";
import type { SuratTemplateProps } from "./types";

export function SuratTugasTemplate({
  nomorSuratFull,
  tanggalSurat,
  values,
  penerimaNama,
  penerimaJabatan,
  penerimaDivisi,
  signatoryNama,
  signatoryJabatan,
  signatureImageUrl,
  stampImageUrl,
  qrDataUrl,
}: SuratTemplateProps) {
  const tanggalFormatted = formatTanggalIndonesia(tanggalSurat);
  const tanggalMulai = values.tanggalMulaiTugas ? new Date(values.tanggalMulaiTugas) : null;
  const tanggalSelesai = values.tanggalSelesaiTugas ? new Date(values.tanggalSelesaiTugas) : null;

  return (
    <LetterheadLayout>
      <p className="text-center text-base font-bold underline">SURAT TUGAS</p>
      <p className="text-center">Nomor: {nomorSuratFull}</p>

      <p className="mt-4">Yang bertanda tangan di bawah ini menugaskan:</p>

      <table className="mt-2 w-full text-sm">
        <tbody>
          <tr>
            <td className="w-32 py-1 align-top">Nama</td>
            <td className="py-1 align-top">: {penerimaNama}</td>
          </tr>
          <tr>
            <td className="py-1 align-top">Jabatan</td>
            <td className="py-1 align-top">: {penerimaJabatan || "-"}</td>
          </tr>
          <tr>
            <td className="py-1 align-top">Divisi</td>
            <td className="py-1 align-top">: {penerimaDivisi || "-"}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2">Untuk melaksanakan tugas sebagai berikut:</p>
      <p className="whitespace-pre-wrap rounded-md border border-slate-200 p-3">
        {values.tugasYangDiberikan || "-"}
      </p>

      <table className="mt-2 w-full text-sm">
        <tbody>
          <tr>
            <td className="w-32 py-1 align-top">Tempat Tugas</td>
            <td className="py-1 align-top">: {values.tempatTugas || "-"}</td>
          </tr>
          <tr>
            <td className="py-1 align-top">Periode Tugas</td>
            <td className="py-1 align-top">
              : {tanggalMulai ? formatTanggalIndonesia(tanggalMulai) : "-"} s/d{" "}
              {tanggalSelesai ? formatTanggalIndonesia(tanggalSelesai) : "-"}
            </td>
          </tr>
        </tbody>
      </table>

      {values.catatanTambahan && (
        <>
          <p className="mt-2">Catatan Tambahan:</p>
          <p className="whitespace-pre-wrap">{values.catatanTambahan}</p>
        </>
      )}

      <p className="mt-2">
        Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab. Setelah
        tugas selesai, yang bersangkutan wajib menyampaikan laporan pelaksanaan tugas kepada atasan
        langsung.
      </p>

      <SignatureBlock
        tempatTanggal={`Jakarta, ${tanggalFormatted}`}
        jabatan={signatoryJabatan}
        nama={signatoryNama}
        signatureImageUrl={signatureImageUrl}
        stampImageUrl={stampImageUrl}
      />

      <QrFooter qrDataUrl={qrDataUrl} />
    </LetterheadLayout>
  );
}
