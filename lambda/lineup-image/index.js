const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const getCorsHeaders = (event) => {
  // Lambda Function URLs puts headers in event.headers (case-insensitive lookup)
  const headers = event.headers || {};
  const origin = headers.origin || headers.Origin || headers.ORIGIN || 
                 event.requestContext?.http?.headers?.origin ||
                 event.requestContext?.http?.headers?.Origin ||
                 '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };
};

exports.handler = async (event) => {
  // Handle preflight OPTIONS request
  const requestMethod = event.requestContext?.http?.method || event.requestContext?.httpMethod || event.httpMethod || (typeof event === 'string' ? 'GET' : 'POST');
  if (requestMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: '',
    };
  }

  try {
    const isApiGwV2 = !!event?.requestContext?.http;
    const bodyStr = isApiGwV2 ? event.body : (event.body || '');
    const payload = typeof bodyStr === 'string' && bodyStr ? JSON.parse(bodyStr) : (event || {});
    const { players, opponentTeam } = payload || {};

    if (!players || !Array.isArray(players) || players.length !== 11) {
      return responseJson(400, { error: 'Missing or invalid players data. Expected exactly 11 players.' }, event);
    }
    if (!opponentTeam || !String(opponentTeam).trim()) {
      return responseJson(400, { error: 'Missing opponent team name' }, event);
    }

    const region = process.env.AWS_REGION || 'eu-west-1';
    const assetBucket = process.env.ASSET_BUCKET;
    if (!assetBucket) {
      return responseJson(500, { error: 'ASSET_BUCKET env var is required' }, event);
    }

    const lineupBaseUrl = `https://${assetBucket}.s3.${region}.amazonaws.com/lineup`;

    const playerRows = players.map((p) => {
      const captainIcon = p.isCaptain ? `<img class=\"cap\" src=\"${lineupBaseUrl}/cap.png\" />` : '';
      return `
        <div class=\"row\">
          <div class=\"num\">${p.number}</div>
          <div class=\"name\">${String(p.playerName || '').toUpperCase()} ${captainIcon}</div>
        </div>`;
    }).join('');

    const htmlTemplate = `<!doctype html>
<html lang=\"it\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
  <title>Starting XI</title>
  <style>
    @font-face { font-family: 'Tusker'; src: url('${lineupBaseUrl}/TuskerGrotesk-3500Medium.woff2') format('woff2'), url('${lineupBaseUrl}/TuskerGrotesk-3500Medium.woff') format('woff'); font-weight: 500; font-style: normal; font-display: swap; ascent-override: 110%; }
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
  <div class=\"card\">
    <div class=\"bgimg\"><img src=\"${lineupBaseUrl}/group.png\" /></div>
    <div class=\"element\"><h1>STARTING XI</h1><p>Vs ${String(opponentTeam).toUpperCase()}</p></div>
    <div class=\"element flexmore\">
      <div class=\"list\">${playerRows}</div>
      <div class=\"logoimg\"><img src=\"${lineupBaseUrl}/logo.png\" /></div>
    </div>
    <div class=\"grid\">
      <div class=\"sponsor\"><img src=\"${lineupBaseUrl}/vega.png\" /></div>
      <div class=\"sponsor\"><img src=\"${lineupBaseUrl}/loooma.png\" /></div>
      <div class=\"sponsor\"><img src=\"${lineupBaseUrl}/mm.png\" /></div>
      <div class=\"sponsor\"><img src=\"${lineupBaseUrl}/onlight.png\" /></div>
      <div class=\"sponsor\"><img src=\"${lineupBaseUrl}/sens.png\" /></div>
      <div class=\"sponsor\"><img src=\"${lineupBaseUrl}/neotec.png\" /></div>
      <div class=\"sponsor\"><img src=\"${lineupBaseUrl}/rubes-w.png\" /></div>
    </div>
  </div>
  </body>
  </html>`;

    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1080, height: 2000, deviceScaleFactor: 1 },
      executablePath,
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 2000 } });
    await browser.close();

    return responsePng(png, event);
  } catch (e) {
    console.error('lineup-image error:', e);
    return responseJson(500, { error: String(e?.message || e) }, event);
  }
};

function responseJson(statusCode, obj, event) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...getCorsHeaders(event) },
    body: JSON.stringify(obj),
  };
}

function responsePng(buffer, event) {
  // AWS Lambda Function URLs supporta risposte binarie con isBase64Encoded: true
  const base64Image = Buffer.from(buffer).toString('base64');
  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'image/png',
      ...getCorsHeaders(event)
    },
    body: base64Image,
    isBase64Encoded: true
  };
}


