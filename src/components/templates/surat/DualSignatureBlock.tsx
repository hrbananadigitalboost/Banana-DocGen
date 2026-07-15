// Dipakai untuk surat yang butuh tanda tangan DUA pihak berdampingan (mis.
// Offering Letter yang disetujui kandidat, Kontrak Kerja Pihak Pertama/Kedua).
// Sisi kanan (counterparty) SENGAJA tidak ada gambar tanda tangan - itu area
// kosong untuk ditandatangani manual oleh pihak kedua di atas kertas/PDF cetak.

export function DualSignatureBlock({
  tempatTanggal,
  headingKiri,
  companyEntitas,
  companyNama,
  companyJabatan,
  companySignatureImageUrl,
  companyStampImageUrl,
  headingKanan,
  counterpartyEntitas,
  counterpartyNama,
}: {
  tempatTanggal: string;
  headingKiri?: string;
  companyEntitas?: string;
  companyNama: string;
  companyJabatan: string;
  companySignatureImageUrl: string;
  companyStampImageUrl?: string | null;
  headingKanan?: string;
  counterpartyEntitas?: string;
  counterpartyNama: string;
}) {
  return (
    <div className="mt-8 flex flex-col gap-4">
      <p>{tempatTanggal}</p>
      <div className="flex justify-between gap-8">
        <div className="flex w-64 flex-col items-start gap-1 text-left">
          {headingKiri && <p>{headingKiri}</p>}
          {companyEntitas && <p>{companyEntitas}</p>}
          <div className="relative flex h-24 w-40 items-center justify-start">
            {companyStampImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyStampImageUrl}
                alt=""
                style={{
                  position: "absolute",
                  width: "130px",
                  opacity: 0.5,
                  transform: "translate(-10px, -6px)",
                }}
              />
            )}
            {companySignatureImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companySignatureImageUrl}
                alt={`Tanda tangan ${companyNama}`}
                style={{ maxHeight: "80px", maxWidth: "140px" }}
              />
            )}
          </div>
          <p className="font-semibold underline">{companyNama}</p>
          <p>{companyJabatan}</p>
        </div>

        <div className="flex w-64 flex-col items-start gap-1 text-left">
          {headingKanan && <p>{headingKanan}</p>}
          {counterpartyEntitas && <p>{counterpartyEntitas}</p>}
          <div className="h-24 w-40" />
          <p className="font-semibold underline">{counterpartyNama}</p>
          <p className="text-xs text-slate-500">(tanda tangan basah - diisi manual)</p>
        </div>
      </div>
    </div>
  );
}
