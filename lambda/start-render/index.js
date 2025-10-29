const {renderMediaOnLambda} = require('@remotion/lambda/client');
const {getOrCreateBucket} = require('@remotion/lambda');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

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
      action,
    } = payload;

    const REGION = process.env.AWS_REGION || 'eu-west-1';
    const FUNCTION_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;
    const SERVE_URL = process.env.REMOTION_SERVE_URL;
    const SITE_NAME = process.env.REMOTION_SITE_NAME;
    const DEFAULT_COMP = process.env.DEFAULT_COMPOSITION_ID || 'GoalComp';

    // Bucket per asset dinamici passati come chiavi (es. players/7.png) e per HTML lineup assets
    const ASSET_BUCKET = process.env.ASSET_BUCKET;

    // Helper: controlla se una stringa è una URL assoluta
    const isAbsoluteUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);

    // Normalizza i props: se s3PlayerUrl o overlayImage sono chiavi S3, trasformale in URL complete
    let mergedProps = { ...inputProps };
    
    console.log('🎯 Lambda received inputProps:', JSON.stringify(inputProps, null, 2));
    
    // Note: FinalResultComp data is now formatted in the frontend before sending to Lambda
    // No conversion needed here anymore

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

    // NEW: lineup image generation (HTML->PNG) using headless Chrome
    if (action === 'lineup-image') {
      const { players, opponentTeam } = payload;
      if (!players || !Array.isArray(players) || players.length !== 11) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Missing or invalid players data. Expected exactly 11 players.' }),
        };
      }
      if (!opponentTeam || !String(opponentTeam).trim()) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Missing opponent team name' }),
        };
      }

      const lineupBaseUrl = `https://${ASSET_BUCKET}.s3.${REGION}.amazonaws.com/lineup`;

      const playerRows = players.map((p) => {
        const captainIcon = p.isCaptain ? `<img class="cap" src="${lineupBaseUrl}/cap.png" />` : '';
        return `
        <div class="row">
          <div class="num">${p.number}</div>
          <div class="name">${String(p.playerName || '').toUpperCase()} ${captainIcon}</div>
        </div>`;
      }).join('');

      const htmlTemplate = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Starting XI</title>
  <style>
    @font-face {
      font-family: 'Tusker';
      src: url('${lineupBaseUrl}/TuskerGrotesk-3500Medium.woff2') format('woff2'),
           url('${lineupBaseUrl}/TuskerGrotesk-3500Medium.woff') format('woff');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
      ascent-override: 110%;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html,body{ color:white; font-weight:500; font-family: 'Tusker', sans-serif; width:1080px; height:2000px; margin:0; padding:0; background-color:black; overflow:hidden; position:absolute; top:0; left:0; }
    .card{ width:1080px; height:2000px; overflow:visible; padding:80px 40px 160px; background-image:url('${lineupBaseUrl}/bg.jpg'); background-size:cover; background-repeat:no-repeat; background-position:center; position:absolute; top:0; left:0; display:flex; gap:10px; flex-direction:column; margin:0; box-sizing:border-box; }
    .bgimg{ position:absolute; inset:0; width:100%; height:100%; opacity:.2; }
    .bgimg img{ width:100%; height:100%; object-position:center; object-fit:cover; }
    .card .element{ position:relative; z-index:50; border-radius:10px; background-color:rgba(0,0,0,.8); padding:80px; }
    .card .element h1{ font-size:180px; margin:0; line-height:1; }
    .card .element p{ font-size:60px; display:block; text-transform:uppercase; margin:0; margin-top:24px; line-height:1; }
    .card .element.flexmore { flex:1; }
    .card .grid{ display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:10px; position:relative; z-index:50; }
    .card .grid .sponsor{ grid-column:span 1 / span 1; aspect-ratio:2/1; border-radius:10px; background-color:rgba(0,0,0,.8); display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .card .grid .sponsor img{ width:60%; }
    .card .list{ display:flex; width:100%; flex-direction:column; gap:10px; justify-content:space-between; height:100%; }
    .card .list .row{ display:grid; line-height:1; grid-template-columns:repeat(10, minmax(0, 1fr)); font-size:80px; }
    .num{ grid-column:span 1 / span 1; color:#DD0000; }
    .name{ grid-column:span 7 / span 7; display:flex; align-items:center; gap:16px; }
    .name img.cap{ aspect-ratio:1; width:54px; }
    .logoimg{ position:absolute; bottom:30px; right:40px; max-width:45%; height:auto; opacity:.1; overflow:hidden }
  </style>
  </head>
  <body>
  <div class="card">
    <div class="bgimg"><img src="${lineupBaseUrl}/group.png" /></div>
    <div class="element"><h1>STARTING XI</h1><p>Vs ${String(opponentTeam).toUpperCase()}</p></div>
    <div class="element flexmore">
      <div class="list">${playerRows}</div>
      <div class="logoimg"><img src="${lineupBaseUrl}/logo.png" /></div>
    </div>
    <div class="grid">
      <div class="sponsor"><img src="${lineupBaseUrl}/vega.png" /></div>
      <div class="sponsor"><img src="${lineupBaseUrl}/loooma.png" /></div>
      <div class="sponsor"><img src="${lineupBaseUrl}/mm.png" /></div>
      <div class="sponsor"><img src="${lineupBaseUrl}/onlight.png" /></div>
      <div class="sponsor"><img src="${lineupBaseUrl}/sens.png" /></div>
      <div class="sponsor"><img src="${lineupBaseUrl}/neotec.png" /></div>
      <div class="sponsor"><img src="${lineupBaseUrl}/rubes-w.png" /></div>
    </div>
  </div>
  </body>
  </html>`;

      const executablePath = await chromium.executablePath;
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1080, height: 2000, deviceScaleFactor: 1 },
        executablePath,
        headless: chromium.headless,
      });
      const page = await browser.newPage();
      await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 1500));
      const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 2000 } });
      await browser.close();

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'image/png',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
        },
        isBase64Encoded: true,
        body: png.toString('base64'),
      };
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
