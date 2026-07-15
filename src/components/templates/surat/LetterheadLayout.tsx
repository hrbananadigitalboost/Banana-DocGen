"use client";

// Plain <img> (bukan next/image) sengaja dipakai - komponen ini dirender baik
// di live preview browser maupun (via /print/surat/[token]) untuk pipeline
// Puppeteer PDF, di luar konteks runtime Next.js Image.

import { useRenderMode } from "./renderModeContext";

export function LetterheadLayout({
  children,
  pageBreakBefore,
}: {
  children: React.ReactNode;
  /** Set true untuk surat multi-halaman - halaman ini dipaksa mulai di kertas baru saat dicetak/PDF. */
  pageBreakBefore?: boolean;
}) {
  const mode = useRenderMode();

  return (
    <div
      className="mx-auto flex flex-col bg-white text-slate-900"
      style={{
        width: "210mm",
        // minHeight 297mm hanya untuk preview browser (biar terlihat penuh
        // satu halaman A4). Di mode print, Puppeteer sudah punya margin
        // atas/bawah sendiri untuk kop surat + footer (lihat renderSuratPdf.ts)
        // - kalau dipaksa 297mm juga di sini, kontennya pasti meluber ke
        // halaman kedua yang kosong karena 297mm > (297mm - margin atas - margin bawah).
        minHeight: mode === "preview" ? "297mm" : undefined,
        fontFamily: "'Times New Roman', Times, serif",
        breakBefore: pageBreakBefore ? "page" : undefined,
      }}
    >
      {mode === "preview" && (
        // Mode print TIDAK merender kop surat inline - Puppeteer menambahkannya
        // sebagai page header yang otomatis berulang di setiap halaman fisik
        // (lihat renderSuratPdf.ts), termasuk untuk halaman yang meluber di
        // luar breakBefore manual manapun.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/assets/letterhead/kop-surat.png"
          alt="Kop Surat PT. Banana Digital Boost"
          style={{ width: "100%", display: "block" }}
        />
      )}
      <div className="flex flex-1 flex-col gap-4 px-16 py-8 text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}
