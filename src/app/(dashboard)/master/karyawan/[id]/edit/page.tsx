import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { canManageMasterData } from "@/lib/rbac/permissions";
import { Field } from "@/components/forms/Field";
import { updateKaryawan } from "../../actions";

type EditKaryawanPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditKaryawanPage({ params }: EditKaryawanPageProps) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user || !canManageMasterData(session.user.role)) redirect("/master/karyawan");

  const [karyawan, divisiList] = await Promise.all([
    prisma.masterKaryawan.findUnique({ where: { id } }),
    prisma.divisi.findMany({ orderBy: { kode: "asc" } }),
  ]);
  if (!karyawan) notFound();

  const updateKaryawanWithId = updateKaryawan.bind(null, id);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">Edit Karyawan</h2>
      <form
        action={updateKaryawanWithId}
        className="flex max-w-lg flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <Field label="Nama Lengkap" name="namaLengkap" required defaultValue={karyawan.namaLengkap} />
        <Field label="NIK KTP" name="nikKtp" required defaultValue={karyawan.nikKtp} />
        <Field label="Jabatan" name="jabatan" required defaultValue={karyawan.jabatan} />
        <div className="flex flex-col gap-1">
          <label htmlFor="divisiId" className="text-sm font-medium text-slate-700">
            Divisi
          </label>
          <select
            id="divisiId"
            name="divisiId"
            defaultValue={karyawan.divisiId ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">- Pilih Divisi -</option>
            {divisiList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.kode} - {d.nama}
              </option>
            ))}
          </select>
        </div>
        <Field label="Email" name="email" type="email" defaultValue={karyawan.email ?? ""} />
        <Field label="Telepon" name="telepon" defaultValue={karyawan.telepon ?? ""} />
        <Field label="Alamat" name="alamat" textarea defaultValue={karyawan.alamat ?? ""} />
        <button type="submit" className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
