const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('../client/node_modules/playwright');
const { createHandler } = require('../lambda/goal-image');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets', 's3');
const playerId = process.env.PREVIEW_PLAYER_ID || 'davide_fava';
const fileSuffix = playerId === 'davide_fava' ? '' : `-${playerId.replace(/_/g, '-')}`;
const previews = [
  { file: 'goal.png', eventType: 'goal', homeScore: 1, awayScore: 0 },
  { file: 'rigore-parato.png', eventType: 'penaltySave', homeScore: 0, awayScore: 0 },
];

async function main() {
  process.env.ASSET_BUCKET = 'preview-assets';
  const chromePath = process.env.CHROME_PATH || (process.platform === 'win32'
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    : undefined);
  const browser = await chromium.launch({
    ...(chromePath ? { executablePath: chromePath } : {}),
    headless: true,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 2560 }, deviceScaleFactor: 1 });
    await page.route('https://preview-assets.s3.eu-west-1.amazonaws.com/**', async (route) => {
      const key = decodeURIComponent(new URL(route.request().url()).pathname.slice(1));
      const filePath = path.resolve(assets, key);
      if (!filePath.startsWith(`${assets}${path.sep}`)) throw new Error(`Asset path non valido: ${key}`);
      const extension = path.extname(filePath).toLowerCase();
      const contentType = {
        '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff',
      }[extension] || 'application/octet-stream';
      await route.fulfill({ status: 200, contentType, body: await fs.readFile(filePath) });
    });
    await fs.mkdir(path.join(root, 'previews'), { recursive: true });
    for (const preview of previews) {
      let html = '';
      const handler = createHandler(async (template) => {
        html = template;
        return Buffer.from('preview');
      });
      const response = await handler({ body: JSON.stringify({
        playerId,
        eventType: preview.eventType,
        minuteGoal: 58,
        homeTeam: 'Casalpoglio',
        homeScore: preview.homeScore,
        awayTeam: 'Amatori Club',
        awayScore: preview.awayScore,
      }) });
      if (response.statusCode !== 200) throw new Error(response.body);
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const output = path.join(root, 'previews', preview.file.replace(/\.png$/, `${fileSuffix}.png`));
      await page.screenshot({ path: output });
      console.log(output);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
