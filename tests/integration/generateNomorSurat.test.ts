import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { generateNomorSurat } from "@/lib/numbering/generateNomorSurat";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Divisi/JenisSurat khusus test agar tidak mengganggu CounterSurat data nyata,
// dan mudah dibersihkan lagi setelah selesai.
const TEST_DIVISI_KODE = "TST";
const TEST_JENIS_KODE = "TJ1";

let divisiId: string;
let jenisSuratId: string;

beforeAll(async () => {
  const divisi = await prisma.divisi.upsert({
    where: { kode: TEST_DIVISI_KODE },
    update: {},
    create: { kode: TEST_DIVISI_KODE, nama: "Divisi Test" },
  });
  divisiId = divisi.id;

  const jenis = await prisma.jenisSurat.upsert({
    where: { kode: TEST_JENIS_KODE },
    update: {},
    create: { kode: TEST_JENIS_KODE, nama: "Jenis Test", kategori: "INTERNAL" },
  });
  jenisSuratId = jenis.id;
});

afterAll(async () => {
  await prisma.counterSurat.deleteMany({ where: { divisiId, jenisSuratId } });
  await prisma.jenisSurat.delete({ where: { id: jenisSuratId } });
  await prisma.divisi.delete({ where: { id: divisiId } });
  await prisma.$disconnect();
});

describe("generateNomorSurat", () => {
  it("format nomorSuratFull sesuai spesifikasi PRD", async () => {
    const result = await prisma.$transaction((tx) =>
      generateNomorSurat(tx, {
        divisiId,
        jenisSuratId,
        tanggalSurat: new Date(Date.UTC(2026, 3, 15)), // April -> IV
      })
    );

    expect(result.bulanRomawi).toBe("IV");
    expect(result.tahun).toBe(2026);
    expect(result.nomorSuratFull).toBe(
      `${String(result.nomorUrut).padStart(3, "0")}/BDB/${TEST_DIVISI_KODE}-${TEST_JENIS_KODE}/IV/2026`
    );
  });

  it("nomor urut increment sequential untuk panggilan berurutan", async () => {
    const tanggal = new Date(Date.UTC(2027, 0, 10));
    const first = await prisma.$transaction((tx) =>
      generateNomorSurat(tx, { divisiId, jenisSuratId, tanggalSurat: tanggal })
    );
    const second = await prisma.$transaction((tx) =>
      generateNomorSurat(tx, { divisiId, jenisSuratId, tanggalSurat: tanggal })
    );

    expect(second.nomorUrut).toBe(first.nomorUrut + 1);
  });

  it("counter berbeda per tahun (reset otomatis)", async () => {
    const result2028 = await prisma.$transaction((tx) =>
      generateNomorSurat(tx, {
        divisiId,
        jenisSuratId,
        tanggalSurat: new Date(Date.UTC(2028, 0, 1)),
      })
    );

    expect(result2028.nomorUrut).toBe(1);
  });
});
