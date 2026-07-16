"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { canManageKategori } from "@/lib/rbac/permissions";
import { StatusSurat } from "@/generated/prisma/enums";
import { readSuratPdf } from "@/lib/storage/fileStorage";
import { sendSuratEmail } from "@/lib/email/sendSuratEmail";

export type VoidSuratResult = { ok: true } | { ok: false; error: string };

/**
 * Void = tandai batal, nomor TIDAK dibebaskan/dipakai ulang (CounterSurat
 * tidak diubah sama sekali oleh aksi ini) - hanya status & metadata voided
 * yang berubah, row asli tetap ada untuk jejak audit. Lihat keputusan desain
 * di plan: nomor yang sudah dialokasikan sifatnya permanen.
 */
export async function voidSurat(logSuratId: string, reason: string): Promise<VoidSuratResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const log = await prisma.logSurat.findUnique({
    where: { id: logSuratId },
    include: { jenisSurat: true },
  });
  if (!log) return { ok: false, error: "Surat tidak ditemukan." };
  if (log.status !== StatusSurat.VALID) {
    return { ok: false, error: "Hanya surat berstatus VALID yang bisa di-void." };
  }
  if (!canManageKategori(session.user.role, log.jenisSurat.kategori)) {
    return { ok: false, error: "Anda tidak punya akses untuk void surat kategori ini." };
  }

  await prisma.logSurat.update({
    where: { id: logSuratId },
    data: {
      status: StatusSurat.VOID,
      voidedAt: new Date(),
      voidedById: session.user.id,
      voidReason: reason || null,
    },
  });

  revalidatePath("/");
  return { ok: true };
}

export type DeleteSuratResult = { ok: true } | { ok: false; error: string };

/**
 * Hard delete asli - satu-satunya di sistem ini untuk LogSurat, dan HANYA
 * diizinkan untuk surat yang sudah VOID/FAILED (surat VALID harus di-void
 * dulu). EmailLog milik surat ini ikut dihapus dalam transaksi yang sama
 * (tidak berguna tanpa induknya) - kalau ada surat lain yang menjadikan ini
 * revisiDari, field itu otomatis di-null-kan oleh Postgres (default
 * referential action Prisma untuk relasi opsional), bukan error.
 */
export async function deleteSurat(logSuratId: string): Promise<DeleteSuratResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const log = await prisma.logSurat.findUnique({
    where: { id: logSuratId },
    include: { jenisSurat: true },
  });
  if (!log) return { ok: false, error: "Surat tidak ditemukan." };
  if (log.status !== StatusSurat.VOID && log.status !== StatusSurat.FAILED) {
    return { ok: false, error: "Hanya surat berstatus VOID atau FAILED yang bisa dihapus permanen." };
  }
  if (!canManageKategori(session.user.role, log.jenisSurat.kategori)) {
    return { ok: false, error: "Anda tidak punya akses untuk menghapus surat kategori ini." };
  }

  await prisma.$transaction([
    prisma.emailLog.deleteMany({ where: { logSuratId } }),
    prisma.logSurat.delete({ where: { id: logSuratId } }),
  ]);

  revalidatePath("/");
  return { ok: true };
}

export type SendSuratEmailResult = { ok: true } | { ok: false; error: string };

export async function sendSuratEmailAction(
  logSuratId: string,
  recipientEmail: string
): Promise<SendSuratEmailResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };

  const log = await prisma.logSurat.findUnique({
    where: { id: logSuratId },
    include: { jenisSurat: true },
  });
  if (!log) return { ok: false, error: "Surat tidak ditemukan." };
  if (log.status !== StatusSurat.VALID || !log.filePdfUrl) {
    return { ok: false, error: "Hanya surat VALID dengan PDF tersimpan yang bisa dikirim email." };
  }
  if (!canManageKategori(session.user.role, log.jenisSurat.kategori)) {
    return { ok: false, error: "Anda tidak punya akses untuk mengirim email surat kategori ini." };
  }

  try {
    const pdfBuffer = await readSuratPdf(log.filePdfUrl);
    const { providerMessageId } = await sendSuratEmail({
      to: recipientEmail,
      nomorSuratFull: log.nomorSuratFull,
      jenisSuratNama: log.jenisSurat.nama,
      pdfBuffer,
    });

    await prisma.emailLog.create({
      data: {
        logSuratId: log.id,
        recipientEmail,
        status: "SENT",
        providerMessageId,
        sentById: session.user.id,
      },
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengirim email.";
    await prisma.emailLog.create({
      data: {
        logSuratId: log.id,
        recipientEmail,
        status: "FAILED",
        errorMessage: message,
        sentById: session.user.id,
      },
    });
    return { ok: false, error: message };
  }
}
