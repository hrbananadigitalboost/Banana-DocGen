import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { canManageMasterData } from "@/lib/rbac/permissions";
import { Field } from "@/components/forms/Field";
import { createKlien } from "../actions";

export default async function NewKlienPage() {
  const session = await auth();
  if (!session?.user || !canManageMasterData(session.user.role)) redirect("/master/klien");

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">Tambah Klien</h2>
      <form action={createKlien} className="flex max-w-lg flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Nama Kontak" name="namaKontak" required />
        <Field label="Nama Perusahaan" name="namaPerusahaan" />
        <div className="flex flex-col gap-1">
          <label htmlFor="jenisKlien" className="text-sm font-medium text-slate-700">
            Jenis Klien
          </label>
          <select
            id="jenisKlien"
            name="jenisKlien"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="PERUSAHAAN">Perusahaan</option>
            <option value="INDIVIDU">Individu</option>
          </select>
        </div>
        <Field label="Email" name="email" type="email" />
        <Field label="Telepon" name="telepon" />
        <Field label="NPWP" name="npwp" />
        <Field label="Alamat" name="alamat" textarea />
        <button type="submit" className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Simpan
        </button>
      </form>
    </div>
  );
}
