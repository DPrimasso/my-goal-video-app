const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const getCorsHeaders = (event) => {
  const headers = event.headers || {};
  const origin =
    headers.origin ||
    headers.Origin ||
    headers.ORIGIN ||
    event.requestContext?.http?.headers?.origin ||
    event.requestContext?.http?.headers?.Origin ||
    '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };
};

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

exports.handler = async (event) => {
  const requestMethod =
    event.requestContext?.http?.method ||
    event.requestContext?.httpMethod ||
    event.httpMethod ||
    (typeof event === 'string' ? 'GET' : 'POST');
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
    const payload = typeof bodyStr === 'string' && bodyStr ? JSON.parse(bodyStr) : event || {};
    const { homeTeam, awayTeam, homeScore, awayScore, scorerLines, scorersUnder: rawScorersUnder } = payload || {};

    if (!homeTeam || !String(homeTeam).trim()) {
      return responseJson(400, { error: 'Missing homeTeam or awayTeam' }, event);
    }
    if (!awayTeam || !String(awayTeam).trim()) {
      return responseJson(400, { error: 'Missing homeTeam or awayTeam' }, event);
    }
    if (homeScore === undefined || homeScore === null || Number.isNaN(Number(homeScore))) {
      return responseJson(400, { error: 'Missing or invalid homeScore or awayScore' }, event);
    }
    if (awayScore === undefined || awayScore === null || Number.isNaN(Number(awayScore))) {
      return responseJson(400, { error: 'Missing or invalid homeScore or awayScore' }, event);
    }
    if (Number(homeScore) < 0 || Number(awayScore) < 0) {
      return responseJson(400, { error: 'Scores cannot be negative' }, event);
    }
    if (!Array.isArray(scorerLines)) {
      return responseJson(400, { error: 'scorerLines must be an array of strings' }, event);
    }
    if (
      rawScorersUnder !== undefined &&
      rawScorersUnder !== null &&
      rawScorersUnder !== 'home' &&
      rawScorersUnder !== 'away'
    ) {
      return responseJson(400, { error: 'scorersUnder must be "home" or "away"' }, event);
    }

    let scorersUnder = rawScorersUnder;
    if (scorersUnder !== 'home' && scorersUnder !== 'away') {
      const hn = String(homeTeam).toUpperCase();
      const an = String(awayTeam).toUpperCase();
      if (hn.includes('CASALPOGLIO') && !an.includes('CASALPOGLIO')) scorersUnder = 'home';
      else if (an.includes('CASALPOGLIO') && !hn.includes('CASALPOGLIO')) scorersUnder = 'away';
      else scorersUnder = 'home';
    }

    const region = process.env.AWS_REGION || 'eu-west-1';
    const assetBucket = process.env.ASSET_BUCKET;
    if (!assetBucket) {
      return responseJson(500, { error: 'ASSET_BUCKET env var is required' }, event);
    }

    const golBaseUrl = `https://${assetBucket}.s3.${region}.amazonaws.com/gol/gol`;
    const lineupBaseUrl = `https://${assetBucket}.s3.${region}.amazonaws.com/lineup`;

    const lines = scorerLines
      .map((l) => String(l).trim())
      .filter(Boolean)
      .slice(0, 40);

    const scorersItems = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('');
    const scorersBlock = `<div class="scorers-wrap"><div class="scorers-title">MARCATORI</div><ul class="scorers-list scorers-columns">${scorersItems}</ul></div>`;
    const scorersSlotHome = scorersUnder === 'home' ? scorersBlock : '';
    const scorersSlotAway = scorersUnder === 'away' ? scorersBlock : '';

    const sponsorRow = (base) => `
      <div class="sponsor"><img src="${base}/vega.png" alt="" /></div>
      <div class="sponsor"><img src="${base}/loooma.png" alt="" /></div>
      <div class="sponsor"><img src="${base}/mm.png" alt="" /></div>
      <div class="sponsor"><img src="${base}/onlight.png" alt="" /></div>
      <div class="sponsor"><img src="${base}/sens.png" alt="" /></div>
      <div class="sponsor"><img src="${base}/neotec.png" alt="" /></div>
      <div class="sponsor"><img src="${base}/rubes-w.png" alt="" /></div>
      <div class="sponsor"><img src="${base}/eurotir.png" alt="" /></div>
      <div class="sponsor"><img src="${base}/transfilm.png" alt="" /></div>
      <div class="sponsor"><img src="${base}/calzificio_leonardo.png" alt="" /></div>
      <div class="sponsor"><img src="${base}/delta_antinfortunistica.png" alt="" /></div>
      <div class="sponsor"><img src="${base}/lavanderia_moderna.png" alt="" /></div>`;

    const htmlTemplate = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Risultato finale — 9:16</title>
  <style>
    @font-face {
      font-family: 'Tusker';
      src: url('${golBaseUrl}/TuskerGrotesk-3500Medium.woff2') format('woff2'),
           url('${golBaseUrl}/TuskerGrotesk-3500Medium.woff') format('woff');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
      ascent-override: 110%;
    }
    @font-face {
      font-family: 'Founders';
      src: url('${golBaseUrl}/FoundersGrotesk-Regular.woff2') format('woff2'),
           url('${golBaseUrl}/FoundersGrotesk-Regular.woff') format('woff');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
      ascent-override: 110%;
    }
    html,body{
      color:white;
      font-weight:500;
      font-family: 'Tusker';
      width: 100vw;
      margin:0;
      background-color: black;
      display: flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
    }
    .card{
      width: 1440px;
      height:2560px;
      overflow:hidden;
      padding: 0 36px 200px;
      background-image: linear-gradient(to bottom, #00002d, #3b0649, #7e004f, #b8003a, #dd0000);
      position:relative;
      display:flex;
      flex-direction:column;
      box-sizing:border-box;
    }
    .logoback{
      position:absolute;
      z-index:8;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      pointer-events:none;
      overflow:hidden;
    }
    .logoback img{
      width:auto;
      height:auto;
      max-width:none;
      max-height:none;
      opacity:.14;
      object-fit:contain;
      flex-shrink:0;
    }
    .body{
      position:relative;
      z-index:30;
      flex:1;
      min-height:0;
      display:flex;
      flex-direction:column;
      align-items:stretch;
      padding-top: 250px;
    }
    .slot-fine{
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    .slot-gap-after-fine{
      height: 200px;
      flex-shrink: 0;
    }
    .slot-teams{
      min-height: 190px;
      height: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      flex-shrink: 0;
      padding: 4px 0;
    }
    .teams-inner{
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }
    .stack-score{
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: stretch;
    }
    .title-fine{
      font-family: 'Tusker', sans-serif;
      font-weight: 500;
      font-size: 310px;
      line-height: 0.86;
      text-align: center;
      margin: 0;
      padding: 0;
      letter-spacing: -8px;
      text-transform: uppercase;
      -webkit-font-smoothing:antialiased;
    }
    .teams-row{
      display:flex;
      flex-direction:row;
      justify-content:space-between;
      align-items:center;
      gap: 20px;
      padding: 0 4px;
    }
    .team-name{
      font-family: 'Founders';
      font-weight: 400;
      font-size: 80px;
      text-transform: uppercase;
      letter-spacing: -2px;
      line-height: 1.02;
      text-align: center;
      flex: 1;
      -webkit-font-smoothing:antialiased;
    }
    .score-panel{
      font-family: 'Founders';
      font-weight: 400;
      border-radius: 16px;
      background-color: rgba(0, 0, 0, .82);
      display: flex;
      flex-direction:row;
      align-items:center;
      justify-content:center;
      gap: 28px;
      padding: 52px 36px;
      line-height:1;
      -webkit-font-smoothing:antialiased;
    }
    .score-num{
      font-size: 200px;
      letter-spacing: -6px;
      min-width: 200px;
      text-align: center;
    }
    .score-sep{
      font-size: 120px;
      opacity: 0.85;
      font-weight: 400;
      padding-bottom: 12px;
    }
    .scorers-wrap{
      font-family: 'Founders';
      font-weight: 400;
      border-radius: 16px;
      background-color: rgba(0, 0, 0, .82);
      padding: 26px 36px 32px;
      -webkit-font-smoothing:antialiased;
    }
    .scorers-title{
      font-size: 40px;
      text-transform: uppercase;
      letter-spacing: 4px;
      text-align: center;
      margin-bottom: 18px;
      opacity: 0.95;
    }
    .scorers-list.scorers-columns{
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-rows: repeat(4, minmax(56px, auto));
      grid-auto-columns: minmax(0, 1fr);
      grid-auto-flow: column;
      gap: 12px 32px;
      min-height: 296px;
      align-items: center;
    }
    .scorers-list.scorers-columns li{
      font-size: 42px;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      text-align: center;
      line-height: 1.12;
    }
    .scorers-row{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: start;
      width: 100%;
    }
    .scorers-slot{
      min-width: 0;
      display: flex;
      justify-content: center;
    }
    .scorers-slot .scorers-wrap{
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    .scorers-slot .scorers-list.scorers-columns{
      gap: 10px 18px;
      min-height: 260px;
    }
    .slot-gap-before-sponsors{
      height: 200px;
      flex-shrink: 0;
    }
    .sponsors-grid{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      flex-shrink: 0;
    }
    .sponsors-grid .sponsor{
      grid-column: span 1 / span 1;
      aspect-ratio: 2/1;
      border-radius: 10px;
      background-color: rgba(0, 0, 0, .8);
      display: flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
    }
    .sponsors-grid .sponsor img{
      width: 60%;
      max-height: 70%;
      height: auto;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logoback">
      <img src="${golBaseUrl}/logo.png" alt="" />
    </div>
    <div class="body">
      <div class="slot-fine">
        <h1 class="title-fine">FINE</h1>
      </div>
      <div class="slot-gap-after-fine"></div>
      <div class="slot-teams">
        <div class="teams-inner">
          <div class="teams-row">
            <div class="team-name">${escapeHtml(String(homeTeam).toUpperCase())}</div>
            <div class="team-name">${escapeHtml(String(awayTeam).toUpperCase())}</div>
          </div>
        </div>
      </div>
      <div class="stack-score">
        <div class="score-panel">
          <span class="score-num">${escapeHtml(String(homeScore))}</span>
          <span class="score-sep">—</span>
          <span class="score-num">${escapeHtml(String(awayScore))}</span>
        </div>
        <div class="scorers-row">
          <div class="scorers-slot">${scorersSlotHome}</div>
          <div class="scorers-slot">${scorersSlotAway}</div>
        </div>
      </div>
      <div class="slot-gap-before-sponsors"></div>
      <div class="sponsors-grid">
        ${sponsorRow(lineupBaseUrl)}
      </div>
    </div>
  </div>
</body>
</html>`;

    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1440, height: 2560, deviceScaleFactor: 1 },
      executablePath,
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 2000));
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const images = document.querySelectorAll('img');
        let loaded = 0;
        const total = images.length;
        if (total === 0) {
          resolve();
          return;
        }
        images.forEach((img) => {
          if (img.complete && img.naturalHeight > 0) {
            loaded++;
            if (loaded === total) resolve();
          } else {
            img.addEventListener(
              'load',
              () => {
                loaded++;
                if (loaded === total) resolve();
              },
              { once: true }
            );
          }
        });
        setTimeout(resolve, 3000);
      });
    });
    await new Promise((r) => setTimeout(r, 1000));

    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1440, height: 2560 } });
    await browser.close();

    return responsePng(png, event);
  } catch (e) {
    console.error('final-result-image error:', e);
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
  const base64Image = Buffer.from(buffer).toString('base64');
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      ...getCorsHeaders(event),
    },
    body: base64Image,
    isBase64Encoded: true,
  };
}
