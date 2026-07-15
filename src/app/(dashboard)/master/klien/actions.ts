"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { canManageMasterData } from "@/lib/rbac/permissions";

async function requireMasterDataManager() {
  const session = await auth();
  if (!session?.user || !canManageMasterData(session.user.role)) {
    throw new Error("Tidak punya akses untuk mengelola Master Klien.");
  }
  return session;
}

export async function createKlien(formData: FormData) {
  await requireMasterDataManager();

  await prisma.masterKlien.create({
    data: {
      namaPerusahaan: (formData.get("namaPerusahaan") as string) || null,
      namaKontak: String(formData.get("namaKontak")),
      jenisKlien: String(formData.get("jenisKlien")),
      alamat: (formData.get("alamat") as string) || null,
      email: (formData.get("email") as string) || null,
      telepon: (formData.get("telepon") as string) || null,
      npwp: (formData.get("npwp") as string) || null,
    },
  });

  revalidatePath("/master/klien");
  redirect("/master/klien");
}

export async function updateKlien(id: string, formData: FormData) {
  await requireMasterDataManager();

  await prisma.masterKlien.update({
    where: { id },
    data: {
      namaPerusahaan: (formData.get("namaPerusahaan") as string) || null,
      namaKontak: String(formData.get("namaKontak")),
      jenisKlien: String(formData.get("jenisKlien")),
      alamat: (formData.get("alamat") as string) || null,
      email: (formData.get("email") as string) || null,
      telepon: (formData.get("telepon") as string) || null,
      npwp: (formData.get("npwp") as string) || null,
    },
  });

  revalidatePath("/master/klien");
  redirect("/master/klien");
}

export async function toggleKlienActive(id: string, nextActive: boolean) {
  await requireMasterDataManager();
  await prisma.masterKlien.update({ where: { id }, data: { isActive: nextActive } });
  revalidatePath("/master/klien");
}
