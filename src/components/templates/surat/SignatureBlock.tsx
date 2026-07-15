export function SignatureBlock({
  tempatTanggal,
  entitas,
  jabatan,
  nama,
  signatureImageUrl,
  stampImageUrl,
}: {
  tempatTanggal: string;
  /** Baris atas nama entitas yang menandatangani, mis. "Manajemen PT. Banana Digital Boost," - opsional. */
  entitas?: string;
  jabatan: string;
  nama: string;
  signatureImageUrl: string;
  stampImageUrl?: string | null;
}) {
  return (
    <div className="mt-8 flex w-56 flex-col items-center gap-1 self-end text-center">
      <p className="w-full text-left">{tempatTanggal}</p>
      {entitas && <p className="w-full text-left">{entitas}</p>}
      <div className="relative flex h-24 w-40 items-center justify-center">
        {stampImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stampImageUrl}
            alt=""
            style={{
              position: "absolute",
              width: "130px",
              opacity: 0.5,
              transform: "translate(-10px, -6px)",
            }}
          />
        )}
        {signatureImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signatureImageUrl}
            alt={`Tanda tangan ${nama}`}
            style={{ maxHeight: "80px", maxWidth: "140px" }}
          />
        )}
      </div>
      <p className="w-full text-left font-semibold underline">{nama}</p>
      <p className="w-full text-left">{jabatan}</p>
    </div>
  );
}
