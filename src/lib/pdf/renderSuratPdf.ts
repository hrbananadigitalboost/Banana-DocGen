import { readFile } from "node:fs/promises";
import path from "node:path";
import { putRenderPayload } from "./renderCache";
import { withPage } from "./browserPool";
import type { SuratTemplateProps } from "@/components/templates/surat/types";

export type RenderSuratPdfOptions = {
  /** Origin (protokol+host) tempat Puppeteer akan menembak rute /print internal. */
  baseUrl?: string;
};

// Kop surat di-render sebagai PAGE HEADER Puppeteer (bukan inline di konten -
// lihat LetterheadLayout.tsx), supaya otomatis berulang di SETIAP halaman
// fisik kalau surat meluber lebih dari 1 halaman, apapun jenis suratnya,
// tanpa perlu template manapun menebak titik potong halaman secara manual.
// Dicache sebagai data URI di module scope - dibaca sekali per proses, bukan
// per render (file kecil, tapi tidak perlu baca disk berulang-ulang).
let kopSuratDataUriPromise: Promise<string> | null = null;
function getKopSuratDataUri(): Promise<string> {
  if (!kopSuratDataUriPromise) {
    kopSuratDataUriPromise = readFile(
      path.join(process.cwd(), "public", "assets", "letterhead", "kop-surat.png")
    ).then((buf) => `data:image/png;base64,${buf.toString("base64")}`);
  }
  return kopSuratDataUriPromise;
}

// Kop surat asli beraspek rasio ~3.98:1 - pada lebar penuh A4 (210mm) itu
// berarti tinggi ~53mm. Pada halaman ke-2+ surat yang meluber TIDAK ada
// padding tambahan dari konten (py-8 di LetterheadLayout cuma berlaku sekali
// di awal seluruh alur konten, bukan per halaman fisik) - jadi seluruh jarak
// aman terhadap kop surat harus berasal dari margin.top ini sendiri.
// Diverifikasi lewat render PDF sungguhan: 62mm memberi jarak bersih ~4mm di
// setiap halaman tanpa teks bertabrakan dengan kop surat.
const HEADER_MARGIN_TOP = "62mm";

// Chromium selalu menyisipkan inset internal ~5mm di ATAS area headerTemplate
// yang tidak bisa dihilangkan lewat CSS reset (margin/padding:0 di konten
// headerTemplate tidak berpengaruh - sudah dicoba & diverifikasi via render
// PDF sungguhan). Satu-satunya cara menghilangkan celah putih itu adalah
// menggeser gambar kop surat ke atas dengan margin-top negatif sebesar inset
// tersebut, supaya kop surat benar-benar rata dengan tepi atas kertas.
const HEADER_TOP_INSET_OFFSET = "-5mm";

// Footer berulang di setiap halaman fisik (sama seperti kop surat) - nomor
// halaman + nama perusahaan, dipisah garis aksen tipis warna brand supaya
// hasil PDF multi-halaman terlihat rapi dan konsisten dengan header.
// Padding kiri/kanan 16mm menyamai px-16 pada konten (LetterheadLayout.tsx)
// supaya teks footer sejajar dengan margin teks surat di atasnya.
const FOOTER_MARGIN_BOTTOM = "18mm";
const FOOTER_TEMPLATE = `
  <div style="width:100%; box-sizing:border-box; padding:0 16mm; font-family:'Times New Roman', Times, serif; font-size:9px; color:#64748b;">
    <div style="display:flex; align-items:center; justify-content:space-between; border-top:1.5px solid #F2A900; padding-top:3px;">
      <span>PT. Banana Digital Boost</span>
      <span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>
    </div>
  </div>
`;

/**
 * Render satu surat (template + data) ke PDF Buffer via Puppeteer.
 *
 * Alih-alih membangun HTML mentah manual, ini menembak halaman Next.js asli
 * di /print/surat/[token] (lewat cache file temp sekali-pakai) sehingga PDF
 * memakai render engine, CSS Tailwind, dan komponen yang PERSIS sama dengan
 * live preview browser - WYSIWYG, tidak ada duplikasi styling.
 */
export async function renderSuratPdf(
  componentKey: string,
  props: SuratTemplateProps,
  options: RenderSuratPdfOptions = {}
): Promise<Buffer> {
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const token = await putRenderPayload({ componentKey, props });
  const url = `${baseUrl}/print/surat/${token}`;

  const kopSuratDataUri = await getKopSuratDataUri();

  return withPage(async (page) => {
    const response = await page.goto(url, { waitUntil: "networkidle0" });
    if (!response || response.status() >= 400) {
      throw new Error(
        `Render surat gagal: halaman print mengembalikan status ${response?.status()} untuk token render.`
      );
    }

    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<img src="${kopSuratDataUri}" style="width:100%;display:block;margin-top:${HEADER_TOP_INSET_OFFSET};" />`,
      footerTemplate: FOOTER_TEMPLATE,
      margin: { top: HEADER_MARGIN_TOP, bottom: FOOTER_MARGIN_BOTTOM, left: "0mm", right: "0mm" },
    });

    return Buffer.from(pdfBytes);
  });
}
