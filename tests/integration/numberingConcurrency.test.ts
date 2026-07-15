import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { generateNomorSurat } from "@/lib/numbering/generateNomorSurat";

// Pool sengaja dibatasi (DB dev gratis ini hanya mengizinkan sedikit koneksi
// non-superuser). Permintaan yang melebihi pool ini akan MENGANTRE untuk
// mendapat koneksi bebas, bukan gagal - itulah kenapa maxWait di bawah
// dilonggarkan. Antrean di level pool ini terpisah dari row-level lock yang
// sedang diuji (yang terjadi di dalam Postgres, di level CounterSurat).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 10 });
const prisma = new PrismaClient({ adapter });

const TX_OPTIONS = { maxWait: 30000, timeout: 30000 };

const DIVISI_A = "TSA";
const DIVISI_B = "TSB";
const JENIS_KODE = "TJ2";

let divisiAId: string;
let divisiBId: string;
let jenisSuratId: string;

beforeAll(async () => {
  const [a, b, jenis] = await Promise.all([
    prisma.divisi.upsert({
      where: { kode: DIVISI_A },
      update: {},
      create: { kode: DIVISI_A, nama: "Divisi Test A" },
    }),
    prisma.divisi.upsert({
      where: { kode: DIVISI_B },
      update: {},
      create: { kode: DIVISI_B, nama: "Divisi Test B" },
    }),
    prisma.jenisSurat.upsert({
      where: { kode: JENIS_KODE },
      update: {},
      create: { kode: JENIS_KODE, nama: "Jenis Test 2", kategori: "INTERNAL" },
    }),
  ]);
  divisiAId = a.id;
  divisiBId = b.id;
  jenisSuratId = jenis.id;
});

afterAll(async () => {
  // Filter hanya by jenisSuratId (bukan juga divisiId) agar sisa row dari
  // percobaan test yang gagal sebelumnya tetap tersapu bersih.
  await prisma.counterSurat.deleteMany({ where: { jenisSuratId } });
  await prisma.jenisSurat.delete({ where: { id: jenisSuratId } });
  await prisma.divisi.deleteMany({ where: { id: { in: [divisiAId, divisiBId] } } });
  await prisma.$disconnect();
});

async function allocate(divisiId: string, tahun: number) {
  return prisma.$transaction(
    (tx) =>
      generateNomorSurat(tx, {
        divisiId,
        jenisSuratId,
        tanggalSurat: new Date(Date.UTC(tahun, 5, 1)),
      }),
    TX_OPTIONS
  );
}

describe("generateNomorSurat - concurrency", () => {
  it("50 alokasi paralel untuk kombinasi yang sama menghasilkan 1..50 tanpa duplikat/gap", async () => {
    const N = 50;
    const tahun = 2030;

    const results = await Promise.all(Array.from({ length: N }, () => allocate(divisiAId, tahun)));
    const nomorUrutSet = new Set(results.map((r) => r.nomorUrut));

    expect(nomorUrutSet.size).toBe(N); // tidak ada duplikat
    expect(Math.min(...nomorUrutSet)).toBe(1);
    expect(Math.max(...nomorUrutSet)).toBe(N); // tidak ada gap (rentang penuh 1..N)

    // nomorSuratFull juga harus unik (constraint @unique lapisan kedua)
    const fullSet = new Set(results.map((r) => r.nomorSuratFull));
    expect(fullSet.size).toBe(N);
  }, 30000);

  it("kombinasi divisi berbeda tidak saling blocking dan tidak saling kontaminasi nomor", async () => {
    const N = 20;
    const tahun = 2031;

    const start = Date.now();
    const [resultsA, resultsB] = await Promise.all([
      Promise.all(Array.from({ length: N }, () => allocate(divisiAId, tahun))),
      Promise.all(Array.from({ length: N }, () => allocate(divisiBId, tahun))),
    ]);
    const concurrentDuration = Date.now() - start;

    const setA = new Set(resultsA.map((r) => r.nomorUrut));
    const setB = new Set(resultsB.map((r) => r.nomorUrut));

    expect(setA.size).toBe(N);
    expect(setB.size).toBe(N);
    expect(Math.max(...setA)).toBe(N);
    expect(Math.max(...setB)).toBe(N);

    // Sanity check non-blocking: menjalankan kedua batch bersamaan tidak boleh
    // memakan waktu mendekati dua kali durasi satu batch saja (yang akan
    // mengindikasikan keduanya berebut lock yang sama).
    const soloStart = Date.now();
    await Promise.all(Array.from({ length: N }, () => allocate(divisiAId, 2032)));
    const soloDuration = Date.now() - soloStart;

    expect(concurrentDuration).toBeLessThan(soloDuration * 1.8);
  }, 30000);
});
