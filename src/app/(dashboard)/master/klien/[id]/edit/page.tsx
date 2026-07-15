import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { canManageMasterData } from "@/lib/rbac/permissions";
import { Field } from "@/components/forms/Field";
import { updateKlien } from "../../actions";

type EditKlienPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditKlienPage({ params }: EditKlienPageProps) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user || !canManageMasterData(session.user.role)) redirect("/master/klien");

  const klien = await prisma.masterKlien.findUnique({ where: { id } });
  if (!klien) notFound();

  const updateKlienWithId = updateKlien.bind(null, id);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">Edit Klien</h2>
      <form
        action={updateKlienWithId}
        className="flex max-w-lg flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <Field label="Nama Kontak" name="namaKontak" required defaultValue={klien.namaKontak} />
        <Field label="Nama Perusahaan" name="namaPerusahaan" defaultValue={klien.namaPerusahaan ?? ""} />
        <div className="flex flex-col gap-1">
          <label htmlFor="jenisKlien" className="text-sm font-medium text-slate-700">
            Jenis Klien
          </label>
          <select
            id="jenisKlien"
            name="jenisKlien"
            defaultValue={klien.jenisKlien}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="PERUSAHAAN">Perusahaan</option>
            <option value="INDIVIDU">Individu</option>
          </select>
        </div>
        <Field label="Email" name="email" type="email" defaultValue={klien.email ?? ""} />
        <Field label="Telepon" name="telepon" defaultValue={klien.telepon ?? ""} />
        <Field label="NPWP" name="npwp" defaultValue={klien.npwp ?? ""} />
        <Field label="Alamat" name="alamat" textarea defaultValue={klien.alamat ?? ""} />
        <button type="submit" className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
