import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getSuratFormData } from "../getSuratFormData";
import { SuratBaruClient } from "./SuratBaruClient";

export default async function SuratBaruPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { availableJenisSurat, divisiList, employees, clients, signatories } = await getSuratFormData(
    session.user.role
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">Buat Surat Baru</h2>
      <SuratBaruClient
        jenisSuratList={availableJenisSurat}
        divisiList={divisiList}
        defaultDivisiId={session.user.divisiId ?? ""}
        employees={employees}
        clients={clients}
        signatories={signatories}
      />
    </div>
  );
}
