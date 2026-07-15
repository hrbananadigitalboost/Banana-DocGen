"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { canManageMasterData } from "@/lib/rbac/permissions";

async function requireMasterDataManager() {
  const session = await auth();
  if (!session?.user || !canManageMasterData(session.user.role)) {
    throw new Error("Tidak punya akses untuk mengelola Master Karyawan.");
  }
  return session;
}

export async function createKaryawan(formData: FormData) {
  await requireMasterDataManager();

  const divisiId = formData.get("divisiId") as string;

  await prisma.masterKaryawan.create({
    data: {
      namaLengkap: String(formData.get("namaLengkap")),
      nikKtp: String(formData.get("nikKtp")),
      jabatan: String(formData.get("jabatan")),
      divisiId: divisiId || null,
      alamat: (formData.get("alamat") as string) || null,
      email: (formData.get("email") as string) || null,
      telepon: (formData.get("telepon") as string) || null,
    },
  });

  revalidatePath("/master/karyawan");
  redirect("/master/karyawan");
}

export async function updateKaryawan(id: string, formData: FormData) {
  await requireMasterDataManager();

  const divisiId = formData.get("divisiId") as string;

  await prisma.masterKaryawan.update({
    where: { id },
    data: {
      namaLengkap: String(formData.get("namaLengkap")),
      nikKtp: String(formData.get("nikKtp")),
      jabatan: String(formData.get("jabatan")),
      divisiId: divisiId || null,
      alamat: (formData.get("alamat") as string) || null,
      email: (formData.get("email") as string) || null,
      telepon: (formData.get("telepon") as string) || null,
    },
  });

  revalidatePath("/master/karyawan");
  redirect("/master/karyawan");
}

export async function toggleKaryawanActive(id: string, nextActive: boolean) {
  await requireMasterDataManager();
  await prisma.masterKaryawan.update({ where: { id }, data: { isActive: nextActive } });
  revalidatePath("/master/karyawan");
}
