const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function isPng(buffer) {
  return Buffer.isBuffer(buffer)
    && buffer.length >= PNG_SIGNATURE.length
    && buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

async function convertPngToInstagramJpeg(buffer) {
  const sharp = require('sharp');
  const source = sharp(buffer, { failOn: 'error', limitInputPixels: 25_000_000 });
  const metadata = await source.metadata();
  if (metadata.format !== 'png' || !metadata.width || !metadata.height) {
    throw new Error('INVALID_PNG');
  }
  const ratio = metadata.width / metadata.height;
  if (Math.abs(ratio - 9 / 16) > 0.01) throw new Error('INVALID_ASPECT_RATIO');

  return source
    .rotate()
    .resize(1080, 1920, { fit: 'fill' })
    .flatten({ background: '#000000' })
    .toColorspace('srgb')
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toBuffer();
}

module.exports = { convertPngToInstagramJpeg, isPng };
