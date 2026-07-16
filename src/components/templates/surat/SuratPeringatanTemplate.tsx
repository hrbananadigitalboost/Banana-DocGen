import { LetterheadLayout } from "./LetterheadLayout";
import { SignatureBlock } from "./SignatureBlock";
import { QrFooter } from "./QrFooter";
import { addMonths, formatTanggalIndonesia } from "@/lib/format/tanggal";
import { eskalasiBerikutnya, tingkatPeringatanLabel } from "@/lib/format/suratPeringatan";
import type { SuratTemplateProps } from "./types";

const MASA_BERLAKU_BULAN = 6;

function splitPoints(raw: string | undefined): string[] {
  return (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function SuratPeringatanTemplate({
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
  const tingkat = values.tingkatPeringatan || "I";
  const tingkatLabel = tingkatPeringatanLabel(tingkat);
  const tanggalBerakhir = formatTanggalIndonesia(addMonths(tanggalSurat, MASA_BERLAKU_BULAN));

  const pelanggaranPoints = splitPoints(values.alasanPeringatan);
  const konsekuensiPoints = splitPoints(values.konsekuensiFinansial);

  return (
    <>
      <LetterheadLayout>
        <p className="text-center text-base font-bold underline">SURAT PERINGATAN {tingkatLabel}</p>
        <p className="text-center">Nomor: {nomorSuratFull}</p>

        <p className="mt-4">
          Surat Peringatan {tingkatLabel} ini diterbitkan oleh Manajemen PT. Banana Digital Boost
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

        <p className="mt-2">Latar Belakang Pelanggaran:</p>
        <p>
          Surat Peringatan ini dikeluarkan berdasarkan hasil evaluasi manajemen. Berdasarkan catatan
          dan bukti evaluasi, Saudara/i {penerimaNama} ditemukan telah melakukan pelanggaran disiplin
          dan profesionalisme kerja berupa:
        </p>
        {pelanggaranPoints.length > 0 && (
          <ol className="list-decimal space-y-1 pl-6">
            {pelanggaranPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ol>
        )}

        <p className="mt-2">
          Tindakan tersebut di atas merupakan pelanggaran terhadap komitmen kedisiplinan yang
          mengacu pada Standar Kedisiplinan Kerja serta Peraturan Perusahaan yang berlaku.
        </p>

        <p className="mt-2">Maksud dan Tujuan:</p>
        <p className="whitespace-pre-wrap">{values.maksudTujuan || "-"}</p>
      </LetterheadLayout>

      <LetterheadLayout pageBreakBefore>
        <p>Masa Berlaku dan Konsekuensi Administratif:</p>
        <ol className="list-decimal space-y-1 pl-6">
          <li>
            Surat Peringatan {tingkatLabel} ini berlaku selama {MASA_BERLAKU_BULAN} (
            {numberToWords(MASA_BERLAKU_BULAN)}) bulan terhitung sejak tanggal diterbitkannya surat
            ini, yaitu sampai dengan tanggal {tanggalBerakhir}.
          </li>
          <li>
            Apabila dalam kurun waktu masa berlaku {tingkatLabel} ini Saudara/i {penerimaNama}{" "}
            kembali melakukan pelanggaran kedisiplinan atau tindakan indisipliner lainnya, maka
            Manajemen akan langsung menjatuhkan sanksi yang lebih berat berupa{" "}
            {eskalasiBerikutnya(tingkat)}.
          </li>
        </ol>

        {konsekuensiPoints.length > 0 && (
          <>
            <p className="mt-2">Konsekuensi Finansial &amp; Fasilitas:</p>
            <p>
              Sesuai dengan regulasi internal dan Peraturan Perusahaan mengenai penegakan disiplin,
              penerbitan surat ini membawa konsekuensi langsung terhadap hak penunjang kerja
              Saudara/i {penerimaNama} sebagai berikut:
            </p>
            <ol className="list-decimal space-y-1 pl-6">
              {konsekuensiPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ol>
          </>
        )}

        <p className="mt-2">
          Demikian Surat Peringatan {tingkatLabel} ini disampaikan untuk dipahami, diperhatikan, dan
          dijalankan dengan penuh tanggung jawab demi kebaikan bersama dan kemajuan perusahaan.
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

      <LetterheadLayout pageBreakBefore>
        <p className="text-center">
          ------------------------------------------------------------------------------
        </p>
        <p className="text-center font-bold">LEMBAR PERNYATAAN &amp; KOMITMEN KARYAWAN</p>
        <p className="text-center">
          ------------------------------------------------------------------------------
        </p>

        <p className="mt-4">
          Saya yang bertandatangan di bawah ini, menyatakan bahwa saya telah menerima, membaca, dan
          memahami sepenuhnya isi dari Surat Peringatan {tingkatLabel} ini.
        </p>

        <p className="mt-2">Dengan ini saya berkomitmen untuk:</p>
        <ol className="list-decimal space-y-1 pl-6">
          <li>Memperbaiki kedisiplinan kerja saya sesuai ketentuan yang berlaku di perusahaan.</li>
          <li>
            Mematuhi seluruh regulasi operasional dan tata tertib yang berlaku di PT. Banana Digital
            Boost tanpa terkecuali.
          </li>
        </ol>

        <p className="mt-2">
          Saya memahami bahwa kegagalan dalam memenuhi komitmen ini selama masa pembinaan akan
          berakibat pada jatuhnya sanksi yang lebih berat, termasuk namun tidak terbatas pada{" "}
          {eskalasiBerikutnya(tingkat)}.
        </p>

        <div className="mt-8 flex flex-col gap-1">
          <p>Jakarta, {tanggalFormatted}</p>
          <p>Yang menyatakan,</p>
          <div className="mt-2 h-24 w-40 border-b border-slate-300" />
          <p className="font-semibold underline">{penerimaNama}</p>
          <p className="text-xs text-slate-500">(tanda tangan basah - diisi manual oleh karyawan)</p>
        </div>

        <div className="mt-8 text-xs">
          <p>Tembusan:</p>
          <ol className="list-decimal pl-6">
            <li>Direksi / Pimpinan Manajemen</li>
            <li>Kepala Divisi / Team Leader Terkait</li>
            <li>Arsip HRD</li>
          </ol>
        </div>
      </LetterheadLayout>
    </>
  );
}

function numberToWords(n: number): string {
  const words: Record<number, string> = {
    1: "satu",
    2: "dua",
    3: "tiga",
    4: "empat",
    5: "lima",
    6: "enam",
    7: "tujuh",
    8: "delapan",
    9: "sembilan",
    10: "sepuluh",
    11: "sebelas",
    12: "dua belas",
  };
  return words[n] ?? String(n);
}
