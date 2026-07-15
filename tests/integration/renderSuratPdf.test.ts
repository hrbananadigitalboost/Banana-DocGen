import { describe, expect, it } from "vitest";

// Test end-to-end lengkap (happy path) untuk pipeline renderSuratPdf
// diverifikasi manual lewat browser (klik tombol "Preview PDF Asli" di
// /surat/baru sambil login) karena renderSuratPdf bergantung pada cache
// in-memory single-proses yang hanya valid di dalam proses server Next.js -
// tidak bisa dipicu dari proses vitest terpisah tanpa autentikasi Auth.js
// penuh (CSRF handshake credentials provider).
const RUNNING_APP_URL = process.env.RUNNING_APP_URL;

describe.skipIf(!RUNNING_APP_URL)("POST /api/surat/preview-pdf", () => {
  it("menolak request tanpa session dengan 401", async () => {
    const res = await fetch(`${RUNNING_APP_URL}/api/surat/preview-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(401);
  }, 15000);
});
