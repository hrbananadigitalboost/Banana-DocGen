// One-off backfill: import riwayat surat manual (spreadsheet sebelum
// aplikasi ini ada) ke LogSurat, supaya (a) riwayatnya terlihat di dashboard,
// dan (b) CounterSurat per (divisi, jenisSurat, tahun) lanjut dari jumlah
// kemunculan riil tiap kombinasi, bukan restart dari 001.
//
// BUKAN bagian prisma/seed.ts (yang idempotent-by-design untuk data
// referensi) - ini backfill sekali pakai untuk data historis nyata.
//
// Jalankan dry-run dulu (default, tidak menulis apa pun):
//   npx tsx scripts/import-riwayat-lama.ts
// Baru eksekusi sungguhan setelah ringkasan dry-run dicek dan oke:
//   DRY_RUN=false npx tsx scripts/import-riwayat-lama.ts
//
// Aman dijalankan ulang untuk baris riwayat (skip kalau nomorSuratFull
// sudah ada) - TAPI langkah cleanup 11 data test di awal cuma jalan sekali
// (guard: abort kalau jumlah LogSurat saat ini bukan persis 11).

import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { Role, KategoriSurat, PenerimaTipe, StatusSurat } from "../src/generated/prisma/enums";
import { RIWAYAT_LAMA } from "./data/riwayatLama";

const DRY_RUN = process.env.DRY_RUN !== "false";

function log(...args: unknown[]) {
  console.log(DRY_RUN ? "[DRY-RUN]" : "[EXEC]", ...args);
}

async function cleanupTestData() {
  const count = await prisma.logSurat.count();
  if (count !== 11) {
    throw new Error(
      `Guard gagal: LogSurat saat ini berjumlah ${count}, bukan 11 (jumlah data test yang diharapkan). ` +
        `Berhenti demi keamanan - cek manual dulu sebelum lanjut (mungkin sudah ada surat asli dibuat lewat app).`
    );
  }
  log(`Menghapus ${count} LogSurat test (+ EmailLog terkait)...`);
  if (!DRY_RUN) {
    await prisma.emailLog.deleteMany({});
    await prisma.logSurat.deleteMany({});
  }
}

async function migrateJenisSurat() {
  log('Rename JenisSurat kode "SPK" ("Surat Perintah Kerja") -> "SPRK"...');
  if (!DRY_RUN) {
    await prisma.jenisSurat.update({ where: { kode: "SPK" }, data: { kode: "SPRK" } });
  }

  log('Buat JenisSurat "SPK" (makna baru: Surat Pengangkatan Karyawan, placeholder, isActive:false)...');
  log('Buat JenisSurat "SU" (Surat Undangan, placeholder, isActive:false)...');
  if (!DRY_RUN) {
    const spk = await prisma.jenisSurat.create({
      data: { kode: "SPK", nama: "Surat Pengangkatan Karyawan", kategori: KategoriSurat.INTERNAL, isActive: false },
    });
    const su = await prisma.jenisSurat.create({
      data: { kode: "SU", nama: "Surat Undangan", kategori: KategoriSurat.INTERNAL, isActive: false },
    });
    await prisma.suratTemplate.create({
      data: {
        jenisSuratId: spk.id,
        versi: 1,
        namaTemplate: "(Riwayat historis - belum ada form aktif)",
        componentKey: "SPK_HISTORIS_v1",
        formSchemaJson: { fields: [] },
        isActive: false,
      },
    });
    await prisma.suratTemplate.create({
      data: {
        jenisSuratId: su.id,
        versi: 1,
        namaTemplate: "(Riwayat historis - belum ada form aktif)",
        componentKey: "SU_HISTORIS_v1",
        formSchemaJson: { fields: [] },
        isActive: false,
      },
    });
  }
}

async function ensureHrdImportUser(): Promise<string> {
  const email = "hrd.import@bananadigitalboost.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    log(`User "HRD Import" sudah ada (${existing.id}), pakai yang itu.`);
    return existing.id;
  }
  log('Buat user baru "HRD Import" (role HRD)...');
  if (DRY_RUN) return "DRY_RUN_PLACEHOLDER_USER_ID";

  const divisiHrd = await prisma.divisi.findUniqueOrThrow({ where: { kode: "HRD" } });
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ubah-password-ini";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const user = await prisma.user.create({
    data: { namaLengkap: "HRD Import", email, role: Role.HRD, divisiId: divisiHrd.id, passwordHash },
  });
  return user.id;
}

async function ensureSignatoryFerry(): Promise<string> {
  const ferry = await prisma.signatory.findFirstOrThrow({
    where: { nama: { contains: "Ferry Ariessahi" } },
  });
  return ferry.id;
}

function parseNomorSurat(nomorSuratFull: string): { nomorUrut: number; bulanRomawi: string; tahun: number } | null {
  const match = nomorSuratFull.match(/^(\d+)\/BDB\/[A-Z]+-[A-Z]+\/([IVXLCDM]+)\/(\d{4})/);
  if (!match) return null;
  return { nomorUrut: Number(match[1]), bulanRomawi: match[2], tahun: Number(match[3]) };
}

async function importRows(hrdImportUserId: string, signatoryId: string) {
  const divisiCache = new Map<string, string>();
  const jenisCache = new Map<string, { id: string; templateId: string }>();

  const divisiList = await prisma.divisi.findMany();
  for (const d of divisiList) divisiCache.set(d.kode, d.id);

  // Per jenisSurat, pakai template AKTIF kalau ada (10 jenis surat normal
  // yang muncul di riwayat), atau template placeholder isActive:false
  // (khusus SPK/SU historis yang belum punya form kerja).
  const jenisList = await prisma.jenisSurat.findMany({
    include: { templates: { orderBy: [{ isActive: "desc" }, { versi: "desc" }], take: 1 } },
  });
  for (const j of jenisList) {
    const template = j.templates[0];
    if (template) jenisCache.set(j.kode, { id: j.id, templateId: template.id });
  }

  let created = 0;
  let skipped = 0;
  const counterOccurrence = new Map<string, number>(); // key: divisiId|jenisSuratId|tahun -> count

  for (const row of RIWAYAT_LAMA) {
    const parsed =
      row.overrideNomorUrut !== undefined
        ? { nomorUrut: row.overrideNomorUrut, bulanRomawi: row.overrideBulanRomawi!, tahun: row.overrideTahun! }
        : parseNomorSurat(row.nomorSuratFull);
    const divisiId = divisiCache.get(row.divisiKode);
    const jenis = jenisCache.get(row.jenisKode);

    if (!divisiId || !jenis || !parsed) {
      console.warn(`  SKIP (data tidak lengkap): ${row.nomorSuratFull} - divisi=${!!divisiId} jenis=${!!jenis} parsed=${!!parsed}`);
      skipped++;
      continue;
    }

    if (!row.isAnomali) {
      const key = `${divisiId}|${jenis.id}|${parsed.tahun}`;
      counterOccurrence.set(key, (counterOccurrence.get(key) ?? 0) + 1);
    }

    const existing = await prisma.logSurat.findUnique({ where: { nomorSuratFull: row.nomorSuratFull } });
    if (existing) {
      skipped++;
      continue;
    }

    log(`Import: ${row.nomorSuratFull} (${row.divisiKode}-${row.jenisKode}, ${row.tanggalIso}) - ${row.keterangan}`);
    if (!DRY_RUN) {
      await prisma.logSurat.create({
        data: {
          nomorUrut: parsed.nomorUrut,
          nomorSuratFull: row.nomorSuratFull,
          tahun: parsed.tahun,
          bulanRomawi: parsed.bulanRomawi,
          divisiId,
          jenisSuratId: jenis.id,
          templateId: jenis.templateId,
          tanggalSurat: new Date(row.tanggalIso),
          penerimaTipe: PenerimaTipe.MANUAL,
          penerimaNamaManual: row.keterangan,
          signatoryId,
          formDataJson: {
            catatanImport: row.keterangan,
            sumberImport: "Rekapitulasi Link PT. Banana Digital Boost (manual, sebelum aplikasi)",
          },
          filePdfUrl: null,
          status: StatusSurat.VALID,
          createdById: hrdImportUserId,
        },
      });
    }
    created++;
  }

  log(`Selesai import baris: ${created} dibuat, ${skipped} dilewati (sudah ada/data tidak lengkap).`);
  return { counterOccurrence, divisiCache, jenisCache };
}

async function reconcileCounters(counterOccurrence: Map<string, number>) {
  log(`Menyesuaikan CounterSurat untuk ${counterOccurrence.size} kombinasi divisi+jenis+tahun...`);
  for (const [key, count] of counterOccurrence) {
    const [divisiId, jenisSuratId, tahunStr] = key.split("|");
    const tahun = Number(tahunStr);

    const existing = await prisma.counterSurat.findUnique({
      where: { divisiId_jenisSuratId_tahun: { divisiId, jenisSuratId, tahun } },
    });
    const newLastNumber = Math.max(existing?.lastNumber ?? 0, count);

    log(
      `  ${divisiId.slice(0, 6)}.../${jenisSuratId.slice(0, 6)}.../${tahun}: existing=${existing?.lastNumber ?? 0} historis=${count} -> ${newLastNumber}`
    );
    if (!DRY_RUN) {
      await prisma.counterSurat.upsert({
        where: { divisiId_jenisSuratId_tahun: { divisiId, jenisSuratId, tahun } },
        update: { lastNumber: newLastNumber },
        create: { divisiId, jenisSuratId, tahun, lastNumber: newLastNumber },
      });
    }
  }
}

async function main() {
  console.log(`=== Import Riwayat Lama (${DRY_RUN ? "DRY RUN - tidak menulis apa pun" : "EKSEKUSI SUNGGUHAN"}) ===`);
  console.log(`Total baris di data: ${RIWAYAT_LAMA.length}`);

  await cleanupTestData();
  await migrateJenisSurat();
  const hrdImportUserId = await ensureHrdImportUser();
  const signatoryId = await ensureSignatoryFerry();
  const { counterOccurrence } = await importRows(hrdImportUserId, signatoryId);
  await reconcileCounters(counterOccurrence);

  console.log("=== Selesai ===");
  if (DRY_RUN) {
    console.log('Ini baru DRY RUN. Jalankan lagi dengan "DRY_RUN=false npx tsx scripts/import-riwayat-lama.ts" untuk eksekusi sungguhan.');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
