import { Resend } from "resend";

export type SendSuratEmailParams = {
  to: string;
  nomorSuratFull: string;
  jenisSuratNama: string;
  pdfBuffer: Buffer;
};

export async function sendSuratEmail(params: SendSuratEmailParams): Promise<{ providerMessageId: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY belum dikonfigurasi di server.");
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "noreply@bananadigitalboost.com";
  const safeName = params.nomorSuratFull.replace(/[^a-zA-Z0-9-]/g, "_");

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `${params.jenisSuratNama} - ${params.nomorSuratFull}`,
    html: `<p>Terlampir dokumen <strong>${params.jenisSuratNama}</strong> dengan nomor <strong>${params.nomorSuratFull}</strong> dari PT. Banana Digital Boost.</p>`,
    attachments: [{ filename: `${safeName}.pdf`, content: params.pdfBuffer }],
  });

  if (error) {
    throw new Error(error.message);
  }
  return { providerMessageId: data?.id ?? "unknown" };
}
