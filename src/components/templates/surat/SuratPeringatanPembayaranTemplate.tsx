import { LetterheadLayout } from "./LetterheadLayout";
import { SignatureBlock } from "./SignatureBlock";
import { QrFooter } from "./QrFooter";
import { formatTanggalIndonesia, formatRupiah } from "@/lib/format/tanggal";
import type { SuratTemplateProps } from "./types";

export function SuratPeringatanPembayaranTemplate({
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
  const tanggalJatuhTempo = values.tanggalJatuhTempo ? new Date(values.tanggalJatuhTempo) : null;
  const batasWaktuBaru = values.batasWaktuPembayaranBaru ? new Date(values.batasWaktuPembayaranBaru) : null;
  const jumlahTagihan = Number(values.jumlahTagihan || 0);
  const hariKeterlambatan = values.jumlahHariKeterlambatan || "-";

  return (
    <LetterheadLayout>
      <p className="text-center text-base font-bold underline">SURAT PERINGATAN PEMBAYARAN</p>
      <p className="text-center">Nomor: {nomorSuratFull}</p>

      <p className="mt-4">
        Kepada Yth. Saudara/i {penerimaNama}
        {values.namaKlien ? `, ${values.namaKlien}` : ""},
      </p>

      <p className="mt-2">
        Sehubungan dengan tagihan atas layanan yang telah kami berikan, kami sampaikan rincian
        tagihan yang hingga saat ini belum kami terima pembayarannya:
      </p>

      <table className="mt-2 w-full text-sm">
        <tbody>
          <tr>
            <td className="w-48 py-1 align-top">Nomor Invoice</td>
            <td className="py-1 align-top">: {values.nomorInvoice || "-"}</td>
          </tr>
          <tr>
            <td className="py-1 align-top">Jumlah Tagihan</td>
            <td className="py-1 align-top">: {formatRupiah(jumlahTagihan)}</td>
          </tr>
          <tr>
            <td className="py-1 align-top">Tanggal Jatuh Tempo</td>
            <td className="py-1 align-top">
              : {tanggalJatuhTempo ? formatTanggalIndonesia(tanggalJatuhTempo) : "-"}
            </td>
          </tr>
          <tr>
            <td className="py-1 align-top">Keterlambatan</td>
            <td className="py-1 align-top">: {hariKeterlambatan} hari</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2">
        Sampai dengan surat ini diterbitkan, kami belum menerima pembayaran atas tagihan tersebut di
        atas. Untuk itu, kami mohon perhatian dan kesediaan Bapak/Ibu untuk segera menyelesaikan
        kewajiban pembayaran dimaksud paling lambat pada tanggal{" "}
        <strong>{batasWaktuBaru ? formatTanggalIndonesia(batasWaktuBaru) : "-"}</strong>.
      </p>

      <p className="mt-2">
        Apabila hingga batas waktu tersebut kami belum menerima pembayaran, kami akan mempertimbangkan
        penghentian sementara layanan dan/atau pengenaan denda keterlambatan sesuai dengan ketentuan
        yang berlaku dalam kesepakatan kerja sama antara kedua belah pihak.
      </p>

      <p className="mt-2">
        Kami sangat menghargai kerja sama yang telah terjalin dan berharap permasalahan ini dapat
        segera diselesaikan dengan baik.
      </p>

      <SignatureBlock
        tempatTanggal={`Jakarta, ${tanggalFormatted}`}
        entitas="PT. Banana Digital Boost,"
        jabatan={signatoryJabatan}
        nama={signatoryNama}
        signatureImageUrl={signatureImageUrl}
        stampImageUrl={stampImageUrl}
      />

      <QrFooter qrDataUrl={qrDataUrl} />
    </LetterheadLayout>
  );
}
