const path = require('path');

// runtime-safe client
const { renderMediaOnLambda, getRenderProgress } = require('@remotion/lambda/client');
// deploy utils
const { deploySite, getOrCreateBucket } = require('@remotion/lambda');

const REGION = process.env.AWS_REGION;
const LAMBDA_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;

async function renderOnLambda({ composition, inputProps, outName }) {
  const entry = path.join(__dirname, '..', '..', 'client', 'src', 'remotion', 'index.tsx');

  const { bucketName } = await getOrCreateBucket({ region: REGION });
  const { serveUrl } = await deploySite({ entryPoint: entry, bucketName, region: REGION });

  const { renderId } = await renderMediaOnLambda({
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
    await new Promise(r => setTimeout(r, 2000));
  }
}

module.exports = { renderOnLambda };