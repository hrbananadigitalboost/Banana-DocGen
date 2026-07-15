import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const testDivisiKodes = ["TST", "TSA", "TSB"];
const testJenisKodes = ["TJ1", "TJ2"];

async function main() {
  const divisi = await prisma.divisi.findMany({ where: { kode: { in: testDivisiKodes } } });
  const jenis = await prisma.jenisSurat.findMany({ where: { kode: { in: testJenisKodes } } });

  await prisma.counterSurat.deleteMany({
    where: {
      OR: [
        { divisiId: { in: divisi.map((d) => d.id) } },
        { jenisSuratId: { in: jenis.map((j) => j.id) } },
      ],
    },
  });
  await prisma.jenisSurat.deleteMany({ where: { id: { in: jenis.map((j) => j.id) } } });
  await prisma.divisi.deleteMany({ where: { id: { in: divisi.map((d) => d.id) } } });

  console.log("Cleaned:", { divisi: divisi.length, jenis: jenis.length });
}

main().finally(() => prisma.$disconnect());
