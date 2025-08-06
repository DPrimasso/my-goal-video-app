const path = require('path');
const {bundle} = require('@remotion/bundler');
const {renderMediaOnLambda, deploySite, getOrCreateBucket} = require('@remotion/lambda');

const REGION = process.env.AWS_REGION;
const LAMBDA_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;

async function renderOnLambda({composition, inputProps, outName}) {
  const entry = path.join(__dirname, '..', '..', 'client', 'src', 'remotion', 'index.tsx');
  const bundled = await bundle(entry);
  const {bucketName} = await getOrCreateBucket({region: REGION});
  const {serveUrl} = await deploySite({
    entryPoint: bundled,
    bucketName,
    region: REGION,
  });

  const {renderId} = await renderMediaOnLambda({
    functionName: LAMBDA_NAME,
    serveUrl,
    composition,
    inputProps,
    codec: 'h264',
    outName,
    forceBucketName: bucketName,
    region: REGION,
  });

  const result = await renderMediaOnLambda.waitForRender({
    functionName: LAMBDA_NAME,
    renderId,
    region: REGION,
  });

  return result.outputFileUrl;
}

module.exports = {renderOnLambda};
