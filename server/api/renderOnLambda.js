const path = require('path');
// runtime-safe client
const { renderMediaOnLambda, getRenderProgress } = require('@remotion/lambda/client');
// deploy utils
const { deploySite, getOrCreateBucket } = require('@remotion/lambda');

const REGION = process.env.AWS_REGION;
const LAMBDA_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;

let serveUrl;
let bucketName;

/**
 * Deploy the Remotion site once (static build) and cache serveUrl.
 */
async function initServeUrl() {
  if (serveUrl && bucketName) {
    return;
  }

  // 1) crea o recupera il bucket
  const bucket = await getOrCreateBucket({ region: REGION });
  bucketName = bucket.bucketName;

  // 2) carica la build statica già prodotta
  const publicDir = path.join(__dirname, 'public');
  const deployment = await deploySite({
    publicDir,    // <— qui
    bucketName,
    region: REGION,
  });
  serveUrl = deployment.serveUrl;

  // 3) (opzionale) esponi serveUrl su env
  process.env.REMOTION_SERVE_URL = serveUrl;
}

async function renderOnLambda({ composition, inputProps, outName }) {
  if (!serveUrl) {
    throw new Error('serveUrl not initialized. Call initServeUrl() at server startup.');
  }

  // lancia il render
  const { renderId } = await renderMediaOnLambda({
    region: REGION,
    functionName: LAMBDA_NAME,
    serveUrl,
    composition,
    inputProps,
    codec: 'h264',
    outName,
  });

  // poll fino a completamento
  for (;;) {
    const p = await getRenderProgress({
      region: REGION,
      functionName: LAMBDA_NAME,
      renderId,
      bucketName,
    });

    if (p.fatalErrorEncountered) {
      throw new Error(`Render failed: ${JSON.stringify(p.errors)}`);
    }
    if (p.done && p.outputFile) {
      return p.outputFile;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

module.exports = { renderOnLambda, initServeUrl };