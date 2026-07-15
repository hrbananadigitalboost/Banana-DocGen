import { LetterheadLayout } from "./LetterheadLayout";
import { DualSignatureBlock } from "./DualSignatureBlock";
import { QrFooter } from "./QrFooter";
import { formatTanggalIndonesia, formatRupiah } from "@/lib/format/tanggal";
import type { SuratTemplateProps } from "./types";

function splitPoints(raw: string | undefined): string[] {
  return (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function SuratPerintahKerjaTemplate({
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
  const tanggalMulai = values.tanggalMulaiProyek ? new Date(values.tanggalMulaiProyek) : null;
  const tanggalSelesai = values.tanggalSelesaiProyek ? new Date(values.tanggalSelesaiProyek) : null;
  const nilaiKontrak = values.nilaiKontrak ? Number(values.nilaiKontrak) : null;
  const deliverablePoints = splitPoints(values.deliverables);

  return (
    <LetterheadLayout>
      <p className="text-center text-base font-bold underline">SURAT PERINTAH KERJA</p>
      <p className="text-center">Nomor: {nomorSuratFull}</p>

      <p className="mt-4">
        Berdasarkan kesepakatan kerja sama yang telah disetujui, dengan ini PT. Banana Digital Boost
        memerintahkan pelaksanaan pekerjaan sebagai berikut:
      </p>

      <table className="mt-2 w-full text-sm">
        <tbody>
          <tr>
            <td className="w-40 py-1 align-top">Klien</td>
            <td className="py-1 align-top">
              : {values.namaKlien || "-"} (PIC: {penerimaNama})
            </td>
          </tr>
          <tr>
            <td className="py-1 align-top">Nama Proyek</td>
            <td className="py-1 align-top">: {values.namaProyek || "-"}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2">Lingkup Pekerjaan:</p>
      <p className="whitespace-pre-wrap rounded-md border border-slate-200 p-3">
        {values.lingkupPekerjaan || "-"}
      </p>

      {deliverablePoints.length > 0 && (
        <>
          <p className="mt-2">Deliverables:</p>
          <ol className="list-decimal space-y-1 pl-6">
            {deliverablePoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ol>
        </>
      )}

      <table className="mt-2 w-full text-sm">
        <tbody>
          <tr>
            <td className="w-40 py-1 align-top">Jadwal Pelaksanaan</td>
            <td className="py-1 align-top">
              : {tanggalMulai ? formatTanggalIndonesia(tanggalMulai) : "-"} s/d{" "}
              {tanggalSelesai ? formatTanggalIndonesia(tanggalSelesai) : "-"}
            </td>
          </tr>
          {nilaiKontrak !== null && (
            <tr>
              <td className="py-1 align-top">Nilai Kontrak</td>
              <td className="py-1 align-top">: {formatRupiah(nilaiKontrak)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="mt-2">
        Surat Perintah Kerja ini menjadi dasar pelaksanaan pekerjaan dan wajib dilaksanakan sesuai
        dengan lingkup dan jadwal yang telah ditetapkan.
      </p>

      <DualSignatureBlock
        tempatTanggal={`Jakarta, ${tanggalFormatted}`}
        headingKiri="PIHAK PERTAMA"
        companyEntitas="PT. BANANA DIGITAL BOOST"
        companyNama={signatoryNama}
        companyJabatan={signatoryJabatan}
        companySignatureImageUrl={signatureImageUrl}
        companyStampImageUrl={stampImageUrl}
        headingKanan="PIHAK KEDUA"
        counterpartyEntitas={values.namaKlien || undefined}
        counterpartyNama={penerimaNama}
      />

      <QrFooter qrDataUrl={qrDataUrl} />
    </LetterheadLayout>
  );
}
