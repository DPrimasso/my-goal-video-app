const {renderMediaOnLambda} = require('@remotion/lambda/client');
const {getOrCreateBucket} = require('@remotion/lambda');

exports.handler = async (event) => {
  const {composition, inputProps, outName} = JSON.parse(event.body || '{}');
  const REGION = process.env.AWS_REGION || 'eu-west-1';
  const FUNCTION_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;
  const serveUrl = process.env.REMOTION_SERVE_URL;

  const {bucketName} = await getOrCreateBucket({region: REGION});

  const {renderId} = await renderMediaOnLambda({
    region: REGION,
    functionName: FUNCTION_NAME,
    serveUrl,
    composition,
    inputProps,
    codec: 'h264',
    outName,
    forceBucketName: bucketName,
  });

  return {
    statusCode: 200,
    headers: {'Access-Control-Allow-Origin': '*'},
    body: JSON.stringify({renderId}),
  };
};
