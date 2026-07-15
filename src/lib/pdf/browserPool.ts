import puppeteer, { type Browser, type Page } from "puppeteer";

// Browser instance dijaga tetap hidup (warm) di seluruh lifetime proses
// Node.js, bukan di-launch ulang tiap request - cold launch per request bisa
// makan >1 detik sendiri dan akan melanggar NFR render PDF <2 detik.
let browserPromise: Promise<Browser> | null = null;

async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    // Kosong (undefined) di dev lokal - Puppeteer pakai Chromium bawaannya
    // sendiri. Di container (lihat Dockerfile) di-set ke Chromium sistem
    // yang diinstal lewat apt, supaya image final tidak perlu bundel
    // Chromium hasil download Puppeteer.
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      // /dev/shm di container biasanya kecil (default Docker 64MB) - tanpa
      // flag ini Chromium sering crash di tengah render PDF.
      "--disable-dev-shm-usage",
    ],
  });
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchBrowser();
  }
  const browser = await browserPromise;
  if (!browser.connected) {
    browserPromise = launchBrowser();
    return browserPromise;
  }
  return browser;
}

export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    return await fn(page);
  } finally {
    await page.close();
  }
}
