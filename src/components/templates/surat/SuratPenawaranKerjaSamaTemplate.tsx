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

export function SuratPenawaranKerjaSamaTemplate({
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
  const ruangLingkupPoints = splitPoints(values.ruangLingkupLayanan);
  const rincianHargaPoints = splitPoints(values.rincianHarga);
  const totalPenawaran = Number(values.totalPenawaran || 0);
  const masaBerlakuHari = values.masaBerlakuPenawaranHari || "-";

  return (
    <LetterheadLayout>
      <div className="flex justify-between">
        <div>
          <p>No : {nomorSuratFull}</p>
          <p>Lamp : -</p>
          <p>Perihal : {values.perihalPenawaran || "Surat Penawaran Kerja Sama"}</p>
          <p>
            Kepada Yth. : Saudara/i {penerimaNama}
            {values.namaPerusahaanKlien ? `, ${values.namaPerusahaanKlien}` : ""}
          </p>
          <p>Dari : {signatoryJabatan}</p>
          <p>Tanggal : {tanggalFormatted}</p>
        </div>
      </div>

      <p className="mt-2">
        Dengan hormat, bersama surat ini kami PT. Banana Digital Boost mengajukan penawaran kerja
        sama {values.perihalPenawaran ? `untuk ${values.perihalPenawaran}` : ""} kepada Bapak/Ibu.
      </p>

      {ruangLingkupPoints.length > 0 && (
        <>
          <p className="mt-2 font-semibold">I. RUANG LINGKUP LAYANAN</p>
          <ol className="list-decimal space-y-1 pl-6">
            {ruangLingkupPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ol>
        </>
      )}

      <p className="mt-2 font-semibold">II. RINCIAN HARGA</p>
      {rincianHargaPoints.length > 0 ? (
        <ul className="list-disc space-y-0.5 pl-6">
          {rincianHargaPoints.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>-</p>
      )}
      <table className="mt-1 w-full text-sm">
        <tbody>
          <tr>
            <td className="w-48 py-0.5 align-top font-semibold">Total Penawaran</td>
            <td className="py-0.5 align-top font-semibold">: {formatRupiah(totalPenawaran)}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2 font-semibold">III. JANGKA WAKTU KERJA SAMA</p>
      <p>{values.jangkaWaktuKerjaSama || "-"}</p>

      <p className="mt-2 font-semibold">IV. MASA BERLAKU PENAWARAN</p>
      <p>
        Penawaran ini berlaku selama {masaBerlakuHari} hari kerja sejak surat ini diterima. Mohon
        konfirmasi persetujuan Bapak/Ibu dalam kurun waktu tersebut.
      </p>

      <p className="mt-2">
        Demikian penawaran ini kami sampaikan. Kami berharap dapat segera menjalin kerja sama yang
        baik dengan Bapak/Ibu.
      </p>

      <DualSignatureBlock
        tempatTanggal={`Jakarta, ${tanggalFormatted}`}
        headingKiri="Hormat kami,"
        companyEntitas="PT. BANANA DIGITAL BOOST"
        companyNama={signatoryNama}
        companyJabatan={signatoryJabatan}
        companySignatureImageUrl={signatureImageUrl}
        companyStampImageUrl={stampImageUrl}
        headingKanan="Menyetujui,"
        counterpartyEntitas={values.namaPerusahaanKlien || undefined}
        counterpartyNama={penerimaNama}
      />

      <QrFooter qrDataUrl={qrDataUrl} />
    </LetterheadLayout>
  );
}
