import QRCode from "qrcode";

/** QR code sebagai data URL PNG, dipakai di QrFooter template surat. */
export async function generateQrDataUrl(verifyUrl: string): Promise<string> {
  return QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
}
