import { LetterheadLayout } from "./LetterheadLayout";
import { DualSignatureBlock } from "./DualSignatureBlock";
import { QrFooter } from "./QrFooter";
import { addMonths, formatTanggalIndonesia, formatRupiah } from "@/lib/format/tanggal";
import type { SuratTemplateProps } from "./types";

function splitPoints(raw: string | undefined): string[] {
  return (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function PerjanjianKerjaSamaTemplate({
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

  const jangkaWaktuBulan = Number(values.jangkaWaktuBulan || 0);
  const tanggalMulai = values.tanggalMulaiKerjaSama ? new Date(values.tanggalMulaiKerjaSama) : null;
  const tanggalAkhir = tanggalMulai ? addMonths(tanggalMulai, jangkaWaktuBulan) : null;
  const nilaiKerjaSama = values.nilaiKerjaSama ? Number(values.nilaiKerjaSama) : null;

  const hakKewajibanPertama = splitPoints(values.hakKewajibanPihakPertama);
  const hakKewajibanKedua = splitPoints(values.hakKewajibanPihakKedua);

  return (
    <LetterheadLayout>
      <p className="text-center text-base font-bold underline">PERJANJIAN KERJA SAMA</p>
      <p className="text-center">Nomor: {nomorSuratFull}</p>

      <p className="mt-4">
        Pada hari ini, {tanggalFormatted}, telah dibuat dan ditandatangani Perjanjian Kerja Sama
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
        Kedua belah pihak secara bersama-sama setuju untuk mengadakan Perjanjian Kerja Sama dengan
        ketentuan sebagai berikut:
      </p>

      <p className="mt-3 text-center font-semibold">PASAL 1 — RUANG LINGKUP KERJA SAMA</p>
      <p>{values.ruangLingkupKerjaSama || "-"}</p>

      <p className="mt-3 text-center font-semibold">PASAL 2 — JANGKA WAKTU</p>
      <ol className="list-decimal space-y-1 pl-6">
        <li>
          Perjanjian ini berlaku untuk jangka waktu {jangkaWaktuBulan} bulan, terhitung sejak tanggal{" "}
          {tanggalMulai ? formatTanggalIndonesia(tanggalMulai) : "-"} hingga{" "}
          {tanggalAkhir ? formatTanggalIndonesia(tanggalAkhir) : "-"}.
        </li>
        <li>
          Perjanjian ini dapat diperpanjang berdasarkan kesepakatan tertulis kedua belah pihak sebelum
          masa berlaku berakhir.
        </li>
      </ol>

      {nilaiKerjaSama !== null && (
        <>
          <p className="mt-3 text-center font-semibold">PASAL 3 — NILAI KERJA SAMA</p>
          <p>
            Nilai total kerja sama ini disepakati sebesar <strong>{formatRupiah(nilaiKerjaSama)}</strong>,
            dengan mekanisme pembayaran sesuai kesepakatan tertulis tambahan antara kedua belah pihak.
          </p>
        </>
      )}

      <p className="mt-3 text-center font-semibold">PASAL {nilaiKerjaSama !== null ? "4" : "3"} — HAK DAN KEWAJIBAN PIHAK PERTAMA</p>
      {hakKewajibanPertama.length > 0 ? (
        <ol className="list-decimal space-y-1 pl-6">
          {hakKewajibanPertama.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ol>
      ) : (
        <p>-</p>
      )}

      <p className="mt-3 text-center font-semibold">PASAL {nilaiKerjaSama !== null ? "5" : "4"} — HAK DAN KEWAJIBAN PIHAK KEDUA</p>
      {hakKewajibanKedua.length > 0 ? (
        <ol className="list-decimal space-y-1 pl-6">
          {hakKewajibanKedua.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ol>
      ) : (
        <p>-</p>
      )}

      <p className="mt-3 text-center font-semibold">PASAL {nilaiKerjaSama !== null ? "6" : "5"} — LAIN-LAIN</p>
      <ol className="list-decimal space-y-1 pl-6">
        <li>
          Hal-hal yang belum diatur dalam perjanjian ini akan diatur lebih lanjut berdasarkan
          kesepakatan tertulis tambahan (addendum) antara kedua belah pihak.
        </li>
        <li>
          Segala perselisihan yang timbul dari perjanjian ini akan diselesaikan secara musyawarah
          mufakat. Jika tidak tercapai kesepakatan, akan diselesaikan melalui jalur hukum yang berlaku
          di wilayah Republik Indonesia.
        </li>
      </ol>

      <p className="mt-3">
        Demikian Perjanjian Kerja Sama ini dibuat dan ditandatangani oleh kedua belah pihak dalam
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
