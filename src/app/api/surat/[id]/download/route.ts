import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { readSuratPdf } from "@/lib/storage/fileStorage";
import { canViewSuratCreatedBy } from "@/lib/rbac/permissions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const logSurat = await prisma.logSurat.findUnique({
    where: { id },
    include: { jenisSurat: true, createdBy: true },
  });
  if (!logSurat || !logSurat.filePdfUrl) {
    return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 });
  }
  if (!canViewSuratCreatedBy(session.user.role, logSurat.createdBy.role)) {
    return NextResponse.json({ error: "Tidak punya akses ke surat ini." }, { status: 403 });
  }

  try {
    const buffer = await readSuratPdf(logSurat.filePdfUrl);
    const safeName = logSurat.nomorSuratFull.replace(/[^a-zA-Z0-9-]/g, "_");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeName}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File PDF tidak ditemukan di storage." }, { status: 404 });
  }
}
