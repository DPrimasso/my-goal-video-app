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
      jpegQuality = 80,
      frameRange,
      numberOfGifLoops,
      audioBitrate,
      videoBitrate,
      crf,
      pixelFormat,
      audioCodec,
      videoCodec,
      height,
      width,
      fps,
      durationInFrames,
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
    if (!FUNCTION_NAME) {
      return { 
        statusCode: 500, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing REMOTION_LAMBDA_FUNCTION_NAME' }) 
      };
    }

    const comp = composition || compositionId || DEFAULT_COMP;

    if (!SERVE_URL && !SITE_NAME) {
      return { 
        statusCode: 500, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing REMOTION_SERVE_URL or REMOTION_SITE_NAME' }) 
      };
    }

    const {bucketName} = await getOrCreateBucket({ region: REGION });

    // Configurazione avanzata per il rendering
    const options = {
      region: REGION,
      functionName: FUNCTION_NAME,
      composition: comp,
      inputProps: mergedProps,
      codec,
      outName,
      forceBucketName: bucketName,
      jpegQuality,
      audioBitrate,
      videoBitrate,
      crf,
      pixelFormat,
      audioCodec,
      videoCodec,
      height,
      width,
      fps,
      durationInFrames,
    };

    // Aggiungi opzioni condizionali
    if (frameRange) {
      options.frameRange = frameRange;
    }
    
    if (numberOfGifLoops !== undefined) {
      options.numberOfGifLoops = numberOfGifLoops;
    }

    if (SERVE_URL) {
      options.serveUrl = SERVE_URL;
    } else {
      options.siteName = SITE_NAME;
    }

    console.log('Starting render with options:', JSON.stringify(options, null, 2));

    const {renderId} = await renderMediaOnLambda(options);

    console.log(`Render started successfully with ID: ${renderId}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        bucketName, 
        renderId,
        message: 'Render started successfully'
      }),
    };
  } catch (e) {
    console.error('Error in start-render lambda:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false,
        error: String(e && e.message ? e.message : e),
        stack: e.stack
      }),
    };
  }
};
