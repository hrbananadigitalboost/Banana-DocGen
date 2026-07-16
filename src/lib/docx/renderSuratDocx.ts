import juice from "juice";
import HTMLtoDOCX from "@turbodocx/html-to-docx";
import { putRenderPayload } from "../pdf/renderCache";
import { withPage } from "../pdf/browserPool";
import type { SuratTemplateProps } from "@/components/templates/surat/types";

export type RenderSuratDocxOptions = {
  /** Origin (protokol+host) tempat Puppeteer akan menembak rute /print internal. */
  baseUrl?: string;
};

/**
 * Render satu surat (template + data) ke DOCX Buffer, supaya user bisa
 * revisi sendiri kesalahan kecil (typo dsb) tanpa balik ke aplikasi.
 *
 * Sama seperti renderSuratPdf.ts (menembak /print/surat/[token] yang sama,
 * bukan bangun HTML terpisah) - filosofi WYSIWYG dipertahankan supaya jenis
 * surat baru otomatis dapat export Word tanpa kerja tambahan per template.
 *
 * Beda dari jalur PDF:
 * - Dipanggil dengan ?mode=preview, BUKAN mode print - DOCX tidak punya
 *   padanan "page header" Puppeteer (yang dipakai renderSuratPdf.ts untuk
 *   kop surat berulang), jadi kop surat perlu inline di body seperti live
 *   preview browser (lihat LetterheadLayout.tsx).
 * - html-to-docx cuma paham inline style="...", bukan class CSS - semua
 *   style Tailwind di-inline dulu pakai juice sebelum konversi.
 * - Gambar (kop surat/tanda tangan/stempel) dipakai lewat <img src="/...">
 *   path relatif (jalan normal di browser & Puppeteer PDF), tapi html-to-docx
 *   butuh URL absolut/data-URI untuk fetch gambarnya sendiri - di-resolve ke
 *   absolut dulu via DOM property img.src sebelum diserialisasi.
 *
 * Batasan yang diketahui (bukan bug): blok tanda tangan menumpuk gambar
 * stempel di bawah tanda tangan pakai CSS position:absolute - DOCX tidak
 * punya padanan itu, jadi tampilannya di Word kemungkinan terpisah/tidak
 * overlap serapi PDF. Isi teks surat tetap bersih & editable.
 */
export async function renderSuratDocx(
  componentKey: string,
  props: SuratTemplateProps,
  options: RenderSuratDocxOptions = {}
): Promise<Buffer> {
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const token = await putRenderPayload({ componentKey, props });
  const url = `${baseUrl}/print/surat/${token}?mode=preview`;

  const { html, css } = await withPage(async (page) => {
    const response = await page.goto(url, { waitUntil: "networkidle0" });
    if (!response || response.status() >= 400) {
      throw new Error(
        `Render surat gagal: halaman print mengembalikan status ${response?.status()} untuk token render.`
      );
    }

    await page.evaluate(() => {
      document.querySelectorAll("img").forEach((img) => {
        img.setAttribute("src", img.src);
      });
    });

    const pageHtml = await page.content();
    const pageCss = await page.evaluate(() => {
      let out = "";
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            out += rule.cssText + "\n";
          }
        } catch {
          // stylesheet cross-origin (tidak ada di app ini, tapi jaga-jaga) - skip.
        }
      }
      return out;
    });

    return { html: pageHtml, css: pageCss };
  });

  const inlinedHtml = juice.inlineContent(html, css);

  const docxBuffer = await HTMLtoDOCX(inlinedHtml, null, {
    table: { row: { cantSplit: true } },
  });

  return Buffer.from(docxBuffer as ArrayBuffer);
}
