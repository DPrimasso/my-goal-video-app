const {getRenderProgress} = require('@remotion/lambda/client');

exports.handler = async (event) => {
  const {renderId} = event.queryStringParameters || {};
  const REGION = process.env.AWS_REGION || 'eu-west-1';
  const FUNCTION_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;
  const bucketName = process.env.ASSET_BUCKET || process.env.BUCKET_NAME;

  const status = await getRenderProgress({
    region: REGION,
    functionName: FUNCTION_NAME,
    renderId,
    bucketName,
  });

  return {
    statusCode: 200,
    headers: {'Access-Control-Allow-Origin': '*'},
    body: JSON.stringify(status),
  };
};
