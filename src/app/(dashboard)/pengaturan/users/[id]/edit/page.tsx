import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { isSystemAdmin } from "@/lib/rbac/permissions";
import { Field } from "@/components/forms/Field";
import { Role } from "@/generated/prisma/enums";
import { updateUser } from "../../actions";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user || !isSystemAdmin(session.user.role)) redirect("/pengaturan/users");

  const [user, divisiList] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.divisi.findMany({ orderBy: { kode: "asc" } }),
  ]);
  if (!user) notFound();

  const updateUserWithId = updateUser.bind(null, id);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">Edit User</h2>
      <form
        action={updateUserWithId}
        className="flex max-w-lg flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <Field label="Nama Lengkap" name="namaLengkap" required defaultValue={user.namaLengkap} />
        <Field label="Email" name="email" type="email" required defaultValue={user.email} />
        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue={user.role}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.values(Role).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="divisiId" className="text-sm font-medium text-slate-700">
            Divisi
          </label>
          <select
            id="divisiId"
            name="divisiId"
            defaultValue={user.divisiId ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">- Tidak terikat divisi -</option>
            {divisiList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.kode} - {d.nama}
              </option>
            ))}
          </select>
        </div>
        <Field label="Password Baru (kosongkan jika tidak ingin ganti)" name="password" type="password" />
        <button type="submit" className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
