import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { isRestrictedToKomersial } from "@/lib/rbac/permissions";
import { KategoriSurat, type Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const dari = searchParams.get("dari") ?? undefined;
  const sampai = searchParams.get("sampai") ?? undefined;

  const role = session.user.role;
  const kategoriFilter = isRestrictedToKomersial(role) ? KategoriSurat.KOMERSIAL : undefined;

  const where: Prisma.LogSuratWhereInput = {
    ...(kategoriFilter && { jenisSurat: { kategori: kategoriFilter } }),
    ...(q && {
      OR: [
        { nomorSuratFull: { contains: q, mode: "insensitive" } },
        { penerimaNamaManual: { contains: q, mode: "insensitive" } },
        { penerimaKaryawan: { namaLengkap: { contains: q, mode: "insensitive" } } },
        { penerimaKlien: { namaKontak: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...((dari || sampai) && {
      tanggalSurat: {
        ...(dari && { gte: new Date(dari) }),
        ...(sampai && { lte: new Date(sampai) }),
      },
    }),
  };

  const logs = await prisma.logSurat.findMany({
    where,
    include: { divisi: true, jenisSurat: true, penerimaKaryawan: true, penerimaKlien: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Rekap Surat");
  sheet.columns = [
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "Divisi", key: "divisi", width: 10 },
    { header: "Jenis Surat", key: "jenis", width: 14 },
    { header: "Nomor Surat", key: "nomor", width: 28 },
    { header: "Penerima", key: "penerima", width: 24 },
    { header: "Pembuat", key: "pembuat", width: 20 },
    { header: "Status", key: "status", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const log of logs) {
    const penerima = log.penerimaKaryawan?.namaLengkap ?? log.penerimaKlien?.namaKontak ?? log.penerimaNamaManual ?? "-";
    sheet.addRow({
      tanggal: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(log.tanggalSurat),
      divisi: log.divisi.kode,
      jenis: log.jenisSurat.kode,
      nomor: log.nomorSuratFull,
      penerima,
      pembuat: log.createdBy.namaLengkap,
      status: log.status,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rekap-surat-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
