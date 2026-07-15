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

export function OfferingLetterTemplate({
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
  const lamaProbationBulan = Number(values.lamaProbationBulan || 3);
  const tanggalMulaiProbation = values.tanggalMulaiProbation ? new Date(values.tanggalMulaiProbation) : null;
  const tanggalAkhirProbation = tanggalMulaiProbation ? addMonths(tanggalMulaiProbation, lamaProbationBulan) : null;
  const batasKonfirmasiHari = values.batasKonfirmasiHari || "7";

  const gajiPokok = Number(values.gajiPokok || 0);
  const totalTunjangan = Number(values.totalTunjangan || 0);
  const totalGross = gajiPokok + totalTunjangan;
  const rincianTunjangan = splitPoints(values.rincianTunjangan);

  return (
    <LetterheadLayout>
      <div className="flex justify-between">
        <div>
          <p>No : {nomorSuratFull}</p>
          <p>Lamp : -</p>
          <p>Perihal : Surat Penawaran Kerja (Offering Letter)</p>
          <p>Kepada Yth. : Saudara/i {penerimaNama}</p>
          <p>Dari : {signatoryJabatan}</p>
          <p>Tanggal : {tanggalFormatted}</p>
        </div>
      </div>

      <p className="mt-2 font-semibold">I. PENAWARAN POSISI</p>
      <p>Berdasarkan hasil proses seleksi, PT. Banana Digital Boost menawarkan posisi:</p>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="w-48 py-0.5 pl-6 align-top">a. Jabatan</td>
            <td className="py-0.5 align-top">: {values.posisiDitawarkan || "-"}</td>
          </tr>
          <tr>
            <td className="py-0.5 pl-6 align-top">b. Atasan Langsung</td>
            <td className="py-0.5 align-top">: {values.atasanLangsung || "-"}</td>
          </tr>
          <tr>
            <td className="py-0.5 pl-6 align-top">c. Status Awal</td>
            <td className="py-0.5 align-top">: Karyawan Probation ({lamaProbationBulan} bulan)</td>
          </tr>
          <tr>
            <td className="py-0.5 pl-6 align-top">d. Tempat Penempatan</td>
            <td className="py-0.5 align-top">: {values.tempatPenempatan || "-"}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2 font-semibold">II. MASA PROBATION</p>
      <ol className="list-[lower-alpha] space-y-1 pl-6">
        <li>
          Masa probation berlaku mulai{" "}
          <strong>{tanggalMulaiProbation ? formatTanggalIndonesia(tanggalMulaiProbation) : "-"}</strong>{" "}
          hingga <strong>{tanggalAkhirProbation ? formatTanggalIndonesia(tanggalAkhirProbation) : "-"}</strong>.
        </li>
        <li>
          Evaluasi kinerja dilakukan di akhir masa probation. Jika lulus, Anda akan diangkat sebagai{" "}
          {values.statusSetelahProbation || "Karyawan Tetap"} dengan Surat Pengangkatan resmi.
        </li>
        <li>
          Catatan Penting:
          <ol className="list-decimal space-y-1 pl-6">
            <li>
              Perpanjangan masa probation hanya diperbolehkan maksimal 1 bulan sesuai UU Ketenagakerjaan
              No. 13/2003 Pasal 60.
            </li>
            <li>Jika tidak lulus probation, hubungan kerja berakhir tanpa hak pesangon.</li>
          </ol>
        </li>
      </ol>

      <p className="mt-2 font-semibold">III. WAKTU KERJA</p>
      <ol className="list-[lower-alpha] space-y-1 pl-6">
        <li>
          6 hari kerja/minggu:
          <ol className="list-decimal space-y-1 pl-6">
            <li>Senin–Jumat: 09.00–18.00 WIB (termasuk istirahat 1 jam).</li>
            <li>Sabtu: 09.00–15.00 WIB (termasuk istirahat 1 jam).</li>
          </ol>
        </li>
        <li>Total jam kerja/minggu: 40 jam (sesuai batas maksimal UU Ketenagakerjaan).</li>
      </ol>

      <p className="mt-2 font-semibold">IV. KOMPENSASI &amp; TUNJANGAN</p>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="w-48 py-0.5 align-top">Gaji Pokok</td>
            <td className="py-0.5 align-top">: {formatRupiah(gajiPokok)}</td>
          </tr>
          <tr>
            <td className="py-0.5 align-top">Tunjangan Fasilitas</td>
            <td className="py-0.5 align-top">: {formatRupiah(totalTunjangan)}</td>
          </tr>
          <tr>
            <td className="py-0.5 align-top font-semibold">Total Gross</td>
            <td className="py-0.5 align-top font-semibold">: {formatRupiah(totalGross)}</td>
          </tr>
        </tbody>
      </table>
      {rincianTunjangan.length > 0 && (
        <>
          <p className="mt-1">Detail Tunjangan Fasilitas:</p>
          <ul className="list-disc space-y-0.5 pl-6">
            {rincianTunjangan.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-1">
        Setelah Lulus Probation: Total Gaji Tetap <strong>{formatRupiah(Number(values.gajiSetelahProbation || 0))}/bulan</strong>{" "}
        (gaji pokok + tunjangan disesuaikan).
      </p>

      <p className="mt-2 font-semibold">V. BENEFIT LAINNYA</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>Makan Siang Gratis (hari kerja).</li>
        <li>Program Pengembangan Diri: Banana Academy (pelatihan bersertifikat).</li>
        <li>Insentif Tambahan: Bonus kinerja berdasarkan pencapaian target.</li>
        <li>Aktivitas Sosial: Partisipasi dalam program CSR perusahaan.</li>
        <li>
          Kesempatan Karir: Potensi pertumbuhan jabatan berdasarkan performa (termasuk peluang kepemilikan
          saham/co-founder sesuai kebijakan perusahaan).
        </li>
      </ul>

      <p className="mt-2 font-semibold">VI. KETENTUAN PENTING</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>Tunjangan fasilitas bersifat non-permanen dan dapat direview sesuai kebijakan perusahaan.</li>
        <li>Deduksi mess hanya berlaku jika menggunakan fasilitas penginapan perusahaan.</li>
        <li>Penawaran ini berlaku {batasKonfirmasiHari} (tujuh) hari kerja setelah surat diterima.</li>
      </ul>

      <p className="mt-2 font-semibold">VII. KONFIRMASI</p>
      <p>
        Jika menerima penawaran ini, harap menandatangani Duplikat Surat dan mengembalikannya ke HRD dalam{" "}
        {batasKonfirmasiHari} hari kerja sejak surat ini diterima.
      </p>

      <DualSignatureBlock
        tempatTanggal={`Jakarta, ${tanggalFormatted}`}
        headingKanan="Menyetujui"
        companyNama={signatoryNama}
        companyJabatan={signatoryJabatan}
        companySignatureImageUrl={signatureImageUrl}
        companyStampImageUrl={stampImageUrl}
        counterpartyNama={penerimaNama}
      />

      <QrFooter qrDataUrl={qrDataUrl} />
    </LetterheadLayout>
  );
}
