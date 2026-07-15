import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { canManageKategori, isRestrictedToKomersial } from "@/lib/rbac/permissions";
import { KategoriSurat, type Prisma } from "@/generated/prisma/client";
import { VoidButton } from "./VoidButton";
import { EmailButton } from "./EmailButton";

type SearchParams = { q?: string; dari?: string; sampai?: string };

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  const params = await searchParams;
  const role = session!.user.role;

  // FINANCE_SALES/AE cuma boleh lihat surat berkategori KOMERSIAL (selaras
  // dengan izin create/void mereka) - role lain (ADMIN/HRD/DIREKSI/VIEWER)
  // melihat log lintas kategori (VIEWER = read-only, BUKAN dibatasi kategori -
  // lihat canViewKategori vs canManageKategori di permissions.ts).
  const kategoriFilter = isRestrictedToKomersial(role) ? KategoriSurat.KOMERSIAL : undefined;

  const where: Prisma.LogSuratWhereInput = {
    ...(kategoriFilter && { jenisSurat: { kategori: kategoriFilter } }),
    ...(params.q && {
      OR: [
        { nomorSuratFull: { contains: params.q, mode: "insensitive" } },
        { penerimaNamaManual: { contains: params.q, mode: "insensitive" } },
        { penerimaKaryawan: { namaLengkap: { contains: params.q, mode: "insensitive" } } },
        { penerimaKlien: { namaKontak: { contains: params.q, mode: "insensitive" } } },
      ],
    }),
    ...((params.dari || params.sampai) && {
      tanggalSurat: {
        ...(params.dari && { gte: new Date(params.dari) }),
        ...(params.sampai && { lte: new Date(params.sampai) }),
      },
    }),
  };

  const logs = await prisma.logSurat.findMany({
    where,
    include: {
      divisi: true,
      jenisSurat: true,
      penerimaKaryawan: true,
      penerimaKlien: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  function penerimaLabel(log: (typeof logs)[number]) {
    if (log.penerimaKaryawan) return log.penerimaKaryawan.namaLengkap;
    if (log.penerimaKlien) return log.penerimaKlien.namaKontak;
    return log.penerimaNamaManual ?? "-";
  }

  const statusBadge: Record<string, string> = {
    VALID: "bg-green-100 text-green-700",
    VOID: "bg-slate-200 text-slate-500 line-through",
    GENERATING: "bg-amber-100 text-amber-700",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Dashboard - Rekapitulasi Surat</h2>
        <a
          href={`/api/surat/export?${new URLSearchParams(params as Record<string, string>).toString()}`}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Export Excel
        </a>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-slate-600">
            Cari (nama / nomor surat)
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q}
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dari" className="text-xs font-medium text-slate-600">
            Dari Tanggal
          </label>
          <input
            id="dari"
            name="dari"
            type="date"
            defaultValue={params.dari}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sampai" className="text-xs font-medium text-slate-600">
            Sampai Tanggal
          </label>
          <input
            id="sampai"
            name="sampai"
            type="date"
            defaultValue={params.sampai}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Cari
        </button>
        {(params.q || params.dari || params.sampai) && (
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            Reset
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Tanggal</th>
              <th className="px-4 py-2 font-medium">Divisi</th>
              <th className="px-4 py-2 font-medium">Jenis Surat</th>
              <th className="px-4 py-2 font-medium">Nomor Surat</th>
              <th className="px-4 py-2 font-medium">Penerima</th>
              <th className="px-4 py-2 font-medium">Pembuat</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const canAct = canManageKategori(role, log.jenisSurat.kategori) && log.status === "VALID";
              return (
                <tr key={log.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(log.tanggalSurat)}
                  </td>
                  <td className="px-4 py-2">{log.divisi.kode}</td>
                  <td className="px-4 py-2">{log.jenisSurat.kode}</td>
                  <td className="px-4 py-2 font-mono text-xs">{log.nomorSuratFull}</td>
                  <td className="px-4 py-2">{penerimaLabel(log)}</td>
                  <td className="px-4 py-2">{log.createdBy.namaLengkap}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge[log.status]}`}>
                      {log.status}
                      {log.revisiDariId && " (revisi)"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-3">
                      {log.filePdfUrl && (
                        <a
                          href={`/api/surat/${log.id}/download`}
                          target="_blank"
                          className="text-slate-700 hover:underline"
                        >
                          Unduh
                        </a>
                      )}
                      {canAct && (
                        <>
                          <Link href={`/surat/${log.id}/edit`} className="text-slate-700 hover:underline">
                            Edit
                          </Link>
                          <EmailButton
                            logSuratId={log.id}
                            nomorSuratFull={log.nomorSuratFull}
                            defaultEmail={log.penerimaKaryawan?.email ?? log.penerimaKlien?.email ?? ""}
                          />
                          <VoidButton logSuratId={log.id} nomorSuratFull={log.nomorSuratFull} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  Belum ada surat yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
