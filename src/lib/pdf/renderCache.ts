import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { SuratTemplateProps } from "@/components/templates/surat/types";

export type SuratRenderPayload = {
  componentKey: string;
  props: SuratTemplateProps;
};

// Disimpan sebagai file temp, BUKAN Map in-memory: Next.js dev server (dan
// kemungkinan juga runtime produksi) tidak menjamin route handler dan page
// render berbagi module-scope state yang sama proses/worker-nya - terbukti
// dari 404 saat payload ditulis dari satu request lalu dibaca dari request
// lain. Filesystem selalu dibagi terlepas dari batas worker/module.
const TMP_DIR = path.join(os.tmpdir(), "bdb-docgen-render-cache");
const TTL_MS = 30_000;

async function ensureDir() {
  await mkdir(TMP_DIR, { recursive: true });
}

function filePathFor(token: string) {
  return path.join(TMP_DIR, `${token}.json`);
}

export async function putRenderPayload(payload: SuratRenderPayload): Promise<string> {
  await ensureDir();
  const token = randomUUID();
  await writeFile(filePathFor(token), JSON.stringify({ payload, expiresAt: Date.now() + TTL_MS }), "utf-8");
  return token;
}

export async function takeRenderPayload(token: string): Promise<SuratRenderPayload | undefined> {
  const filePath = filePathFor(token);
  try {
    const raw = await readFile(filePath, "utf-8");
    await unlink(filePath).catch(() => {}); // single-use
    const { payload, expiresAt } = JSON.parse(raw) as { payload: SuratRenderPayload; expiresAt: number };
    if (Date.now() > expiresAt) return undefined;
    // JSON.parse tidak mengembalikan Date - hidrasi ulang field tanggal.
    payload.props.tanggalSurat = new Date(payload.props.tanggalSurat);
    return payload;
  } catch {
    return undefined;
  }
}
