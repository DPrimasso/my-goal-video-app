const chromiumModule = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const chromium = chromiumModule.default || chromiumModule;

if (!Array.isArray(chromium.args) || typeof chromium.executablePath !== 'function' || typeof puppeteer.launch !== 'function') {
  throw new Error('Runtime Chromium/Puppeteer incompatibile.');
}

async function renderHtmlToPng(html, viewport) {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { ...viewport, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(15_000);
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(images.map((image) => image.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
          })));
    });
    return await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: viewport.width, height: viewport.height } });
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { renderHtmlToPng };
