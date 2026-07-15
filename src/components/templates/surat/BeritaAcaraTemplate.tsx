import { LetterheadLayout } from "./LetterheadLayout";
import { DualSignatureBlock } from "./DualSignatureBlock";
import { QrFooter } from "./QrFooter";
import { formatTanggalIndonesia } from "@/lib/format/tanggal";
import type { SuratTemplateProps } from "./types";

function splitPoints(raw: string | undefined): string[] {
  return (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function BeritaAcaraTemplate({
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
  const tanggalKegiatan = values.tanggalKegiatan ? new Date(values.tanggalKegiatan) : tanggalSurat;
  const perihal = values.perihalKegiatan || "-";

  const hasilPoints = splitPoints(values.hasilKesimpulan);

  return (
    <LetterheadLayout>
      <p className="text-center text-base font-bold underline">BERITA ACARA {perihal.toUpperCase()}</p>
      <p className="text-center">Nomor: {nomorSuratFull}</p>

      <p className="mt-4">
        Pada hari ini, {formatTanggalIndonesia(tanggalKegiatan)}, bertempat di{" "}
        {values.tempatKegiatan || "-"}, kami yang bertanda tangan di bawah ini telah melaksanakan{" "}
        {perihal} dengan pihak-pihak sebagai berikut:
      </p>

      <p className="mt-2 font-semibold">1. PIHAK PERTAMA:</p>
      <p>
        PT. Banana Digital Boost, dalam hal ini diwakili oleh <strong>{signatoryNama}</strong>,
        Jabatan: <strong>{signatoryJabatan}</strong>.
      </p>

      <p className="mt-2 font-semibold">2. PIHAK KEDUA:</p>
      <p>
        <strong>{penerimaNama}</strong>
        {values.namaJabatanPihakKedua ? `, ${values.namaJabatanPihakKedua}` : ""}.
      </p>

      <p className="mt-2">Uraian Kegiatan:</p>
      <p className="whitespace-pre-wrap rounded-md border border-slate-200 p-3">
        {values.uraianKegiatan || "-"}
      </p>

      {hasilPoints.length > 0 && (
        <>
          <p className="mt-2">Hasil &amp; Kesimpulan:</p>
          <ol className="list-decimal space-y-1 pl-6">
            {hasilPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ol>
        </>
      )}

      <p className="mt-2">
        Demikian Berita Acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana
        mestinya.
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
        counterpartyNama={penerimaNama}
      />

      <QrFooter qrDataUrl={qrDataUrl} />
    </LetterheadLayout>
  );
}
