const { HttpError } = require('./http');

const LINEUP_SPONSOR_KEYS = Object.freeze([
  'vega.png', 'loooma.png', 'mm.png', 'onlight.png',
  'sens.png', 'neotec.png', 'rubes-w.png', 'eurotir.png',
  'transfilm.png', 'calzificio_leonardo.png', 'delta_antinfortunistica.png', 'lavanderia_moderna.png',
  'brunetti.png', 'elman.png', 'maraldo.png',
]);

function getAssetContext() {
  const bucket = process.env.ASSET_BUCKET;
  if (!bucket) throw new HttpError(500, 'CONFIGURATION_ERROR', 'ASSET_BUCKET non configurato.');
  return { bucket, region: process.env.AWS_REGION || 'eu-west-1' };
}

function assetUrl(context, key) {
  const safeKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${context.bucket}.s3.${context.region}.amazonaws.com/${safeKey}`;
}

module.exports = { getAssetContext, assetUrl, LINEUP_SPONSOR_KEYS };
