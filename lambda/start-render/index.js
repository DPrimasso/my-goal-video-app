const {renderMediaOnLambda} = require('@remotion/lambda/client');
const {getOrCreateBucket} = require('@remotion/lambda');

exports.handler = async (event) => {
  try {
    const payload = event && event.body ? JSON.parse(event.body) : {};
    const {
      composition,
      compositionId,
      inputProps = {},
      outName,
      codec = 'h264',
    } = payload;

    const REGION = process.env.AWS_REGION || 'eu-west-1';
    const FUNCTION_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;
    const SERVE_URL = process.env.REMOTION_SERVE_URL;
    const SITE_NAME = process.env.REMOTION_SITE_NAME;
    const DEFAULT_COMP = process.env.DEFAULT_COMPOSITION_ID || 'GoalComp';

    // Bucket per asset dinamici passati come chiavi (es. players/7.png)
    const ASSET_BUCKET = process.env.ASSET_BUCKET;

    // Helper: controlla se una stringa è una URL assoluta
    const isAbsoluteUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);

    // Normalizza i props: se s3PlayerUrl è una chiave S3, trasformala in URL completa
    let mergedProps = { ...inputProps };
    if (mergedProps && mergedProps.s3PlayerUrl && !isAbsoluteUrl(mergedProps.s3PlayerUrl)) {
      if (!ASSET_BUCKET) {
        console.warn('ASSET_BUCKET non impostato: s3PlayerUrl è una chiave ma non posso costruire la URL. La lascio invariata.');
      } else {
        const key = String(mergedProps.s3PlayerUrl).replace(/^\/+/, '');
        mergedProps.s3PlayerUrl = `https://${ASSET_BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
      }
    }

    if (!FUNCTION_NAME) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing REMOTION_LAMBDA_FUNCTION_NAME' }) };
    }

    const comp = composition || compositionId || DEFAULT_COMP;

    if (!SERVE_URL && !SITE_NAME) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing REMOTION_SERVE_URL or REMOTION_SITE_NAME' }) };
    }

    const {bucketName} = await getOrCreateBucket({ region: REGION });

    const options = {
      region: REGION,
      functionName: FUNCTION_NAME,
      composition: comp,
      inputProps: mergedProps,
      codec,
      outName,
      forceBucketName: bucketName,
    };
    if (SERVE_URL) {
      options.serveUrl = SERVE_URL;
    } else {
      options.siteName = SITE_NAME;
    }

    const {renderId} = await renderMediaOnLambda(options);

    return {
      statusCode: 200,
      body: JSON.stringify({ bucketName, renderId }),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(e && e.message ? e.message : e) }),
    };
  }
};
