import { LetterheadLayout } from "./LetterheadLayout";
import { DualSignatureBlock } from "./DualSignatureBlock";
import { QrFooter } from "./QrFooter";
import { addMonths, formatTanggalIndonesia } from "@/lib/format/tanggal";
import type { SuratTemplateProps } from "./types";

export function PerjanjianKerahasiaanTemplate({
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

  const tanggalMulai = values.tanggalMulai ? new Date(values.tanggalMulai) : null;
  const masaBerlakuTahun = Number(values.masaBerlakuTahun || 0);
  const tanggalBerakhir = tanggalMulai ? addMonths(tanggalMulai, masaBerlakuTahun * 12) : null;

  return (
    <LetterheadLayout>
      <p className="text-center text-base font-bold underline">PERJANJIAN KERAHASIAAN</p>
      <p className="text-center">(Non-Disclosure Agreement)</p>
      <p className="text-center">Nomor: {nomorSuratFull}</p>

      <p className="mt-4">
        Pada hari ini, {tanggalFormatted}, telah dibuat dan ditandatangani Perjanjian Kerahasiaan
        antara:
      </p>

      <p className="mt-2 font-semibold">1. PIHAK PERTAMA:</p>
      <p>
        PT. BANANA DIGITAL BOOST, sebuah perseroan terbatas yang berdiri berdasarkan hukum Indonesia,
        beralamat di 18 Office Park, Jl. TB Simatupang No.18, Kebagusan, Ps. Minggu, Jakarta Selatan
        12520. Dalam hal ini diwakili oleh: <strong>{signatoryNama}</strong>, Jabatan:{" "}
        <strong>{signatoryJabatan}</strong>. Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.
      </p>

      <p className="mt-2 font-semibold">2. PIHAK KEDUA:</p>
      <p>
        <strong>{values.namaPerusahaanKedua || "-"}</strong>, beralamat di{" "}
        {values.alamatPerusahaanKedua || "-"}. Dalam hal ini diwakili oleh:{" "}
        <strong>{penerimaNama}</strong>, Jabatan: <strong>{values.diwakiliJabatanKedua || "-"}</strong>.
        Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.
      </p>

      <p className="mt-2">
        Kedua belah pihak akan saling bertukar dan/atau mengungkapkan informasi rahasia sehubungan
        dengan {values.tujuanPengungkapanInformasi || "kerja sama antara kedua belah pihak"}, dan
        sepakat untuk terikat pada ketentuan sebagai berikut:
      </p>

      <p className="mt-3 text-center font-semibold">PASAL 1 — DEFINISI INFORMASI RAHASIA</p>
      <p>
        Informasi Rahasia adalah seluruh data, dokumen, materi, strategi, dan informasi dalam bentuk
        apa pun (tertulis, lisan, elektronik, atau bentuk lainnya) yang diungkapkan oleh satu pihak
        kepada pihak lainnya sehubungan dengan kerja sama ini, termasuk namun tidak terbatas pada
        data kampanye, akses akun, strategi pemasaran, data pelanggan, dan informasi bisnis lainnya
        yang bersifat rahasia.
      </p>

      <p className="mt-3 text-center font-semibold">PASAL 2 — KEWAJIBAN KERAHASIAAN</p>
      <ol className="list-decimal space-y-1 pl-6">
        <li>Masing-masing pihak wajib menjaga kerahasiaan Informasi Rahasia yang diterima dari pihak lainnya.</li>
        <li>
          Informasi Rahasia hanya boleh digunakan untuk keperluan pelaksanaan kerja sama dan tidak
          boleh diungkapkan kepada pihak ketiga tanpa persetujuan tertulis dari pihak pemilik
          informasi.
        </li>
        <li>
          Masing-masing pihak wajib mengambil langkah yang wajar untuk melindungi Informasi Rahasia
          dari akses, penggunaan, atau pengungkapan yang tidak sah.
        </li>
      </ol>

      <p className="mt-3 text-center font-semibold">PASAL 3 — PENGECUALIAN</p>
      <p>Kewajiban kerahasiaan dalam Perjanjian ini tidak berlaku terhadap informasi yang:</p>
      <ol className="list-[lower-alpha] space-y-1 pl-6">
        <li>telah menjadi milik umum bukan karena kesalahan pihak penerima informasi;</li>
        <li>telah diketahui oleh pihak penerima sebelum diungkapkan oleh pihak pemberi informasi;</li>
        <li>wajib diungkapkan berdasarkan ketentuan hukum atau perintah pengadilan/pihak berwenang.</li>
      </ol>

      <p className="mt-3 text-center font-semibold">PASAL 4 — JANGKA WAKTU</p>
      <p>
        Perjanjian ini berlaku selama {masaBerlakuTahun} tahun terhitung sejak tanggal{" "}
        {tanggalMulai ? formatTanggalIndonesia(tanggalMulai) : "-"} hingga{" "}
        {tanggalBerakhir ? formatTanggalIndonesia(tanggalBerakhir) : "-"}, dan kewajiban kerahasiaan
        tetap berlaku meskipun kerja sama antara kedua belah pihak telah berakhir.
      </p>

      <p className="mt-3 text-center font-semibold">PASAL 5 — SANKSI PELANGGARAN</p>
      <p>
        Pelanggaran terhadap ketentuan Perjanjian ini oleh salah satu pihak dapat dikenakan sanksi
        berupa ganti rugi atas kerugian yang timbul, sesuai dengan ketentuan hukum yang berlaku di
        Republik Indonesia.
      </p>

      <p className="mt-3 text-center font-semibold">PASAL 6 — PENYELESAIAN SENGKETA</p>
      <p>
        Segala perselisihan yang timbul dari Perjanjian ini akan diselesaikan secara musyawarah
        mufakat. Jika tidak tercapai kesepakatan, akan diselesaikan melalui jalur hukum yang berlaku
        di wilayah Republik Indonesia.
      </p>

      <p className="mt-3">
        Demikian Perjanjian Kerahasiaan ini dibuat dan ditandatangani oleh kedua belah pihak dalam
        keadaan sadar dan tanpa paksaan dari pihak mana pun.
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
        counterpartyEntitas={values.namaPerusahaanKedua || undefined}
        counterpartyNama={penerimaNama}
      />

      <QrFooter qrDataUrl={qrDataUrl} />
    </LetterheadLayout>
  );
}
