import puppeteer from "puppeteer";
import path from "node:path";

const pdfPath = path.resolve("storage/surat/2026/HRD/002_BDB_HRD-SKK_VII_2026.pdf").replace(/\\/g, "/");
const fileUrl = `file:///${pdfPath}`;

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 1400 });
await page.goto(fileUrl, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 3000));
await page.screenshot({ path: "real-pdf-full.png" });
await browser.close();
console.log("done");
