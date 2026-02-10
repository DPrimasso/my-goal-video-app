const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

const isHttpUrl = (url) =>
  typeof url === 'string' &&
  (url.startsWith('http://') || url.startsWith('https://'));

const isLocalAssetPath = (assetPath) =>
  assetPath.startsWith('players/') ||
  assetPath.startsWith('/players/') ||
  assetPath.startsWith('clips/') ||
  assetPath.startsWith('logo');

function getAssetUrl(assetPath) {
  if (!assetPath) return '';

  if (isHttpUrl(assetPath)) {
    console.log(`S3 URL detected: ${assetPath}`);
    return assetPath;
  }

  if (isLocalAssetPath(assetPath)) {
    const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
    const localUrl = `${BASE_URL}/${cleanPath}`;
    console.log(`Local asset: ${assetPath} -> ${localUrl}`);
    return localUrl;
  }

  console.log(`Default case: ${assetPath}`);
  return assetPath;
}

module.exports = {
  getAssetUrl,
  BASE_URL,
};
