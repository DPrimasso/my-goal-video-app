const path = require('path');

// runtime-safe client
const {renderMediaOnLambda, getRenderProgress} = require('@remotion/lambda/client');
// deploy utils
const {deploySite, getOrCreateBucket} = require('@remotion/lambda');

const REGION = process.env.AWS_REGION;
const LAMBDA_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;

let serveUrl;
let bucketName;

/**
 * Deploy the Remotion site to Lambda once and cache the resulting serveUrl.
 * Should be invoked during server start.
 */
async function initServeUrl() {
  if (serveUrl && bucketName) {
    return;
  }

  const entry = path.join(
    __dirname,
    '..',
    '..',
    'client',
    'src',
    'remotion',
    'index.tsx'
  );
  const bucket = await getOrCreateBucket({region: REGION});
  bucketName = bucket.bucketName;
  const deployment = await deploySite({
    entryPoint: entry,
    bucketName,
    region: REGION,
  });
  serveUrl = deployment.serveUrl;
  // opzionale: mettiamo il serveUrl nel process env per usi futuri
  process.env.REMOTION_SERVE_URL = serveUrl;
}

async function renderOnLambda({composition, inputProps, outName}) {
  if (!serveUrl) {
    throw new Error('serveUrl not initialized. Call initServeUrl() at server startup.');
  }

  const {renderId} = await renderMediaOnLambda({
    region: REGION,
    functionName: LAMBDA_NAME,
    serveUrl,
    composition,
    inputProps,
    codec: 'h264',
    outName,
    // opzionale: forceBucketName: bucketName,
  });

  // Poll fino a completamento
  // (usa un backoff se vuoi essere più gentile con Lambda)
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
      return p.outputFile; // URL S3 finale
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

module.exports = {renderOnLambda, initServeUrl};

