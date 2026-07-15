import { prisma } from "@/lib/prisma";
import { canManageKategori } from "@/lib/rbac/permissions";
import type { Role } from "@/generated/prisma/enums";
import type { FieldDef } from "@/lib/forms/formSchema";

/** Data referensi bersama untuk form Buat Surat (/surat/baru) dan Edit-as-revision (/surat/[id]/edit). */
export async function getSuratFormData(role: Role) {
  const [jenisSuratList, employees, clients, signatories, divisiList] = await Promise.all([
    prisma.jenisSurat.findMany({
      where: { isActive: true },
      include: { templates: { where: { isActive: true }, orderBy: { versi: "desc" }, take: 1 } },
      orderBy: { nama: "asc" },
    }),
    prisma.masterKaryawan.findMany({
      where: { isActive: true },
      include: { divisi: true },
      orderBy: { namaLengkap: "asc" },
    }),
    prisma.masterKlien.findMany({ where: { isActive: true }, orderBy: { namaKontak: "asc" } }),
    prisma.signatory.findMany({ where: { isActive: true }, orderBy: { nama: "asc" } }),
    prisma.divisi.findMany({ orderBy: { kode: "asc" } }),
  ]);

  const availableJenisSurat = jenisSuratList
    .filter((j) => j.templates.length > 0 && canManageKategori(role, j.kategori))
    .map((j) => ({
      id: j.id,
      kode: j.kode,
      nama: j.nama,
      templateId: j.templates[0].id,
      componentKey: j.templates[0].componentKey,
      formSchemaJson: j.templates[0].formSchemaJson as { fields: FieldDef[] },
    }));

  return {
    availableJenisSurat,
    divisiList: divisiList.map((d) => ({ id: d.id, kode: d.kode, nama: d.nama })),
    employees: employees.map((e) => ({
      id: e.id,
      nama: e.namaLengkap,
      jabatan: e.jabatan,
      divisi: e.divisi?.nama ?? null,
    })),
    clients: clients.map((c) => ({
      id: c.id,
      nama: c.namaPerusahaan ? `${c.namaKontak} (${c.namaPerusahaan})` : c.namaKontak,
    })),
    signatories: signatories.map((s) => ({
      id: s.id,
      nama: s.nama,
      jabatan: s.jabatan,
      signatureImageUrl: s.signatureImageUrl,
      stampImageUrl: s.stampImageUrl,
    })),
  };
}
