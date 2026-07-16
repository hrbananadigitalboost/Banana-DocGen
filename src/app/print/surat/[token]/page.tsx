import { notFound } from "next/navigation";
import { takeRenderPayload } from "@/lib/pdf/renderCache";
import { templateRegistry } from "@/components/templates/surat/templateRegistry";
import { PrintModeProvider } from "@/components/templates/surat/PrintModeProvider";
import type { RenderMode } from "@/components/templates/surat/renderModeContext";

type PrintSuratPageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ mode?: string }>;
};

// Rute internal khusus dikunjungi Puppeteer (lihat renderSuratPdf.ts,
// renderSuratDocx.ts) - tidak ditautkan dari navigasi manapun dan tidak
// butuh session (lihat proxy.ts). Payload diambil sekali pakai dari cache
// file temp lalu langsung dihapus.
//
// mode default "print" (dipakai renderSuratPdf.ts - kop surat TIDAK inline,
// jadi page header Puppeteer sendiri). ?mode=preview dipakai renderSuratDocx.ts
// - DOCX tidak punya padanan "page header" Puppeteer, jadi kop surat perlu
// dirender inline di body seperti live preview browser.
export default async function PrintSuratPage({ params, searchParams }: PrintSuratPageProps) {
  const { token } = await params;
  const { mode: modeParam } = await searchParams;
  const payload = await takeRenderPayload(token);
  if (!payload) notFound();

  const TemplateComponent = templateRegistry[payload.componentKey];
  if (!TemplateComponent) notFound();

  const mode: RenderMode = modeParam === "preview" ? "preview" : "print";

  return (
    <PrintModeProvider mode={mode}>
      <TemplateComponent {...payload.props} />
    </PrintModeProvider>
  );
}
