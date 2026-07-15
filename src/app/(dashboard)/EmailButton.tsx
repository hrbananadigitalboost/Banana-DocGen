"use client";

import { useState } from "react";
import { sendSuratEmailAction } from "./actions";

export function EmailButton({
  logSuratId,
  nomorSuratFull,
  defaultEmail,
}: {
  logSuratId: string;
  nomorSuratFull: string;
  defaultEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-slate-700 hover:underline">
        Email
      </button>
    );
  }

  async function handleSend() {
    setLoading(true);
    setError(null);
    const result = await sendSuratEmailAction(logSuratId, email);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-900">Kirim surat {nomorSuratFull} via email</h3>
        {success ? (
          <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            Email berhasil terkirim ke {email}.
          </p>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@penerima.com"
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            {success ? "Tutup" : "Batal"}
          </button>
          {!success && (
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !email}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Mengirim..." : "Kirim"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
