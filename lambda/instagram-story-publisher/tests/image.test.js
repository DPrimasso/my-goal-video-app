const assert = require('node:assert/strict');
const test = require('node:test');
const sharp = require('sharp');
const { convertPngToInstagramJpeg, isPng } = require('../image');

test('converte un PNG 9:16 in JPEG 1080x1920', async () => {
  const png = await sharp({
    create: { width: 540, height: 960, channels: 4, background: '#dd0000' },
  }).png().toBuffer();
  assert.equal(isPng(png), true);
  const jpeg = await convertPngToInstagramJpeg(png);
  const metadata = await sharp(jpeg).metadata();
  assert.equal(metadata.format, 'jpeg');
  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 1920);
});

test('adatta la lineup 1080x2000 senza ritagliarla', async () => {
  const lineup = await sharp({
    create: { width: 1080, height: 2000, channels: 4, background: '#dd0000' },
  }).png().toBuffer();
  const jpeg = await convertPngToInstagramJpeg(lineup);
  const metadata = await sharp(jpeg).metadata();
  assert.equal(metadata.format, 'jpeg');
  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 1920);
});

test('rifiuta immagini che non sono nel formato verticale previsto', async () => {
  const square = await sharp({
    create: { width: 400, height: 400, channels: 3, background: '#000000' },
  }).png().toBuffer();
  await assert.rejects(() => convertPngToInstagramJpeg(square), /INVALID_ASPECT_RATIO/);
});
