import { LetterheadLayout } from "./LetterheadLayout";
import { DualSignatureBlock } from "./DualSignatureBlock";
import { QrFooter } from "./QrFooter";
import { addMonths, formatTanggalIndonesia, formatRupiah } from "@/lib/format/tanggal";
import type { SuratTemplateProps } from "./types";

export function PerjanjianKerjaTemplate({
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
  const isPercobaan = (values.tipeKontrak || "PERCOBAAN") === "PERCOBAAN";
  const judul = isPercobaan ? "SURAT PERJANJIAN KERJA PERCOBAAN" : "PERJANJIAN KERJA WAKTU TERTENTU (PKWT)";
  const namaPerjanjian = isPercobaan ? "Perjanjian Kerja Percobaan" : "Perjanjian Kerja Waktu Tertentu (PKWT)";

  const tanggalFormatted = formatTanggalIndonesia(tanggalSurat);
  const tanggalLahirFormatted = values.tanggalLahirPekerja
    ? formatTanggalIndonesia(new Date(values.tanggalLahirPekerja))
    : "-";

  const lamaKontrakBulan = Number(values.lamaKontrakBulan || 0);
  const tanggalMulaiKontrak = values.tanggalMulaiKontrak ? new Date(values.tanggalMulaiKontrak) : null;
  const tanggalAkhirKontrak = tanggalMulaiKontrak ? addMonths(tanggalMulaiKontrak, lamaKontrakBulan) : null;

  const gajiPokok = Number(values.gajiPokok || 0);
  const tunjangan = Number(values.tunjangan || 0);
  const totalGaji = gajiPokok + tunjangan;
  const potonganPersen = isPercobaan ? Number(values.potonganProbationPersen || 0) : 0;
  const upahDiterima = totalGaji - (totalGaji * potonganPersen) / 100;

  return (
    <LetterheadLayout>
      <p className="text-center text-base font-bold underline">{judul}</p>
      <p className="text-center">Nomor: {nomorSuratFull}</p>

      <p className="mt-4">
        Pada hari ini, {tanggalFormatted}, telah dibuat dan ditandatangani {namaPerjanjian} antara:
      </p>

      <p className="mt-2 font-semibold">1. PEMBERI KERJA:</p>
      <p>
        PT. BANANA DIGITAL BOOST, sebuah perseroan terbatas yang berdiri berdasarkan hukum Indonesia,
        beralamat di 18 Office Park, Jl. TB Simatupang No.18, Kebagusan, Ps. Minggu, Jakarta Selatan
        12520. Dalam hal ini diwakili oleh: <strong>{signatoryNama}</strong>, Jabatan:{" "}
        <strong>{signatoryJabatan}</strong>. Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.
      </p>

      <p className="mt-2 font-semibold">2. PEKERJA:</p>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="w-48 py-0.5 align-top">Nama</td>
            <td className="py-0.5 align-top">: {penerimaNama}</td>
          </tr>
          <tr>
            <td className="py-0.5 align-top">Tempat/Tgl Lahir</td>
            <td className="py-0.5 align-top">
              : {values.tempatLahirPekerja || "-"}, {tanggalLahirFormatted}
            </td>
          </tr>
          <tr>
            <td className="py-0.5 align-top">No. KTP</td>
            <td className="py-0.5 align-top">: {values.noKtpPekerja || "-"}</td>
          </tr>
          <tr>
            <td className="py-0.5 align-top">Alamat</td>
            <td className="py-0.5 align-top">: {values.alamatPekerja || "-"}</td>
          </tr>
        </tbody>
      </table>
      <p>
        Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.
      </p>

      <p className="mt-2">
        Kedua belah pihak secara bersama-sama setuju untuk mengadakan {namaPerjanjian} dengan ketentuan
        sebagai berikut:
      </p>

      <p className="mt-3 text-center font-semibold">PASAL 1 — MASA BERLAKU PERJANJIAN</p>
      <ol className="list-decimal space-y-1 pl-6">
        <li>
          {namaPerjanjian} ini berlaku untuk jangka waktu {lamaKontrakBulan} bulan, terhitung sejak
          tanggal {tanggalMulaiKontrak ? formatTanggalIndonesia(tanggalMulaiKontrak) : "-"} hingga{" "}
          {tanggalAkhirKontrak ? formatTanggalIndonesia(tanggalAkhirKontrak) : "-"}.
        </li>
        <li>Perjanjian ini merupakan perjanjian kerja untuk {isPercobaan ? "Masa Percobaan (Probation)" : namaPerjanjian}.</li>
        <li>Perjanjian ini berakhir secara otomatis pada tanggal berakhirnya jangka waktu tersebut di atas.</li>
      </ol>

      <p className="mt-3 text-center font-semibold">PASAL 2 — JABATAN DAN TEMPAT BEKERJA</p>
      <ol className="list-decimal space-y-1 pl-6">
        <li>Pihak Kedua diterima bekerja pada Pihak Pertama dalam jabatan {values.jabatanPekerja || "-"}.</li>
        <li>Tempat bekerja di {values.tempatBekerja || "kantor Pihak Pertama"}, atau di lokasi lain sesuai dengan kebutuhan perusahaan.</li>
      </ol>

      <p className="mt-3 text-center font-semibold">PASAL 3 — WAKTU KERJA</p>
      <p>
        Waktu kerja mengikuti ketentuan yang berlaku di perusahaan, yaitu Senin hingga Jumat pukul
        09.00–18.00 WIB dan Sabtu pukul 09.00–15.00 WIB, dengan istirahat yang ditentukan.
      </p>

      <p className="mt-3 text-center font-semibold">PASAL 4 — UPAH DAN TUNJANGAN</p>
      <ol className="list-decimal space-y-1 pl-6">
        <li>
          Selama {isPercobaan ? "masa Percobaan" : "masa perjanjian"} ini, Pihak Kedua berhak menerima
          kompensasi total sebesar {formatRupiah(totalGaji)} per bulan.
        </li>
        {isPercobaan && potonganPersen > 0 && (
          <li>
            Dikarenakan status karyawan masih probation/percobaan, upah yang akan diterima sebesar{" "}
            {formatRupiah(upahDiterima)} (dikurangi {potonganPersen}% dari total keseluruhan Gross
            Income).
          </li>
        )}
        <li>
          Kompensasi tersebut terdiri dari:
          <ol className="list-[lower-alpha] space-y-1 pl-6">
            <li>Gaji Pokok: {formatRupiah(gajiPokok)}</li>
            <li>Tunjangan-tunjangan: {formatRupiah(tunjangan)}</li>
          </ol>
        </li>
        <li>Pembayaran upah dilakukan setiap akhir bulan melalui transfer bank.</li>
      </ol>

      <p className="mt-3 text-center font-semibold">PASAL 5 — HAK DAN KEWAJIBAN</p>
      <ol className="list-decimal space-y-1 pl-6">
        <li>
          Pihak Kedua berhak mengikuti program BPJS Kesehatan dan BPJS Ketenagakerjaan yang akan
          dibayarkan iurannya oleh Pihak Pertama sesuai dengan ketentuan perundang-undangan yang
          berlaku, dimulai sejak hari pertama bekerja.
        </li>
        <li>Pihak Kedua wajib mematuhi semua peraturan perusahaan, Kode Etik, dan Tata Tertib Kerja.</li>
        <li>Pihak Kedua wajib menjaga kerahasiaan segala informasi dan data perusahaan.</li>
      </ol>

      <p className="mt-3 text-center font-semibold">PASAL 6 — PENILAIAN KINERJA DAN KELANJUTAN HUBUNGAN KERJA</p>
      {isPercobaan ? (
        <ol className="list-decimal space-y-1 pl-6">
          <li>Pihak Pertama akan melakukan penilaian kinerja terhadap Pihak Kedua sebelum berakhirnya Perjanjian Kerja Percobaan ini.</li>
          <li>Apabila kinerja Pihak Kedua dinilai MEMUASKAN, Pihak Pertama akan mengangkat Pihak Kedua sebagai Karyawan kontrak dengan Perjanjian Kerja Waktu Tertentu (PKWT).</li>
          <li>
            Apabila kinerja Pihak Kedua dinilai BELUM MEMUASKAN, maka hubungan kerja akan berakhir pada
            tanggal {tanggalAkhirKontrak ? formatTanggalIndonesia(tanggalAkhirKontrak) : "-"} tanpa hak
            untuk dituntut lebih lanjut.
          </li>
        </ol>
      ) : (
        <ol className="list-decimal space-y-1 pl-6">
          <li>Pihak Pertama akan melakukan penilaian terhadap kinerja Pihak Kedua sebelum berakhirnya masa PKWT ini.</li>
          <li>Apabila hasil penilaian kinerja dinilai MEMUASKAN, Pihak Pertama dapat menawarkan perpanjangan atau pembaharuan PKWT atau bentuk hubungan kerja lain sesuai kebutuhan perusahaan.</li>
          <li>
            Apabila dinilai BELUM MEMUASKAN, Pihak Pertama tidak berkewajiban memperpanjang PKWT dan
            hubungan kerja akan berakhir secara otomatis pada tanggal berakhirnya PKWT tanpa kewajiban
            kompensasi selain yang diatur dalam peraturan perundang-undangan yang berlaku.
          </li>
        </ol>
      )}

      <p className="mt-3 text-center font-semibold">PASAL 7 — LAIN-LAIN</p>
      <ol className="list-decimal space-y-1 pl-6">
        <li>Hal-hal yang belum diatur dalam perjanjian ini akan diatur lebih lanjut berdasarkan peraturan perusahaan dan perundang-undangan ketenagakerjaan yang berlaku.</li>
        <li>Segala perselisihan yang timbul dari perjanjian ini akan diselesaikan secara musyawarah. Jika tidak tercapai kesepakatan, akan diselesaikan melalui jalur hukum di Pengadilan Hubungan Industrial.</li>
      </ol>

      <p className="mt-3 text-center font-semibold">PASAL 8 — PENUTUP</p>
      <p>
        Demikian {namaPerjanjian} ini dibuat dan ditandatangani oleh kedua belah pihak dalam keadaan
        sadar dan tanpa paksaan dari pihak mana pun.
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
