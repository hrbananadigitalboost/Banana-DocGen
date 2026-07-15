import sharp from "sharp";
import path from "node:path";

const DIR = "public/assets/signatures";
const PAD = 12; // padding seragam (px) supaya tetap ada sedikit napas di tepi

const files = [
  "ttd_afriliza.png",
  "ttd_cindy.jpeg",
  "ttd_dinar.png",
  "ttd_ferry-Dg74AbXI.png",
  "ttd_pak_edi.png",
  "ttd_salman.jpeg",
];

for (const file of files) {
  const input = path.join(DIR, "_original", file);
  const output = path.join(DIR, file);

  const img = sharp(input).trim({ threshold: 30 });
  const trimmedBuffer = await img.toBuffer();
  const meta = await sharp(trimmedBuffer).metadata();

  const isPng = file.endsWith(".png");
  let pipeline = sharp(trimmedBuffer).extend({
    top: PAD,
    bottom: PAD,
    left: PAD,
    right: PAD,
    background: isPng ? { r: 255, g: 255, b: 255, alpha: 0 } : { r: 255, g: 255, b: 255 },
  });

  if (isPng) pipeline = pipeline.png();
  else pipeline = pipeline.jpeg({ quality: 92 });

  await pipeline.toFile(output);
  console.log(file, "trimmed:", meta.width, "x", meta.height, "-> saved with padding");
}
