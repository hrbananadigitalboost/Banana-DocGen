"use client";

import { useState } from "react";
import { deleteSurat } from "./actions";

export function DeleteSuratButton({ logSuratId, nomorSuratFull }: { logSuratId: string; nomorSuratFull: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-red-600 hover:underline">
        Hapus
      </button>
    );
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const result = await deleteSurat(logSuratId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-900">Hapus permanen surat {nomorSuratFull}?</h3>
        <p className="mt-1 text-xs text-slate-500">
          Tindakan ini tidak bisa dibatalkan, termasuk riwayat email yang pernah dikirim untuk surat ini.
        </p>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
