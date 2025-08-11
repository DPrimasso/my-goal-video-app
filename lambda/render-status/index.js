const {getRenderProgress} = require('@remotion/lambda/client');
const {getOrCreateBucket} = require('@remotion/lambda');

exports.handler = async (event) => {
  try {
    const method = event?.requestContext?.http?.method || 'UNKNOWN';
    const headers = event?.headers || {};
    const contentType = (headers['content-type'] || headers['Content-Type'] || '').toLowerCase();
    console.log('render-status method:', method, '| content-type:', contentType);

    // --- Query string ---
    const qs = (event && event.queryStringParameters) || {};

    // --- Body (JSON / object / x-www-form-urlencoded) ---
    let body = {};
    if (event && typeof event.body !== 'undefined') {
      let raw = event.body;
      if (event.isBase64Encoded && typeof raw === 'string') {
        raw = Buffer.from(raw, 'base64').toString('utf8');
      }

      if (typeof raw === 'object' && raw !== null) {
        // Console test events a volte passano un oggetto già deserializzato
        body = raw;
      } else if (typeof raw === 'string') {
        const trimmed = raw.trim();
        // Preferisci JSON
        try {
          body = JSON.parse(trimmed);
        } catch (_) {
          // Fallback: x-www-form-urlencoded
          try {
            const params = new URLSearchParams(trimmed);
            body = Object.fromEntries(params.entries());
          } catch (e2) {
            console.warn('render-status: body parse failed for both JSON and form-encoded');
          }
        }
      }
    }

    // Accetta sia query che body
    const renderId = qs.renderId || qs.render_id || qs.id || body.renderId || body.render_id || body.id;

    const REGION = process.env.AWS_REGION || 'eu-west-1';
    const FUNCTION_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;

    if (!renderId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing renderId' }) };
    }
    if (!FUNCTION_NAME) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing REMOTION_LAMBDA_FUNCTION_NAME' }) };
    }

    const envBucket = process.env.ASSET_BUCKET || process.env.BUCKET_NAME;
    let bucketName = qs.bucketName || qs.bucket || body.bucketName || body.bucket || envBucket;
    if (!bucketName) {
      const r = await getOrCreateBucket({ region: REGION });
      bucketName = r.bucketName;
    }

    const status = await getRenderProgress({
      region: REGION,
      functionName: FUNCTION_NAME,
      renderId,
      bucketName,
    });

    return { statusCode: 200, body: JSON.stringify(status) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: String(e && e.message ? e.message : e) }) };
  }
};
