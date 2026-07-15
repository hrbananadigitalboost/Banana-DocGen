import { LetterheadLayout } from "./LetterheadLayout";
import { SignatureBlock } from "./SignatureBlock";
import { QrFooter } from "./QrFooter";
import { formatTanggalIndonesia } from "@/lib/format/tanggal";
import type { SuratTemplateProps } from "./types";

function splitPoints(raw: string | undefined): string[] {
  return (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const DIKTUM_LABELS = [
  "PERTAMA",
  "KEDUA",
  "KETIGA",
  "KEEMPAT",
  "KELIMA",
  "KEENAM",
  "KETUJUH",
  "KEDELAPAN",
  "KESEMBILAN",
  "KESEPULUH",
];

function diktumLabel(index: number): string {
  return DIKTUM_LABELS[index] ?? `KE-${index + 1}`;
}

export function SuratKeputusanTemplate({
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
  const tanggalEfektif = values.tanggalEfektif ? new Date(values.tanggalEfektif) : null;
  const perihal = values.perihalKeputusan || "-";

  const menimbangPoints = splitPoints(values.menimbang);
  const mengingatPoints = splitPoints(values.mengingat);
  const diktumPoints = splitPoints(values.diktumKeputusan);

  return (
    <LetterheadLayout>
      <p className="text-center text-base font-bold underline">SURAT KEPUTUSAN</p>
      <p className="text-center">Nomor: {nomorSuratFull}</p>
      <p className="mt-2 text-center font-semibold">Tentang</p>
      <p className="text-center font-semibold uppercase">{perihal}</p>

      <p className="mt-4">Manajemen PT. Banana Digital Boost,</p>

      {menimbangPoints.length > 0 && (
        <>
          <p className="mt-2 font-semibold">Menimbang:</p>
          <ol className="list-[lower-alpha] space-y-1 pl-6">
            {menimbangPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ol>
        </>
      )}

      {mengingatPoints.length > 0 && (
        <>
          <p className="mt-2 font-semibold">Mengingat:</p>
          <ol className="list-decimal space-y-1 pl-6">
            {mengingatPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ol>
        </>
      )}

      <p className="mt-4 text-center font-bold">MEMUTUSKAN</p>

      <table className="mt-2 w-full text-sm">
        <tbody>
          <tr>
            <td className="w-32 py-1 align-top font-semibold">Menetapkan</td>
            <td className="py-1 align-top">:</td>
          </tr>
        </tbody>
      </table>

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

      {diktumPoints.length > 0 && (
        <table className="mt-2 w-full text-sm">
          <tbody>
            {diktumPoints.map((point, idx) => (
              <tr key={idx}>
                <td className="w-24 py-1 align-top font-semibold">{diktumLabel(idx)}</td>
                <td className="py-1 align-top">: {point}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="mt-2">
        Keputusan ini berlaku efektif sejak tanggal{" "}
        <strong>{tanggalEfektif ? formatTanggalIndonesia(tanggalEfektif) : "-"}</strong>, dengan
        ketentuan apabila di kemudian hari terdapat kekeliruan dalam keputusan ini akan diadakan
        perbaikan sebagaimana mestinya.
      </p>

      <SignatureBlock
        tempatTanggal={`Ditetapkan di Jakarta, pada tanggal ${tanggalFormatted}`}
        entitas="Manajemen PT. Banana Digital Boost,"
        jabatan={signatoryJabatan}
        nama={signatoryNama}
        signatureImageUrl={signatureImageUrl}
        stampImageUrl={stampImageUrl}
      />

      <QrFooter qrDataUrl={qrDataUrl} />
    </LetterheadLayout>
  );
}
