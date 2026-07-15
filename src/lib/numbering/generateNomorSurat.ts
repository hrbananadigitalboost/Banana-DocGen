import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { toRomanMonth } from "./romanNumeral";

export type GenerateNomorSuratParams = {
  divisiId: string;
  jenisSuratId: string;
  tanggalSurat: Date;
};

export type NomorSuratResult = {
  nomorUrut: number;
  nomorSuratFull: string;
  tahun: number;
  bulanRomawi: string;
};

/**
 * Alokasi nomor surat berikutnya untuk kombinasi (divisi, jenisSurat, tahun).
 *
 * Harus dipanggil di dalam `prisma.$transaction`. Postgres mengambil row-level
 * lock hanya pada baris CounterSurat yang relevan (via INSERT ... ON CONFLICT
 * DO UPDATE), sehingga request untuk kombinasi berbeda tetap berjalan paralel
 * penuh, sementara request untuk kombinasi yang sama diserialisasi otomatis.
 *
 * Nomor yang sudah dialokasikan tidak pernah di-rollback/dipakai ulang, bahkan
 * jika langkah setelahnya (render PDF, dsb) gagal - lihat Fase 5 untuk pola
 * retry-PDF-saja pada nomor yang sudah "terbakar".
 */
export async function generateNomorSurat(
  tx: Prisma.TransactionClient,
  params: GenerateNomorSuratParams
): Promise<NomorSuratResult> {
  const tahun = params.tanggalSurat.getFullYear();
  const bulanRomawi = toRomanMonth(params.tanggalSurat.getMonth() + 1);

  const rows = await tx.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO "CounterSurat" (id, "divisiId", "jenisSuratId", tahun, "lastNumber", "updatedAt")
    VALUES (${randomUUID()}, ${params.divisiId}, ${params.jenisSuratId}, ${tahun}, 1, now())
    ON CONFLICT ("divisiId", "jenisSuratId", tahun)
    DO UPDATE SET "lastNumber" = "CounterSurat"."lastNumber" + 1, "updatedAt" = now()
    RETURNING "lastNumber";
  `;
  const nomorUrut = rows[0].lastNumber;

  const [divisi, jenis] = await Promise.all([
    tx.divisi.findUniqueOrThrow({ where: { id: params.divisiId } }),
    tx.jenisSurat.findUniqueOrThrow({ where: { id: params.jenisSuratId } }),
  ]);

  const nomorSuratFull = `${String(nomorUrut).padStart(3, "0")}/BDB/${divisi.kode}-${jenis.kode}/${bulanRomawi}/${tahun}`;

  return { nomorUrut, nomorSuratFull, tahun, bulanRomawi };
}
