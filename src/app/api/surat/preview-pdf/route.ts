import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { renderSuratPdf } from "@/lib/pdf/renderSuratPdf";

const bodySchema = z.object({
  componentKey: z.string(),
  nomorSuratFull: z.string(),
  tanggalSurat: z.coerce.date(),
  values: z.record(z.string(), z.string()),
  penerimaNama: z.string(),
  penerimaJabatan: z.string().nullable().optional(),
  penerimaDivisi: z.string().nullable().optional(),
  signatoryNama: z.string(),
  signatoryJabatan: z.string(),
  signatureImageUrl: z.string(),
  stampImageUrl: z.string().nullable().optional(),
  qrDataUrl: z.string().nullable().optional(),
});

/**
 * Render PDF sungguhan dari template + data, tanpa menyimpan apapun ke
 * LogSurat (nomor & logging resmi baru terjadi di Fase 5). Berguna sebagai
 * "preview PDF asli" terpisah dari live-preview HTML, dan sebagai jalur test
 * untuk pipeline renderSuratPdf yang harus berjalan dalam proses server yang
 * sama (lihat catatan single-process di renderCache.ts).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { componentKey, ...props } = parsed.data;

  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL;

  try {
    const pdfBuffer = await renderSuratPdf(componentKey, props, { baseUrl });
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Render PDF gagal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
