import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { isSystemAdmin } from "@/lib/rbac/permissions";
import { toggleUserActive } from "./actions";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || !isSystemAdmin(session.user.role)) redirect("/");

  const users = await prisma.user.findMany({
    include: { divisi: true },
    orderBy: { namaLengkap: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Kelola User</h2>
        <Link
          href="/pengaturan/users/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Tambah User
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Divisi</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{u.namaLengkap}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">{u.divisi?.kode ?? "-"}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      u.isActive
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                        : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                    }
                  >
                    {u.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <form
                    action={async () => {
                      "use server";
                      await toggleUserActive(u.id, !u.isActive);
                    }}
                  >
                    <button
                      type="submit"
                      disabled={u.id === session.user.id}
                      className="text-slate-500 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
