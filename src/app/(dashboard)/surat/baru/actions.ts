"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { canManageKategori } from "@/lib/rbac/permissions";
import { generateNomorSurat } from "@/lib/numbering/generateNomorSurat";
import { renderSuratPdf } from "@/lib/pdf/renderSuratPdf";
import { generateQrDataUrl } from "@/lib/qr/generateQr";
import { saveSuratPdf } from "@/lib/storage/fileStorage";
import { PenerimaTipe, StatusSurat } from "@/generated/prisma/enums";
import type { SuratTemplateProps } from "@/components/templates/surat/types";

export type GenerateSuratInput = {
  divisiId: string;
  jenisSuratId: string;
  templateId: string;
  componentKey: string;
  values: Record<string, string>;
  penerimaNama: string;
  penerimaJabatan?: string | null;
  penerimaDivisi?: string | null;
  signatoryId: string;
  signatoryNama: string;
  signatoryJabatan: string;
  signatureImageUrl: string;
  stampImageUrl: string | null;
  /** Diisi kalau ini adalah edit-as-revision dari surat lain (lihat /surat/[id]/edit). */
  revisiDariId?: string;
};

export type GenerateSuratResult =
  | { ok: true; id: string; nomorSuratFull: string }
  | { ok: false; error: string };

/**
 * Alur inti Fase 5: alokasi nomor (transaksi atomik) -> render PDF -> simpan
 * file -> tandai VALID. Nomor yang sudah dialokasikan TIDAK PERNAH
 * di-rollback meski render PDF gagal setelahnya - row LogSurat tetap ada
 * dengan status FAILED sebagai jejak audit, dan admin bisa retry render PDF
 * untuk nomor yang sama nanti (lihat catatan desain di generateNomorSurat.ts).
 */
export async function generateSurat(input: GenerateSuratInput): Promise<GenerateSuratResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const jenisSurat = await prisma.jenisSurat.findUnique({ where: { id: input.jenisSuratId } });
  if (!jenisSurat) return { ok: false, error: "Jenis surat tidak ditemukan." };

  if (!canManageKategori(session.user.role, jenisSurat.kategori)) {
    return { ok: false, error: "Anda tidak punya akses untuk membuat surat kategori ini." };
  }

  if (input.revisiDariId) {
    const original = await prisma.logSurat.findUnique({ where: { id: input.revisiDariId } });
    if (!original || original.status !== StatusSurat.VALID) {
      return { ok: false, error: "Surat asli untuk direvisi tidak ditemukan atau sudah tidak valid." };
    }
  }

  const penerimaTipeRaw = input.values.penerimaTipe;
  let penerimaTipe: PenerimaTipe = PenerimaTipe.MANUAL;
  let penerimaKaryawanId: string | null = null;
  let penerimaKlienId: string | null = null;
  let penerimaNamaManual: string | null = null;

  if (penerimaTipeRaw === "KLIEN") {
    penerimaTipe = PenerimaTipe.KLIEN;
    penerimaKlienId = input.values.penerimaKlienId || null;
  } else if (penerimaTipeRaw === "MANUAL") {
    penerimaTipe = PenerimaTipe.MANUAL;
    penerimaNamaManual = input.values.penerimaNamaManual || input.penerimaNama;
  } else if (penerimaTipeRaw === "KARYAWAN" || input.values.penerimaKaryawanId) {
    penerimaTipe = PenerimaTipe.KARYAWAN;
    penerimaKaryawanId = input.values.penerimaKaryawanId || null;
  } else {
    penerimaNamaManual = input.penerimaNama;
  }

  const tanggalSurat = new Date();
  let logId: string | undefined;
  let nomorSuratFull: string | undefined;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const nomor = await generateNomorSurat(tx, {
        divisiId: input.divisiId,
        jenisSuratId: input.jenisSuratId,
        tanggalSurat,
      });

      const log = await tx.logSurat.create({
        data: {
          nomorUrut: nomor.nomorUrut,
          nomorSuratFull: nomor.nomorSuratFull,
          tahun: nomor.tahun,
          bulanRomawi: nomor.bulanRomawi,
          divisiId: input.divisiId,
          jenisSuratId: input.jenisSuratId,
          templateId: input.templateId,
          tanggalSurat,
          penerimaTipe,
          penerimaKaryawanId,
          penerimaKlienId,
          penerimaNamaManual,
          signatoryId: input.signatoryId,
          formDataJson: input.values,
          status: StatusSurat.GENERATING,
          createdById: session.user.id,
          revisiDariId: input.revisiDariId ?? null,
        },
      });

      return log;
    });

    logId = created.id;
    nomorSuratFull = created.nomorSuratFull;

    const hdrs = await headers();
    const host = hdrs.get("host");
    const protocol = hdrs.get("x-forwarded-proto") ?? "http";
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL;

    const verifyUrl = `${baseUrl}/verify/${created.qrToken}`;
    const qrDataUrl = await generateQrDataUrl(verifyUrl);

    const props: SuratTemplateProps = {
      nomorSuratFull: created.nomorSuratFull,
      tanggalSurat: created.tanggalSurat,
      values: input.values,
      penerimaNama: input.penerimaNama,
      penerimaJabatan: input.penerimaJabatan,
      penerimaDivisi: input.penerimaDivisi,
      signatoryNama: input.signatoryNama,
      signatoryJabatan: input.signatoryJabatan,
      signatureImageUrl: input.signatureImageUrl,
      stampImageUrl: input.stampImageUrl,
      qrDataUrl,
    };

    const pdfBuffer = await renderSuratPdf(input.componentKey, props, { baseUrl });

    const divisi = await prisma.divisi.findUniqueOrThrow({ where: { id: input.divisiId } });
    const saved = await saveSuratPdf({
      tahun: created.tahun,
      divisiKode: divisi.kode,
      nomorSuratFull: created.nomorSuratFull,
      pdfBuffer,
    });

    await prisma.logSurat.update({
      where: { id: logId },
      data: { filePdfUrl: saved.relativePath, status: StatusSurat.VALID },
    });

    revalidatePath("/");
    return { ok: true, id: logId, nomorSuratFull };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal generate surat.";
    if (logId) {
      await prisma.logSurat
        .update({ where: { id: logId }, data: { status: StatusSurat.FAILED } })
        .catch(() => {});
      return {
        ok: false,
        error: `Nomor ${nomorSuratFull} sudah dialokasikan tapi render PDF gagal: ${message}. Nomor ini tidak akan dipakai ulang - hubungi admin untuk retry render.`,
      };
    }
    return { ok: false, error: message };
  }
}
