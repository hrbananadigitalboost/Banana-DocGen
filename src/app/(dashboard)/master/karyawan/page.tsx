import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { canManageMasterData, canViewUnmaskedPii, maskNikKtp } from "@/lib/rbac/permissions";
import { toggleKaryawanActive } from "./actions";

export default async function MasterKaryawanPage() {
  const session = await auth();
  const canManage = canManageMasterData(session!.user.role);
  const canSeeNik = canViewUnmaskedPii(session!.user.role);

  const karyawan = await prisma.masterKaryawan.findMany({
    include: { divisi: true },
    orderBy: { namaLengkap: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Master Karyawan</h2>
        {canManage && (
          <Link
            href="/master/karyawan/new"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Tambah Karyawan
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">NIK KTP</th>
              <th className="px-4 py-2 font-medium">Jabatan</th>
              <th className="px-4 py-2 font-medium">Divisi</th>
              <th className="px-4 py-2 font-medium">Status</th>
              {canManage && <th className="px-4 py-2 font-medium">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {karyawan.map((k) => (
              <tr key={k.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2">{k.namaLengkap}</td>
                <td className="px-4 py-2 font-mono text-xs">
                  {canSeeNik ? k.nikKtp : maskNikKtp(k.nikKtp)}
                </td>
                <td className="px-4 py-2">{k.jabatan}</td>
                <td className="px-4 py-2">{k.divisi?.kode ?? "-"}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      k.isActive
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                        : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                    }
                  >
                    {k.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                {canManage && (
                  <td className="flex gap-3 px-4 py-2">
                    <Link href={`/master/karyawan/${k.id}/edit`} className="text-slate-700 hover:underline">
                      Edit
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await toggleKaryawanActive(k.id, !k.isActive);
                      }}
                    >
                      <button type="submit" className="text-slate-500 hover:underline">
                        {k.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
            {karyawan.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Belum ada data karyawan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
