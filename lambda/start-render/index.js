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

    // Normalizza i props: se s3PlayerUrl o overlayImage sono chiavi S3, trasformale in URL complete
    let mergedProps = { ...inputProps };

    const toS3Url = (val) => `https://${ASSET_BUCKET}.s3.${REGION}.amazonaws.com/${String(val).replace(/^\/+/, '')}`;

    console.log("!!! FIRST S3PlayerUrl:", mergedProps.s3PlayerUrl);
    console.log("!!! FIST OverlayImage:", mergedProps.overlayImage);

    if (mergedProps) {
      if (mergedProps.s3PlayerUrl && !isAbsoluteUrl(mergedProps.s3PlayerUrl)) {
        if (!ASSET_BUCKET) {
          console.warn('ASSET_BUCKET non impostato: s3PlayerUrl è una chiave ma non posso costruire la URL. La lascio invariata.');
        } else {
          mergedProps.s3PlayerUrl = toS3Url(mergedProps.s3PlayerUrl);
        }
      }

      if (mergedProps.overlayImage && !isAbsoluteUrl(mergedProps.overlayImage)) {
        if (!ASSET_BUCKET) {
          console.warn('ASSET_BUCKET non impostato: overlayImage è una chiave ma non posso costruire la URL. La lascio invariata.');
        } else {
          mergedProps.overlayImage = toS3Url(mergedProps.overlayImage);
        }
      }
    }
    console.log("??? AFTER S3PlayerUrl:", mergedProps.s3PlayerUrl);
    console.log("??? AFTER OverlayImage:", mergedProps.overlayImage);

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
