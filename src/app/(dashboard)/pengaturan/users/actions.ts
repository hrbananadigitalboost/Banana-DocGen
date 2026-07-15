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
