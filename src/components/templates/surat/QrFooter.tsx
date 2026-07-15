export function QrFooter({ qrDataUrl }: { qrDataUrl?: string | null }) {
  return (
    <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-500">
      {qrDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrDataUrl} alt="QR Verifikasi" style={{ width: "64px", height: "64px" }} />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-dashed border-slate-300 text-center text-[8px] text-slate-400">
          QR saat PDF final
        </div>
      )}
      <p>Pindai kode QR untuk memverifikasi keaslian dokumen ini.</p>
    </div>
  );
}
