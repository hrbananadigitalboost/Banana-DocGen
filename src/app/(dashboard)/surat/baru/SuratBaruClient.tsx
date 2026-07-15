"use client";

import { useMemo, useState } from "react";
import { DynamicFormRenderer } from "@/components/forms/DynamicFormRenderer";
import { templateRegistry } from "@/components/templates/surat/templateRegistry";
import type { FieldDef } from "@/lib/forms/formSchema";
import { generateSurat } from "./actions";

type JenisSuratOption = {
  id: string;
  kode: string;
  nama: string;
  templateId: string;
  componentKey: string;
  formSchemaJson: { fields: FieldDef[] };
};

type DivisiOption = { id: string; kode: string; nama: string };
type PersonOption = { id: string; nama: string };
type EmployeeOption = { id: string; nama: string; jabatan: string; divisi: string | null };
type SignatoryOption = {
  id: string;
  nama: string;
  jabatan: string;
  signatureImageUrl: string;
  stampImageUrl: string | null;
};

export function SuratBaruClient({
  jenisSuratList,
  divisiList,
  defaultDivisiId,
  employees,
  clients,
  signatories,
  initialJenisSuratId,
  initialValues,
  revisiDari,
}: {
  jenisSuratList: JenisSuratOption[];
  divisiList: DivisiOption[];
  defaultDivisiId: string;
  employees: EmployeeOption[];
  clients: PersonOption[];
  signatories: SignatoryOption[];
  /** Prefill untuk edit-as-revision (lihat /surat/[id]/edit). */
  initialJenisSuratId?: string;
  initialValues?: Record<string, string>;
  revisiDari?: { id: string; nomorSuratFull: string };
}) {
  const [selectedId, setSelectedId] = useState(initialJenisSuratId ?? jenisSuratList[0]?.id ?? "");
  const [divisiId, setDivisiId] = useState(defaultDivisiId);
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {});
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateResult, setGenerateResult] = useState<{ id: string; nomorSuratFull: string } | null>(null);

  const selected = jenisSuratList.find((j) => j.id === selectedId);
  const TemplateComponent = selected ? templateRegistry[selected.componentKey] : undefined;

  const employeeOptions = useMemo(() => employees.map((e) => ({ id: e.id, label: e.nama })), [employees]);
  const clientOptions = useMemo(() => clients.map((c) => ({ id: c.id, label: c.nama })), [clients]);
  const signatoryOptions = useMemo(
    () => signatories.map((s) => ({ id: s.id, label: `${s.nama} - ${s.jabatan}` })),
    [signatories]
  );

  // Urutan fallback: KLIEN eksplisit -> karyawan (baik lewat penerimaTipe
  // KARYAWAN maupun template tanpa selector penerimaTipe sama sekali, mis.
  // Surat Edaran yang cuma punya field teks bebas "Kepada").
  const penerimaNama = useMemo(() => {
    if (values.penerimaTipe === "KLIEN" || (!values.penerimaTipe && values.penerimaKlienId)) {
      return clients.find((c) => c.id === values.penerimaKlienId)?.nama ?? "-";
    }
    if (values.penerimaKaryawanId) {
      return employees.find((e) => e.id === values.penerimaKaryawanId)?.nama ?? "-";
    }
    if (values.penerimaNamaManual) {
      return values.penerimaNamaManual;
    }
    return "-";
  }, [values, clients, employees]);

  const penerimaKaryawan = employees.find((e) => e.id === values.penerimaKaryawanId);
  const signatory = signatories.find((s) => s.id === values.signatoryId);

  function buildRenderRequestBody() {
    return {
      componentKey: selected?.componentKey,
      values,
      penerimaNama,
      penerimaJabatan: penerimaKaryawan?.jabatan ?? null,
      penerimaDivisi: penerimaKaryawan?.divisi ?? null,
      signatoryNama: signatory?.nama ?? "-",
      signatoryJabatan: signatory?.jabatan ?? "-",
      signatureImageUrl: signatory?.signatureImageUrl ?? "",
      stampImageUrl: signatory?.stampImageUrl ?? null,
    };
  }

  async function handlePreviewPdf() {
    if (!selected) return;
    setPdfLoading(true);
    setPdfError(null);
    const previewTab = window.open("", "_blank");
    try {
      const res = await fetch("/api/surat/preview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildRenderRequestBody(),
          nomorSuratFull: "(preview - belum digenerate resmi)",
          tanggalSurat: new Date().toISOString(),
          qrDataUrl: null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ? JSON.stringify(body.error) : `Gagal (status ${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (previewTab) {
        previewTab.location.href = url;
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = "preview-surat.pdf";
        link.click();
      }
    } catch (err) {
      previewTab?.close();
      setPdfError(err instanceof Error ? err.message : "Gagal membuat PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selected || !divisiId) return;
    setGenerateLoading(true);
    setGenerateError(null);
    setGenerateResult(null);
    try {
      const result = await generateSurat({
        divisiId,
        jenisSuratId: selected.id,
        templateId: selected.templateId,
        componentKey: selected.componentKey,
        values,
        penerimaNama,
        penerimaJabatan: penerimaKaryawan?.jabatan ?? null,
        penerimaDivisi: penerimaKaryawan?.divisi ?? null,
        signatoryId: values.signatoryId ?? "",
        signatoryNama: signatory?.nama ?? "-",
        signatoryJabatan: signatory?.jabatan ?? "-",
        signatureImageUrl: signatory?.signatureImageUrl ?? "",
        stampImageUrl: signatory?.stampImageUrl ?? null,
        revisiDariId: revisiDari?.id,
      });

      if (result.ok) {
        setGenerateResult({ id: result.id, nomorSuratFull: result.nomorSuratFull });
        setValues({});
      } else {
        setGenerateError(result.error);
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Gagal generate surat.");
    } finally {
      setGenerateLoading(false);
    }
  }

  if (jenisSuratList.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Tidak ada jenis surat yang tersedia untuk role Anda saat ini.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {revisiDari && (
        <p className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Merevisi surat <strong>{revisiDari.nomorSuratFull}</strong>. Menyimpan akan membuat surat baru
          dengan nomor baru; surat asli tetap tersimpan (tidak berubah) untuk jejak audit.
        </p>
      )}
      <div className="flex gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="jenisSurat" className="text-sm font-medium text-slate-700">
            Jenis Surat
          </label>
          <select
            id="jenisSurat"
            value={selectedId}
            disabled={!!revisiDari}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setValues({});
              setGenerateResult(null);
              setGenerateError(null);
            }}
            className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          >
            {jenisSuratList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.kode} - {j.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="divisi" className="text-sm font-medium text-slate-700">
            Divisi Penerbit
          </label>
          <select
            id="divisi"
            value={divisiId}
            disabled={!!revisiDari}
            onChange={(e) => setDivisiId(e.target.value)}
            className="w-56 rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          >
            <option value="">- Pilih Divisi -</option>
            {divisiList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.kode} - {d.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {generateResult && (
        <div className="flex items-center justify-between rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          <span>
            Surat berhasil digenerate dengan nomor <strong>{generateResult.nomorSuratFull}</strong>.
          </span>
          <a
            href={`/api/surat/${generateResult.id}/download`}
            target="_blank"
            className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800"
          >
            Unduh PDF
          </a>
        </div>
      )}
      {generateError && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{generateError}</p>
      )}

      {selected && (
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Form Input</h3>
            <DynamicFormRenderer
              key={selected.id}
              fields={selected.formSchemaJson.fields}
              defaultValues={selected.id === initialJenisSuratId ? initialValues : undefined}
              employeeOptions={employeeOptions}
              clientOptions={clientOptions}
              signatoryOptions={signatoryOptions}
              onValuesChange={setValues}
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateLoading || !divisiId}
              className="mt-4 w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {generateLoading
                ? "Menggenerate..."
                : revisiDari
                  ? "Simpan Sebagai Revisi"
                  : "Generate & Simpan Resmi"}
            </button>
            {!divisiId && <p className="mt-1 text-xs text-slate-400">Pilih divisi penerbit dahulu.</p>}
          </div>

          <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Live Preview</h3>
              <button
                type="button"
                onClick={handlePreviewPdf}
                disabled={pdfLoading}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {pdfLoading ? "Membuat PDF..." : "Preview PDF Asli"}
              </button>
            </div>
            {pdfError && <p className="mb-2 text-xs text-red-600">{pdfError}</p>}
            <div className="origin-top-left scale-[0.6]">
              {TemplateComponent && (
                <TemplateComponent
                  nomorSuratFull="(nomor dibuat otomatis saat generate)"
                  tanggalSurat={new Date()}
                  values={values}
                  penerimaNama={penerimaNama}
                  penerimaJabatan={penerimaKaryawan?.jabatan ?? null}
                  penerimaDivisi={penerimaKaryawan?.divisi ?? null}
                  signatoryNama={signatory?.nama ?? "-"}
                  signatoryJabatan={signatory?.jabatan ?? "-"}
                  signatureImageUrl={signatory?.signatureImageUrl ?? ""}
                  stampImageUrl={signatory?.stampImageUrl}
                  qrDataUrl={null}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
