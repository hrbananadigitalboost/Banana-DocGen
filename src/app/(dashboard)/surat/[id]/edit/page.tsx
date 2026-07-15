import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { canManageKategori } from "@/lib/rbac/permissions";
import { getSuratFormData } from "../../getSuratFormData";
import { SuratBaruClient } from "../../baru/SuratBaruClient";

type EditSuratPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSuratPage({ params }: EditSuratPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const original = await prisma.logSurat.findUnique({
    where: { id },
    include: { jenisSurat: true },
  });
  if (!original) notFound();

  if (original.status !== "VALID") {
    redirect("/");
  }
  if (!canManageKategori(session.user.role, original.jenisSurat.kategori)) {
    redirect("/");
  }

  const { availableJenisSurat, divisiList, employees, clients, signatories } = await getSuratFormData(
    session.user.role
  );

  const jenisSuratMasihAda = availableJenisSurat.some((j) => j.id === original.jenisSuratId);
  if (!jenisSuratMasihAda) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">Edit / Revisi Surat</h2>
      <SuratBaruClient
        jenisSuratList={availableJenisSurat}
        divisiList={divisiList}
        defaultDivisiId={original.divisiId}
        employees={employees}
        clients={clients}
        signatories={signatories}
        initialJenisSuratId={original.jenisSuratId}
        initialValues={original.formDataJson as Record<string, string>}
        revisiDari={{ id: original.id, nomorSuratFull: original.nomorSuratFull }}
      />
    </div>
  );
}
