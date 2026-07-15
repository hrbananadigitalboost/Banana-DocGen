import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatTanggalIndonesia } from "@/lib/format/tanggal";

type VerifyPageProps = {
  params: Promise<{ qrToken: string }>;
};

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  VALID: { text: "SAH / VALID", className: "bg-green-100 text-green-800" },
  VOID: { text: "DIBATALKAN (VOID)", className: "bg-slate-200 text-slate-600" },
  GENERATING: { text: "SEDANG DIPROSES", className: "bg-amber-100 text-amber-700" },
  FAILED: { text: "GAGAL DITERBITKAN", className: "bg-red-100 text-red-700" },
};

// Halaman publik (lihat proxy.ts) - HANYA menampilkan metadata surat, TIDAK
// PERNAH isi/formDataJson lengkap. qrToken adalah cuid terpisah dari
// nomorSuratFull agar URL ini tidak bisa ditebak/di-enumerasi berurutan.
export default async function VerifySuratPage({ params }: VerifyPageProps) {
  const { qrToken } = await params;

  const log = await prisma.logSurat.findUnique({
    where: { qrToken },
    include: {
      divisi: true,
      jenisSurat: true,
      penerimaKaryawan: true,
      penerimaKlien: true,
    },
  });

  const penerimaNama = log
    ? (log.penerimaKaryawan?.namaLengkap ?? log.penerimaKlien?.namaKontak ?? log.penerimaNamaManual ?? "-")
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image src="/assets/letterhead/logo-banana.png" alt="PT. Banana Digital Boost" width={56} height={56} />
          <h1 className="text-base font-semibold text-slate-900">Verifikasi Dokumen</h1>
          <p className="text-center text-xs text-slate-500">PT. Banana Digital Boost</p>
        </div>

        {!log ? (
          <p className="rounded-md bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            Kode verifikasi tidak ditemukan. Dokumen ini tidak terdaftar dalam sistem BDB DocGen.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <span
              className={`self-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_LABEL[log.status].className}`}
            >
              {STATUS_LABEL[log.status].text}
            </span>

            <dl className="mt-2 grid grid-cols-3 gap-y-2 text-sm">
              <dt className="col-span-1 text-slate-500">Nomor Surat</dt>
              <dd className="col-span-2 font-mono text-xs">{log.nomorSuratFull}</dd>

              <dt className="col-span-1 text-slate-500">Tanggal</dt>
              <dd className="col-span-2">{formatTanggalIndonesia(log.tanggalSurat)}</dd>

              <dt className="col-span-1 text-slate-500">Jenis Surat</dt>
              <dd className="col-span-2">{log.jenisSurat.nama}</dd>

              <dt className="col-span-1 text-slate-500">Divisi</dt>
              <dd className="col-span-2">{log.divisi.nama}</dd>

              <dt className="col-span-1 text-slate-500">Penerima</dt>
              <dd className="col-span-2">{penerimaNama}</dd>
            </dl>

            {log.status === "VOID" && (
              <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Dokumen ini telah dibatalkan dan tidak berlaku lagi.
              </p>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Halaman ini hanya menampilkan status &amp; metadata surat, bukan isi dokumen.
        </p>
      </div>
    </div>
  );
}
