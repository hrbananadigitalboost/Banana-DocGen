import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { canViewSuratCreatedBy } from "@/lib/rbac/permissions";
import { renderSuratDocx } from "@/lib/docx/renderSuratDocx";
import { generateQrDataUrl } from "@/lib/qr/generateQr";
import type { SuratTemplateProps } from "@/components/templates/surat/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Export surat ke .docx supaya user bisa revisi sendiri kesalahan kecil
 * (typo dsb) tanpa balik ke aplikasi. Beda dari download PDF (route
 * bersebelahan), .docx TIDAK disimpan permanen di storage - digenerate
 * on-demand tiap diminta, karena sifatnya alat bantu revisi, bukan arsip
 * resmi (arsip resminya tetap PDF yang tersimpan saat generate).
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const logSurat = await prisma.logSurat.findUnique({
    where: { id },
    include: {
      jenisSurat: true,
      createdBy: true,
      template: true,
      signatory: true,
      penerimaKaryawan: { include: { divisi: true } },
      penerimaKlien: true,
    },
  });
  // Sama seperti route download PDF: butuh filePdfUrl (bukan cuma status
  // VALID) sebagai penanda surat ini benar-benar digenerate lewat app -
  // riwayat hasil import manual (lihat scripts/import-riwayat-lama.ts) VALID
  // tapi formDataJson-nya cuma catatan generik, bukan data form terstruktur
  // yang bisa dirender ulang jadi dokumen yang masuk akal.
  if (!logSurat || logSurat.status !== "VALID" || !logSurat.filePdfUrl) {
    return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 });
  }
  if (!canViewSuratCreatedBy(session.user.role, logSurat.createdBy.role)) {
    return NextResponse.json({ error: "Tidak punya akses ke surat ini." }, { status: 403 });
  }

  try {
    const hdrs = await headers();
    const host = hdrs.get("host");
    const protocol = hdrs.get("x-forwarded-proto") ?? "http";
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL;

    const penerimaNama =
      logSurat.penerimaKaryawan?.namaLengkap ?? logSurat.penerimaKlien?.namaKontak ?? logSurat.penerimaNamaManual ?? "-";
    const verifyUrl = `${baseUrl}/verify/${logSurat.qrToken}`;
    const qrDataUrl = await generateQrDataUrl(verifyUrl);

    const props: SuratTemplateProps = {
      nomorSuratFull: logSurat.nomorSuratFull,
      tanggalSurat: logSurat.tanggalSurat,
      values: logSurat.formDataJson as Record<string, string>,
      penerimaNama,
      penerimaJabatan: logSurat.penerimaKaryawan?.jabatan ?? null,
      penerimaDivisi: logSurat.penerimaKaryawan?.divisi?.nama ?? null,
      signatoryNama: logSurat.signatory.nama,
      signatoryJabatan: logSurat.signatory.jabatan,
      signatureImageUrl: logSurat.signatory.signatureImageUrl,
      stampImageUrl: logSurat.signatory.stampImageUrl,
      qrDataUrl,
    };

    const docxBuffer = await renderSuratDocx(logSurat.template.componentKey, props, { baseUrl });
    const safeName = logSurat.nomorSuratFull.replace(/[^a-zA-Z0-9-]/g, "_");

    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}.docx"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membuat file Word.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
