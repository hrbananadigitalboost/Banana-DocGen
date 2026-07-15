import { notFound } from "next/navigation";
import { takeRenderPayload } from "@/lib/pdf/renderCache";
import { templateRegistry } from "@/components/templates/surat/templateRegistry";
import { PrintModeProvider } from "@/components/templates/surat/PrintModeProvider";

type PrintSuratPageProps = {
  params: Promise<{ token: string }>;
};

// Rute internal khusus dikunjungi Puppeteer (lihat renderSuratPdf.ts) - tidak
// ditautkan dari navigasi manapun dan tidak butuh session (lihat proxy.ts).
// Payload diambil sekali pakai dari cache file temp lalu langsung dihapus.
export default async function PrintSuratPage({ params }: PrintSuratPageProps) {
  const { token } = await params;
  const payload = await takeRenderPayload(token);
  if (!payload) notFound();

  const TemplateComponent = templateRegistry[payload.componentKey];
  if (!TemplateComponent) notFound();

  return (
    <PrintModeProvider mode="print">
      <TemplateComponent {...payload.props} />
    </PrintModeProvider>
  );
}
