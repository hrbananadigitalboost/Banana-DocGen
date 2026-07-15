-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HRD', 'DIREKSI', 'FINANCE_SALES', 'AE', 'VIEWER');

-- CreateEnum
CREATE TYPE "KategoriSurat" AS ENUM ('INTERNAL', 'KOMERSIAL', 'EDARAN');

-- CreateEnum
CREATE TYPE "StatusSurat" AS ENUM ('GENERATING', 'VALID', 'VOID', 'FAILED');

-- CreateEnum
CREATE TYPE "PenerimaTipe" AS ENUM ('KARYAWAN', 'KLIEN', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "divisiId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Divisi" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Divisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JenisSurat" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" "KategoriSurat" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "JenisSurat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratTemplate" (
    "id" TEXT NOT NULL,
    "jenisSuratId" TEXT NOT NULL,
    "versi" INTEGER NOT NULL,
    "namaTemplate" TEXT NOT NULL,
    "componentKey" TEXT NOT NULL,
    "formSchemaJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuratTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterKaryawan" (
    "id" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "nikKtp" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "divisiId" TEXT,
    "alamat" TEXT,
    "email" TEXT,
    "telepon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterKaryawan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterKlien" (
    "id" TEXT NOT NULL,
    "namaPerusahaan" TEXT,
    "namaKontak" TEXT NOT NULL,
    "jenisKlien" TEXT NOT NULL,
    "alamat" TEXT,
    "email" TEXT,
    "telepon" TEXT,
    "npwp" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterKlien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signatory" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "signatureImageUrl" TEXT NOT NULL,
    "stampImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Signatory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounterSurat" (
    "id" TEXT NOT NULL,
    "divisiId" TEXT NOT NULL,
    "jenisSuratId" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounterSurat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogSurat" (
    "id" TEXT NOT NULL,
    "nomorUrut" INTEGER NOT NULL,
    "nomorSuratFull" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "bulanRomawi" TEXT NOT NULL,
    "divisiId" TEXT NOT NULL,
    "jenisSuratId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "tanggalSurat" TIMESTAMP(3) NOT NULL,
    "penerimaTipe" "PenerimaTipe" NOT NULL,
    "penerimaKaryawanId" TEXT,
    "penerimaKlienId" TEXT,
    "penerimaNamaManual" TEXT,
    "keterangan" TEXT,
    "signatoryId" TEXT NOT NULL,
    "formDataJson" JSONB NOT NULL,
    "filePdfUrl" TEXT,
    "qrToken" TEXT NOT NULL,
    "status" "StatusSurat" NOT NULL DEFAULT 'GENERATING',
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidReason" TEXT,
    "revisiDariId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogSurat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "logSuratId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Divisi_kode_key" ON "Divisi"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "JenisSurat_kode_key" ON "JenisSurat"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "SuratTemplate_jenisSuratId_versi_key" ON "SuratTemplate"("jenisSuratId", "versi");

-- CreateIndex
CREATE UNIQUE INDEX "CounterSurat_divisiId_jenisSuratId_tahun_key" ON "CounterSurat"("divisiId", "jenisSuratId", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "LogSurat_nomorSuratFull_key" ON "LogSurat"("nomorSuratFull");

-- CreateIndex
CREATE UNIQUE INDEX "LogSurat_qrToken_key" ON "LogSurat"("qrToken");

-- CreateIndex
CREATE INDEX "LogSurat_tanggalSurat_idx" ON "LogSurat"("tanggalSurat");

-- CreateIndex
CREATE INDEX "LogSurat_penerimaNamaManual_idx" ON "LogSurat"("penerimaNamaManual");

-- CreateIndex
CREATE INDEX "LogSurat_status_idx" ON "LogSurat"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_divisiId_fkey" FOREIGN KEY ("divisiId") REFERENCES "Divisi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratTemplate" ADD CONSTRAINT "SuratTemplate_jenisSuratId_fkey" FOREIGN KEY ("jenisSuratId") REFERENCES "JenisSurat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterKaryawan" ADD CONSTRAINT "MasterKaryawan_divisiId_fkey" FOREIGN KEY ("divisiId") REFERENCES "Divisi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterSurat" ADD CONSTRAINT "CounterSurat_divisiId_fkey" FOREIGN KEY ("divisiId") REFERENCES "Divisi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterSurat" ADD CONSTRAINT "CounterSurat_jenisSuratId_fkey" FOREIGN KEY ("jenisSuratId") REFERENCES "JenisSurat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogSurat" ADD CONSTRAINT "LogSurat_divisiId_fkey" FOREIGN KEY ("divisiId") REFERENCES "Divisi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogSurat" ADD CONSTRAINT "LogSurat_jenisSuratId_fkey" FOREIGN KEY ("jenisSuratId") REFERENCES "JenisSurat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogSurat" ADD CONSTRAINT "LogSurat_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SuratTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogSurat" ADD CONSTRAINT "LogSurat_penerimaKaryawanId_fkey" FOREIGN KEY ("penerimaKaryawanId") REFERENCES "MasterKaryawan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogSurat" ADD CONSTRAINT "LogSurat_penerimaKlienId_fkey" FOREIGN KEY ("penerimaKlienId") REFERENCES "MasterKlien"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogSurat" ADD CONSTRAINT "LogSurat_signatoryId_fkey" FOREIGN KEY ("signatoryId") REFERENCES "Signatory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogSurat" ADD CONSTRAINT "LogSurat_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogSurat" ADD CONSTRAINT "LogSurat_revisiDariId_fkey" FOREIGN KEY ("revisiDariId") REFERENCES "LogSurat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogSurat" ADD CONSTRAINT "LogSurat_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_logSuratId_fkey" FOREIGN KEY ("logSuratId") REFERENCES "LogSurat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
