const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    const payload = event && event.body ? JSON.parse(event.body) : {};
    const { players, opponentTeam } = payload;

    if (!players || !Array.isArray(players) || players.length !== 11) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing or invalid players data. Expected exactly 11 players.' })
      };
    }

    if (!opponentTeam || !opponentTeam.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing opponent team name' })
      };
    }

    const REGION = process.env.AWS_REGION || 'eu-west-1';
    const ASSET_BUCKET = process.env.ASSET_BUCKET;
    
    if (!ASSET_BUCKET) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ASSET_BUCKET environment variable not set' })
      };
    }

    const baseUrl = `https://${ASSET_BUCKET}.s3.${REGION}.amazonaws.com`;

    console.log('Starting lineup image generation...');

    // Build HTML template
    const playerRows = players.map(player => {
      const captainIcon = player.isCaptain 
        ? `<img class="cap" src="${baseUrl}/lineup/cap.png" />` 
        : '';
      return `
        <div class="row">
          <div class="num">${player.number}</div>
          <div class="name">${player.playerName.toUpperCase()} ${captainIcon}</div>
        </div>
      `;
    }).join('');

    const htmlTemplate = `
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Starting XI</title>
  <style>
    @font-face {
      font-family: 'Tusker';
      src: url('${baseUrl}/lineup/TuskerGrotesk-3500Medium.woff2') format('woff2'),
           url('${baseUrl}/lineup/TuskerGrotesk-3500Medium.woff') format('woff');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
      ascent-override: 110%;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html,body{
      color:white;
      font-weight:500;
      font-family: 'Tusker', sans-serif;
      width: 1080px;
      height: 2000px;
      margin:0;
      padding:0;
      background-color: black;
      overflow: hidden;
      position: absolute;
      top: 0;
      left: 0;
    }
    .card{
      width: 1080px;
      height:2000px;
      overflow:visible;
      padding:55px 28px 60px;
      background-image: url('${baseUrl}/lineup/bg.jpg');
      background-size:cover;
      background-repeat: no-repeat;
      background-position:center;
      position:absolute;
      top: 0;
      left: 0;
      display:flex;
      gap:6px;
      flex-direction:column;
      margin:0;
      box-sizing: border-box;
    }
    .bgimg{
      position: absolute;
      inset:0;
      width: 100%;
      height:100%;
      opacity: .2;
    }
    .bgimg img{
      width: 100%;
      height:100%;
      object-position: center;
      object-fit: cover;
    }
    .card .element{
      position: relative;
      z-index:50;
      border-radius: 10px;
      background-color: rgba(0, 0, 0, .8);
      padding: 45px;
    }
    .card .element h1{
      font-size:160px;
      margin:0;
      line-height:1;
    }
    .card .element p{
      font-size:54px;
      display:block;
      text-transform: uppercase;
      margin:0;
      margin-top:14px;
      line-height:1;
    }
    .card .element.flexmore {
      flex:1;
    }
    .card .grid{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
      position: relative;
      z-index:50;
    }
    .card .grid .sponsor{
      grid-column: span 1 / span 1;
      aspect-ratio: 2/1;
      border-radius: 10px;
      background-color: rgba(0, 0, 0, .8);
      display: flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
    }
    .card .grid .sponsor:nth-child(9){
      grid-column: 1 / 2;
      grid-row: 3;
    }
    .card .grid .sponsor img{
      width: 60%;
    }
    .card .list{
      display: flex;
      width: 100%;
      flex-direction: column;
      gap:6px;
      justify-content:space-between;
      height:100%;
    }
    .card .list .row{
      display: grid;
      line-height:1;
      grid-template-columns: repeat(10, minmax(0, 1fr));
      font-size:72px;
    }
    .num{
      grid-column: span 1 / span 1;
      color: #DD0000;
    }
    .name{
      grid-column: span 7 / span 7;
      display: flex;
      align-items:center;
      gap:16px;
    }
    .name img.cap{
      aspect-ratio: 1;
      width: 54px;
    }
    .logoimg{
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 45%;
      opacity: .1;
      overflow: hidden;
      clip-path: inset(0 0 50% 0);
    }
    .logoimg img{
      width: 100%;
      height: auto;
      display: block;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="bgimg">
      <img src="${baseUrl}/lineup/group.png" />
    </div>
    <div class="element">
      <h1>STARTING XI</h1>
      <p>Vs ${opponentTeam.toUpperCase()}</p>
    </div>
    <div class="element flexmore">
      <div class="list">
        ${playerRows}
      </div>
      <div class="logoimg">
        <img src="${baseUrl}/lineup/logo.png" />
      </div>
    </div>
    <div class="grid">
      <div class="sponsor"><img src="${baseUrl}/lineup/vega.png" /></div>
      <div class="sponsor"><img src="${baseUrl}/lineup/loooma.png" /></div>
      <div class="sponsor"><img src="${baseUrl}/lineup/mm.png" /></div>
      <div class="sponsor"><img src="${baseUrl}/lineup/onlight.png" /></div>
      <div class="sponsor"><img src="${baseUrl}/lineup/sens.png" /></div>
      <div class="sponsor"><img src="${baseUrl}/lineup/neotec.png" /></div>
      <div class="sponsor"><img src="${baseUrl}/lineup/rubes-w.png" /></div>
      <div class="sponsor"><img src="${baseUrl}/lineup/eurotir.png" /></div>
      <div class="sponsor"><img src="${baseUrl}/lineup/transfilm.png" /></div>
    </div>
  </div>
</body>
</html>
    `;

    // Launch Puppeteer with Chromium for Lambda
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Set viewport to match the card dimensions + extra space at bottom
    await page.setViewport({
      width: 1080,
      height: 2000,
      deviceScaleFactor: 1,
    });

    // Set content
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Ensure body and html start at 0,0 with no offsets
    await page.evaluate(() => {
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      const card = document.querySelector('.card');
      if (card) {
        const rect = card.getBoundingClientRect();
        if (rect.top > 0) {
          card.style.marginTop = `-${rect.top}px`;
        }
      }
    });

    // Capture screenshot (1080x2000 with extra space at bottom)
    const screenshot = await page.screenshot({
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1080,
        height: 2000,
      },
    });

    await browser.close();

    // Upload to S3
    const outputKey = `lineup/${Date.now()}-lineup.png`;
    
    await s3.putObject({
      Bucket: ASSET_BUCKET,
      Key: outputKey,
      Body: screenshot,
      ContentType: 'image/png',
      ACL: 'public-read',
    }).promise();

    const imageUrl = `https://${ASSET_BUCKET}.s3.${REGION}.amazonaws.com/${outputKey}`;

    console.log('Lineup image generated successfully:', imageUrl);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        imageUrl,
        key: outputKey,
      }),
    };
  } catch (err) {
    console.error('Error generating lineup image:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate lineup image',
        details: err.message,
        stack: err.stack,
      }),
    };
  }
};

