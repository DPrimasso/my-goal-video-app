const { HttpError } = require('./http');

function getAssetContext() {
  const bucket = process.env.ASSET_BUCKET;
  if (!bucket) throw new HttpError(500, 'CONFIGURATION_ERROR', 'ASSET_BUCKET non configurato.');
  return { bucket, region: process.env.AWS_REGION || 'eu-west-1' };
}

function assetUrl(context, key) {
  const safeKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${context.bucket}.s3.${context.region}.amazonaws.com/${safeKey}`;
}

module.exports = { getAssetContext, assetUrl };
