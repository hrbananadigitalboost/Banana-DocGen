import { LetterheadLayout } from "./LetterheadLayout";
import { SignatureBlock } from "./SignatureBlock";
import { QrFooter } from "./QrFooter";
import { formatTanggalIndonesia } from "@/lib/format/tanggal";
import type { SuratTemplateProps } from "./types";

export function SuratKeteranganTemplate({
  nomorSuratFull,
  tanggalSurat,
  values,
  penerimaNama,
  signatoryNama,
  signatoryJabatan,
  signatureImageUrl,
  stampImageUrl,
  qrDataUrl,
}: SuratTemplateProps) {
  const tanggalFormatted = formatTanggalIndonesia(tanggalSurat);

  return (
    <LetterheadLayout>
      <p className="text-center text-base font-bold underline">SURAT KETERANGAN</p>
      <p className="text-center">Nomor: {nomorSuratFull}</p>

      <p className="mt-4">Yang bertanda tangan di bawah ini menerangkan bahwa:</p>

      <table className="mt-2 w-full text-sm">
        <tbody>
          <tr>
            <td className="w-48 py-1 align-top">Nama</td>
            <td className="py-1 align-top">: {penerimaNama}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2">
        Adalah benar merupakan karyawan/pihak yang terdaftar pada PT. Banana Digital Boost. Surat
        keterangan ini diterbitkan untuk keperluan sebagai berikut:
      </p>
      <p className="whitespace-pre-wrap rounded-md border border-slate-200 p-3">{values.keperluan || "-"}</p>

      <p className="mt-2">
        Surat keterangan ini berlaku selama {values.masaBerlakuBulan || "-"} bulan sejak tanggal
        diterbitkan, dan dapat digunakan sebagaimana mestinya.
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
