import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

// Local disk di /storage (di luar /public - file surat TIDAK boleh langsung
// bisa diakses publik tanpa lewat cek RBAC di route handler download).
// Lihat plan: self-hosted Node process punya disk persisten, cocok untuk ini;
// kalau nanti pindah ke serverless, ganti modul ini dengan adapter S3/R2 -
// pemanggilnya (generateSurat action) tidak perlu berubah.
const STORAGE_ROOT = path.join(process.cwd(), "storage", "surat");

function sanitizeForFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]/g, "_");
}

export type SavedFileRef = {
  /** Path relatif yang disimpan di LogSurat.filePdfUrl - bukan URL publik. */
  relativePath: string;
};

export async function saveSuratPdf(params: {
  tahun: number;
  divisiKode: string;
  nomorSuratFull: string;
  pdfBuffer: Buffer;
}): Promise<SavedFileRef> {
  const dir = path.join(STORAGE_ROOT, String(params.tahun), params.divisiKode);
  await mkdir(dir, { recursive: true });

  const filename = `${sanitizeForFilename(params.nomorSuratFull)}.pdf`;
  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, params.pdfBuffer);

  const relativePath = path.posix.join(String(params.tahun), params.divisiKode, filename);
  return { relativePath };
}

export async function readSuratPdf(relativePath: string): Promise<Buffer> {
  // Cegah path traversal - relativePath berasal dari DB (LogSurat.filePdfUrl)
  // yang kita tulis sendiri, tapi tetap dijaga sebagai defense-in-depth.
  const fullPath = path.join(STORAGE_ROOT, relativePath);
  if (!fullPath.startsWith(STORAGE_ROOT)) {
    throw new Error("Path file tidak valid.");
  }
  return readFile(fullPath);
}
