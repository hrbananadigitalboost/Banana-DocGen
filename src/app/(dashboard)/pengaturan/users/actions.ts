"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { isSystemAdmin } from "@/lib/rbac/permissions";
import { Role } from "@/generated/prisma/enums";

async function requireSystemAdmin() {
  const session = await auth();
  if (!session?.user || !isSystemAdmin(session.user.role)) {
    throw new Error("Tidak punya akses untuk mengelola User.");
  }
  return session;
}

export async function createUser(formData: FormData) {
  await requireSystemAdmin();

  const divisiId = formData.get("divisiId") as string;
  const password = String(formData.get("password"));
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      namaLengkap: String(formData.get("namaLengkap")),
      email: String(formData.get("email")),
      role: formData.get("role") as Role,
      divisiId: divisiId || null,
      passwordHash,
    },
  });

  revalidatePath("/pengaturan/users");
  redirect("/pengaturan/users");
}

export async function toggleUserActive(id: string, nextActive: boolean) {
  await requireSystemAdmin();
  await prisma.user.update({ where: { id }, data: { isActive: nextActive } });
  revalidatePath("/pengaturan/users");
}

export async function updateUser(id: string, formData: FormData) {
  await requireSystemAdmin();

  const divisiId = formData.get("divisiId") as string;
  const newPassword = formData.get("password") as string;

  await prisma.user.update({
    where: { id },
    data: {
      namaLengkap: String(formData.get("namaLengkap")),
      email: String(formData.get("email")),
      role: formData.get("role") as Role,
      divisiId: divisiId || null,
      ...(newPassword ? { passwordHash: await bcrypt.hash(newPassword, 10) } : {}),
    },
  });

  revalidatePath("/pengaturan/users");
  redirect("/pengaturan/users");
}

export type DeleteUserResult = { ok: true } | { ok: false; error: string };

/**
 * Hard delete asli (satu-satunya di codebase ini) - diblokir kalau user
 * pernah jadi createdBy/voidedBy di LogSurat manapun, karena
 * LogSurat.createdById wajib (NOT NULL) sehingga hapus akan melanggar FK.
 * Untuk user yang sudah punya riwayat, pakai toggleUserActive (nonaktifkan).
 */
export async function deleteUser(id: string): Promise<DeleteUserResult> {
  const session = await requireSystemAdmin();
  if (id === session.user.id) {
    return { ok: false, error: "Tidak bisa menghapus akun sendiri." };
  }

  const riwayat = await prisma.logSurat.count({
    where: { OR: [{ createdById: id }, { voidedById: id }] },
  });
  if (riwayat > 0) {
    return {
      ok: false,
      error: `User ini masih punya riwayat ${riwayat} surat - tidak bisa dihapus permanen. Nonaktifkan saja.`,
    };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/pengaturan/users");
  return { ok: true };
}
