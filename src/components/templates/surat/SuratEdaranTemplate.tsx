import { LetterheadLayout } from "./LetterheadLayout";
import { SignatureBlock } from "./SignatureBlock";
import { QrFooter } from "./QrFooter";
import { formatTanggalIndonesia } from "@/lib/format/tanggal";
import type { SuratTemplateProps } from "./types";

export function SuratEdaranTemplate({
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
      <p className="text-center text-base font-bold underline">SURAT EDARAN</p>
      <p className="text-center">Nomor: {nomorSuratFull}</p>

      <table className="mt-4 w-full text-sm">
        <tbody>
          <tr>
            <td className="w-32 py-1 align-top">Kepada</td>
            <td className="py-1 align-top">: {penerimaNama}</td>
          </tr>
          <tr>
            <td className="py-1 align-top">Perihal</td>
            <td className="py-1 align-top">: {values.perihal || "-"}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-4">Dengan ini disampaikan hal-hal sebagai berikut:</p>
      <p className="whitespace-pre-wrap rounded-md border border-slate-200 p-3">{values.isiEdaran || "-"}</p>

      <p className="mt-2">
        Demikian surat edaran ini disampaikan untuk diketahui dan dilaksanakan sebagaimana mestinya.
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
