import sharp from "sharp";

const file = process.argv[2] || "public/assets/signatures/ttd_ferry-Dg74AbXI.png";
const img = sharp(file);
const meta = await img.metadata();
const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
let minX = width, maxX = 0, minY = height, maxY = 0;
let inkCount = 0;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * channels;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
    // "ink" = dark-ish pixel that's also reasonably opaque
    const luminance = (r + g + b) / 3;
    if (a > 40 && luminance < 180) {
      inkCount++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log({
  file,
  canvasSize: { width, height },
  inkBoundingBox: { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY },
  marginLeft: minX,
  marginRight: width - maxX,
  marginTop: minY,
  marginBottom: height - maxY,
  inkCount,
});
