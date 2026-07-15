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

export function SuratPemutusanHubunganKerjaTemplate({
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
  const tanggalEfektif = values.tanggalEfektifPHK ? new Date(values.tanggalEfektifPHK) : null;

  const hakKompensasiPoints = splitPoints(values.hakKompensasi);
  const kewajibanPoints = splitPoints(values.kewajibanSerahTerima);

  return (
    <LetterheadLayout>
      <p className="text-center text-base font-bold underline">SURAT PEMUTUSAN HUBUNGAN KERJA</p>
      <p className="text-center">Nomor: {nomorSuratFull}</p>

      <p className="mt-4">
        Manajemen PT. Banana Digital Boost dengan ini menyampaikan Surat Pemutusan Hubungan Kerja
        kepada:
      </p>

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

      <p className="mt-2">Dasar Hukum &amp; Pertimbangan:</p>
      <p className="whitespace-pre-wrap">{values.dasarHukum || "-"}</p>

      <p className="mt-2">Alasan Pemutusan Hubungan Kerja:</p>
      <p className="whitespace-pre-wrap">{values.alasanPHK || "-"}</p>

      <p className="mt-2">
        Dengan ini hubungan kerja antara PT. Banana Digital Boost dengan Saudara/i {penerimaNama}{" "}
        dinyatakan berakhir secara efektif pada tanggal{" "}
        <strong>{tanggalEfektif ? formatTanggalIndonesia(tanggalEfektif) : "-"}</strong>.
      </p>

      {hakKompensasiPoints.length > 0 && (
        <>
          <p className="mt-2">Hak Kompensasi:</p>
          <p>
            Sesuai dengan ketentuan perundang-undangan ketenagakerjaan yang berlaku, Saudara/i{" "}
            {penerimaNama} berhak menerima:
          </p>
          <ol className="list-decimal space-y-1 pl-6">
            {hakKompensasiPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ol>
        </>
      )}

      {kewajibanPoints.length > 0 && (
        <>
          <p className="mt-2">Kewajiban Serah Terima:</p>
          <p>
            Sebelum tanggal efektif pemutusan hubungan kerja, Saudara/i {penerimaNama} wajib
            menyelesaikan hal-hal berikut:
          </p>
          <ol className="list-decimal space-y-1 pl-6">
            {kewajibanPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ol>
        </>
      )}

      <p className="mt-2">
        Demikian Surat Pemutusan Hubungan Kerja ini disampaikan untuk dipahami dan dilaksanakan
        sebagaimana mestinya.
      </p>

      <SignatureBlock
        tempatTanggal={`Jakarta, ${tanggalFormatted}`}
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
