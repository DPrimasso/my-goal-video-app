const express = require('express');
const path = require('path');
const fs = require('fs');
const { bundle } = require('@remotion/bundler');
const { getCompositions, renderMedia } = require('@remotion/renderer');
const cors = require('cors');
const puppeteer = require('puppeteer');

// Create videos directory
const VIDEOS_DIR = path.join(__dirname, 'public', 'generated');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use('/videos', express.static(VIDEOS_DIR));

// Serve static files from React app public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for video generation (replicates the working server)
app.post('/api/render', async (req, res) => {
  const { playerName, minuteGoal, goalClip, overlayImage, s3PlayerUrl, partialScore } = req.body || {};
  
  if (!playerName || !minuteGoal) {
    return res.status(400).json({ error: 'Missing playerName or minuteGoal' });
  }

  try {
    console.log('Starting goal video render...');

    // Bundle the Remotion project (exactly like the working server)
    const entry = path.join(__dirname, 'src', 'remotion', 'index.tsx');
    const bundled = await bundle({
      entryPoint: entry,
    });

        // Prepare input props (exactly like the working server)
    // Handle asset paths correctly - local assets vs S3 URLs
    const baseUrl = 'http://localhost:4000';
    
    // Helper function to determine if a path is a local asset or S3 URL
    const getAssetUrl = (assetPath) => {
      if (!assetPath) return '';
      
      // If it's already a full URL (S3), use it as is
      if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
        console.log(`S3 URL detected: ${assetPath}`);
        return assetPath;
      }
      
      // If it's a local asset, prepend localhost:4000
      if (assetPath.startsWith('players/') || assetPath.startsWith('/players/') || assetPath.startsWith('clips/') || assetPath.startsWith('logo')) {
        const localUrl = `${baseUrl}/${assetPath}`;
        console.log(`Local asset: ${assetPath} -> ${localUrl}`);
        return localUrl;
      }
      
      // Default case
      console.log(`Default case: ${assetPath}`);
      return assetPath;
    };
    
    const inputProps = {
      playerName,
      minuteGoal: String(minuteGoal),
      goalClip: getAssetUrl(goalClip) || `${baseUrl}/clips/goal.mp4`,
      overlayImage: getAssetUrl(overlayImage) || `${baseUrl}/logo_casalpoglio.png`,
      s3PlayerUrl: getAssetUrl(s3PlayerUrl) || `${baseUrl}/players/default_player.png`,
      partialScore: partialScore || '',
      textColor: 'white',
      titleSize: 80,
      playerSize: 110,
      textShadow: '0 0 10px black',
    };
    
    // Get compositions (exactly like the working server)
    const comps = await getCompositions(bundled, { inputProps });
    const comp = comps.find(c => c.id === 'GoalComp');
    if (!comp) {
      throw new Error('Composition GoalComp not found');
    }

    // Prepare output filename (same format as working server)
    const outputFilename = `${Date.now()}-${playerName.replace(/\s+/g, '_')}.mp4`;
    const outputPath = path.join(VIDEOS_DIR, outputFilename);

    console.log('Rendering goal video...');
    
    // Render the video (exactly like the working server)
    await renderMedia({
      composition: comp,
      serveUrl: bundled, // Per sviluppo locale usa bundled, per Lambda usa la serveUrl del sito
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
    });

    const videoUrl = `http://localhost:4000/videos/${outputFilename}`;
    console.log(`Goal video rendered successfully: ${videoUrl}`);
    
    res.json({ 
      video: videoUrl,
      filename: outputFilename,
      path: outputPath
    });
  } catch (err) {
    console.error('Error rendering goal video:', err);
    res.status(500).json({ error: 'Failed to render goal video', details: err.message });
  }
});

// API endpoint for formation video generation
app.post('/api/formation-render', async (req, res) => {
  const { goalkeeper, defenders, midfielders, attackingMidfielders, forwards } = req.body || {};
  
  if (!goalkeeper || !defenders || !midfielders || !attackingMidfielders || !forwards) {
    return res.status(400).json({ error: 'Missing formation data' });
  }

  try {
    console.log('Starting formation video render...');

    // Bundle the Remotion project
    const entry = path.join(__dirname, 'src', 'remotion', 'index.tsx');
    const bundled = await bundle({
      entryPoint: entry,
    });

    // Handle asset paths correctly - local assets vs S3 URLs
    const baseUrl = 'http://localhost:4000';
    
    // Helper function to determine if a path is a local asset or S3 URL
    const getAssetUrl = (assetPath) => {
      if (!assetPath) return '';
      
      // If it's already a full URL (S3), use it as is
      if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
        console.log(`S3 URL detected: ${assetPath}`);
        return assetPath;
      }
      
      // If it's a local asset, prepend localhost:4000
      if (assetPath.startsWith('players/') || assetPath.startsWith('/players/') || assetPath.startsWith('clips/') || assetPath.startsWith('logo')) {
        const localUrl = `${baseUrl}/${assetPath}`;
        console.log(`Local asset: ${assetPath} -> ${localUrl}`);
        return localUrl;
      }
      
      // For other assets, assume they're local
      const localUrl = `${baseUrl}/${assetPath}`;
      console.log(`Other asset: ${assetPath} -> ${localUrl}`);
      return localUrl;
    };

    // Helper function to get goalkeeper name for display
    const getGoalkeeperName = (goalkeeper) => {
      if (!goalkeeper || !goalkeeper.name) {
        return 'Default Player';
      }
      return goalkeeper.name;
    };

    // Helper function to process FormationPlayer objects
    const processFormationPlayer = (player) => {
      if (!player || !player.name || !player.image) {
        return null; // Return null instead of undefined to maintain array structure
      }
      
      // Use getSafePlayerImage to handle missing or invalid images
      const safeImageUrl = getAssetUrl(player.image);
      const imagePath = safeImageUrl.replace(baseUrl + '/', ''); // Remove baseUrl for the component
      
      return {
        name: player.name,
        image: imagePath
      };
    };

    const goalkeeperName = getGoalkeeperName(goalkeeper);
    
    const inputProps = {
      goalkeeper: processFormationPlayer(goalkeeper),
      defenders: defenders.map(processFormationPlayer),
      midfielders: midfielders.map(processFormationPlayer),
      attackingMidfielders: attackingMidfielders.map(processFormationPlayer),
      forwards: forwards.map(processFormationPlayer),
      goalkeeperName,
      baseUrl,
    };

    // Get compositions
    const comps = await getCompositions(bundled, { inputProps });
    const comp = comps.find(c => c.id === 'FormationComp');
    if (!comp) {
      throw new Error('Composition FormationComp not found');
    }

    // Prepare output filename
    const outputFilename = `StartingLineUp_${Date.now()}.mp4`;
    const outputPath = path.join(VIDEOS_DIR, outputFilename);

    console.log('Rendering formation video...');
    
    // Render the video
    await renderMedia({
      composition: comp,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
    });

    const videoUrl = `http://localhost:4000/videos/${outputFilename}`;
    console.log(`Formation video rendered successfully: ${videoUrl}`);
    
    res.json({ 
      video: videoUrl,
      filename: outputFilename,
      path: outputPath
    });
  } catch (err) {
    console.error('Error rendering formation video:', err);
    res.status(500).json({ error: 'Failed to render formation video', details: err.message });
  }
});

// API endpoint for final result video generation
app.post('/api/final-result-render', async (req, res) => {
  console.log('🎯 Received final result request body:', JSON.stringify(req.body, null, 2));
  
  // Data is now pre-formatted from the frontend
  const { teamA, teamB, scoreA, scoreB, scorers, casalpoglioIsHome, casalpoglioIsAway, teamALogoPath, teamBLogoPath } = req.body || {};
  
  console.log('🎯 Parsed request data:');
  console.log('  teamA:', teamA);
  console.log('  teamB:', teamB);
  console.log('  scoreA:', scoreA);
  console.log('  scoreB:', scoreB);
  console.log('  scorers:', scorers);
  
  if (!teamA || !teamB || scoreA === undefined || scoreB === undefined) {
    console.log('❌ Missing required data');
    return res.status(400).json({ error: 'Missing match data' });
  }

  try {
    console.log('Starting final result video render...');

    // Bundle the Remotion project
    const entry = path.join(__dirname, 'src', 'remotion', 'index.tsx');
    const bundled = await bundle({
      entryPoint: entry,
    });

    // Data is already formatted from the frontend, no asset URL handling needed

    // Data is already formatted from the frontend, just use it directly
    const inputProps = {
      teamA,
      teamB,
      scoreA,
      scoreB,
      scorers,
      casalpoglioIsHome,
      casalpoglioIsAway,
      teamALogoPath,
      teamBLogoPath,
    };
    
    // Debug logging for input props
    console.log('🎯 Final Result Video Input Props:');
    console.log('  teamA:', JSON.stringify(inputProps.teamA, null, 2));
    console.log('  teamB:', JSON.stringify(inputProps.teamB, null, 2));
    console.log('  scoreA:', inputProps.scoreA);
    console.log('  scoreB:', inputProps.scoreB);
    console.log('  scorers:', inputProps.scorers);
    console.log('  casalpoglioIsHome:', inputProps.casalpoglioIsHome);
    console.log('  casalpoglioIsAway:', inputProps.casalpoglioIsAway);
    console.log('  teamALogoPath:', inputProps.teamALogoPath);
    console.log('  teamBLogoPath:', inputProps.teamBLogoPath);
    
    // Get compositions
    const comps = await getCompositions(bundled, { inputProps });
    const comp = comps.find(c => c.id === 'FinalResultComp');
    if (!comp) {
      throw new Error('Composition FinalResultComp not found');
    }

    // Prepare output filename
    const homeTeamName = teamA.name.replace(/\s+/g, '_');
    const awayTeamName = teamB.name.replace(/\s+/g, '_');
    const matchResult = `${scoreA}-${scoreB}`;
    const outputFilename = `${Date.now()}-${homeTeamName}_vs_${awayTeamName}_${matchResult}.mp4`;
    const outputPath = path.join(VIDEOS_DIR, outputFilename);

    console.log('Rendering final result video...');
    
    // Render the video
    await renderMedia({
      composition: comp,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
    });

    const videoUrl = `http://localhost:4000/videos/${outputFilename}`;
    console.log(`Final result video rendered successfully: ${videoUrl}`);
    
    res.json({ 
      video: videoUrl,
      filename: outputFilename,
      path: outputPath
    });
  } catch (err) {
    console.error('Error rendering final result video:', err);
    res.status(500).json({ error: 'Failed to render final result video', details: err.message });
  }
});

// API endpoint for lineup image generation
app.post('/api/lineup-generate', async (req, res) => {
  const { players, opponentTeam } = req.body || {};
  
  if (!players || !Array.isArray(players) || players.length !== 11) {
    return res.status(400).json({ error: 'Missing or invalid players data. Expected exactly 11 players.' });
  }

  if (!opponentTeam || !opponentTeam.trim()) {
    return res.status(400).json({ error: 'Missing opponent team name' });
  }

  try {
    console.log('Starting lineup image generation...');
    
    const baseUrl = 'http://localhost:4000';
    
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
      padding:80px 40px;
      padding-bottom: 160px;
      background-image: url('${baseUrl}/lineup/bg.jpg');
      background-size:cover;
      background-repeat: no-repeat;
      background-position:center;
      position:absolute;
      top: 0;
      left: 0;
      display:flex;
      gap:10px;
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
      padding: 80px;
    }
    .card .element h1{
      font-size:180px;
      margin:0;
      line-height:1;
    }
    .card .element p{
      font-size:60px;
      display:block;
      text-transform: uppercase;
      margin:0;
      margin-top:24px;
      line-height:1;
    }
    .card .element.flexmore {
      flex:1;
    }
    .card .grid{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
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
    .card .grid .sponsor img{
      width: 60%;
    }
    .card .list{
      display: flex;
      width: 100%;
      flex-direction: column;
      gap:10px;
      justify-content:space-between;
      height:100%;
    }
    .card .list .row{
      display: grid;
      line-height:1;
      grid-template-columns: repeat(10, minmax(0, 1fr));
      font-size:80px;
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
      bottom:30px;
      right:40px;
      max-width: 45%;
      height: auto;
      opacity: .1;
      overflow:hidden
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
    </div>
  </div>
</body>
</html>
    `;

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
        // If card is not at top, adjust
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

    // Send image as response
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="lineup.png"');
    res.send(screenshot);

    console.log('Lineup image generated successfully');
  } catch (err) {
    console.error('Error generating lineup image:', err);
    res.status(500).json({ error: 'Failed to generate lineup image', details: err.message });
  }
});

// API endpoint for goal image generation
app.post('/api/goal-generate', async (req, res) => {
  const { minuteGoal, playerName, playerImageUrl, homeTeam, homeScore, awayTeam, awayScore } = req.body || {};
  
  if (!minuteGoal || !playerName) {
    return res.status(400).json({ error: 'Missing minuteGoal or playerName' });
  }

  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: 'Missing homeTeam or awayTeam' });
  }

  if (homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ error: 'Missing homeScore or awayScore' });
  }

  try {
    console.log('Starting goal image generation...');
    console.log('playerImageUrl received:', playerImageUrl);
    
    const baseUrl = 'http://localhost:4000';
    
    // Convert playerImageUrl to absolute URL if it's a relative path
    let absolutePlayerImageUrl = playerImageUrl;
    if (playerImageUrl && !playerImageUrl.startsWith('http://') && !playerImageUrl.startsWith('https://')) {
      // If it starts with /, it's already a path, otherwise add /
      const imagePath = playerImageUrl.startsWith('/') ? playerImageUrl : '/' + playerImageUrl;
      absolutePlayerImageUrl = baseUrl + imagePath;
      console.log('Converted imagePath:', imagePath);
      console.log('Absolute URL:', absolutePlayerImageUrl);
    } else {
      console.log('Using original URL (already absolute):', absolutePlayerImageUrl);
    }
    
    // Build HTML template based on demo.html - exact structure with converted CSS
    const htmlTemplate = `
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Goal — 9:16</title>
  <style>
    :root{
      --bg1:#1b0b3a;
      --bg2:#7a0014;
      --panel:#0f0b2a;
      --accent:#e12121;
      --white: #ffffff;
      --muted: rgb(255,255,255);
    }
    @font-face {
      font-family: 'Tusker';
      src: url('${baseUrl}/gol/gol/TuskerGrotesk-3500Medium.woff2') format('woff2'),
           url('${baseUrl}/gol/gol/TuskerGrotesk-3500Medium.woff') format('woff');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
      ascent-override: 110%;
    }
    @font-face {
      font-family: 'Founders';
      src: url('${baseUrl}/gol/gol/FoundersGrotesk-Regular.woff2') format('woff2'),
           url('${baseUrl}/gol/gol/FoundersGrotesk-Regular.woff') format('woff');
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
      padding:80px 40px;
      background-image: linear-gradient(to bottom, #00002d, #3b0649, #7e004f, #b8003a, #dd0000);
      position:relative;
      display:flex;
      justify-content:space-between;
      gap:10px;
      flex-direction:column;
    }
    .main-text{
      width:100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .main-text svg{
      width:90%;
    }
    .logoback{
      position:absolute;
      z-index:10;
      top: 50%;
      width:200%;
      transform: rotate(-45deg) translateY(-75%);
      transform-origin:center;
    }
    .logoback img{
      width:100%;
      opacity:.1;
    }
    .player{
      position:absolute;
      z-index:20;
      bottom: -4px;
      left:0;
      width:100%;
      height:80%;
    }
    .player img{
      width:100%;
      object-fit: contain;
      object-position: bottom;
    }
    .card .grid{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      position: absolute;
      bottom: 220px;
      left: 100px;
      right: 100px;
      z-index:50;
    }
    .card .grid .result{
      grid-column: span 2 / span 2;
      font-family: 'Founders';
      font-weight:400;
      border-radius: 10px;
      background-color: rgba(0, 0, 0, .8);
      display: flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      font-size:160px;
      text-transform:uppercase;
      padding:40px 24px;
      line-height:1;
      gap:12px;
    }
    .card .grid .result .squ{
      font-family: 'Founders';
      font-weight:400;
      font-size:54px;
      text-transform:uppercase;
    }
    .card .grid .gol{
      padding:24px 24px;
      grid-column: span 4 / span 4;
      border-radius: 10px;
      background-color: rgba(0, 0, 0, .8);
      display: flex;
      font-family: 'Founders';
      font-weight:400;
      flex-direction:row;
      align-items:center;
      justify-content:center;
      gap:12px;
      font-size:86px;
      text-transform:uppercase;
      line-height:1;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logoback">
      <img src="${baseUrl}/gol/gol/logo.png" class=""/>
    </div>
    <div class="main-text">
      <svg viewBox="0 0 980 678" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M91.8406 644.597C84.7212 666.866 70.4823 678 49.124 678C33.9359 677.526 21.8329 671.841 12.815 660.943C4.27165 649.572 0 633.463 0 612.616V72.4906C0 49.2746 6.17017 31.5074 18.5105 19.1887C30.8508 6.39623 48.8867 0 72.6181 0C119.606 0 143.1 22.2684 143.1 66.8051V285.698H89.7048V68.2264C89.7048 54.0126 83.7719 46.9057 71.9062 46.9057C60.0405 46.9057 54.1076 54.0126 54.1076 68.2264V609.774C54.1076 623.987 60.0405 631.094 71.9062 631.094C77.1271 631.094 81.3988 629.199 84.7212 625.409C88.0436 621.145 89.7048 615.933 89.7048 609.774V366.006H70.4823V319.101H142.389V674.447H104.656L95.4003 644.597H91.8406Z" fill="white"/>
        <path d="M173.814 72.4906C173.814 24.1635 197.783 0 245.72 0C293.658 0 317.626 24.1635 317.626 72.4906V604.088C317.626 627.778 311.456 646.019 299.116 658.811C286.776 671.604 268.977 678 245.72 678C222.464 678 204.665 671.604 192.325 658.811C179.984 646.019 173.814 627.778 173.814 604.088V72.4906ZM263.519 609.063V68.2264C263.519 54.0126 257.586 46.9057 245.72 46.9057C233.855 46.9057 227.922 54.0126 227.922 68.2264V609.063C227.922 623.75 233.855 631.094 245.72 631.094C250.941 631.094 255.213 629.199 258.535 625.409C261.858 621.145 263.519 615.696 263.519 609.063Z" fill="white"/>
        <path d="M349.019 72.4906C349.019 24.1635 372.987 0 420.925 0C468.862 0 492.831 24.1635 492.831 72.4906V604.088C492.831 627.778 486.661 646.019 474.321 658.811C461.98 671.604 444.182 678 420.925 678C397.668 678 379.87 671.604 367.529 658.811C355.189 646.019 349.019 627.778 349.019 604.088V72.4906ZM438.723 609.063V68.2264C438.723 54.0126 432.791 46.9057 420.925 46.9057C409.059 46.9057 403.126 54.0126 403.126 68.2264V609.063C403.126 623.75 409.059 631.094 420.925 631.094C426.146 631.094 430.417 629.199 433.74 625.409C437.062 621.145 438.723 615.696 438.723 609.063Z" fill="white"/>
        <path d="M524.223 72.4906C524.223 24.1635 548.192 0 596.13 0C644.067 0 668.036 24.1635 668.036 72.4906V604.088C668.036 627.778 661.866 646.019 649.525 658.811C637.185 671.604 619.386 678 596.13 678C572.873 678 555.074 671.604 542.734 658.811C530.393 646.019 524.223 627.778 524.223 604.088V72.4906ZM613.928 609.063V68.2264C613.928 54.0126 607.995 46.9057 596.13 46.9057C584.264 46.9057 578.331 54.0126 578.331 68.2264V609.063C578.331 623.75 584.264 631.094 596.13 631.094C601.35 631.094 605.622 629.199 608.944 625.409C612.267 621.145 613.928 615.696 613.928 609.063Z" fill="white"/>
        <path d="M699.428 72.4906C699.428 24.1635 723.397 0 771.334 0C819.272 0 843.24 24.1635 843.24 72.4906V604.088C843.24 627.778 837.07 646.019 824.73 658.811C812.39 671.604 794.591 678 771.334 678C748.077 678 730.279 671.604 717.938 658.811C705.598 646.019 699.428 627.778 699.428 604.088V72.4906ZM789.133 609.063V68.2264C789.133 54.0126 783.2 46.9057 771.334 46.9057C759.468 46.9057 753.536 54.0126 753.536 68.2264V609.063C753.536 623.75 759.468 631.094 771.334 631.094C776.555 631.094 780.827 629.199 784.149 625.409C787.471 621.145 789.133 615.696 789.133 609.063Z" fill="white"/>
        <path d="M929.452 626.83H980V674.447H876.768V2.84277H929.452V626.83Z" fill="white"/>
      </svg>
    </div>
    <div class="player">
      <img src="${absolutePlayerImageUrl || baseUrl + '/gol/gol/cc.png'}" class=""/>
    </div>
    
    <div class="grid">
      <div class="result">
        <span class="squ">${homeTeam}</span>
        <span>${homeScore}</span>
      </div>
      <div class="result">
        <span class="squ">${awayTeam}</span>
        <span>${awayScore}</span>
      </div>
      <div class="gol">
        <span>${minuteGoal}'</span>
        <span>${playerName}</span>
      </div>
    </div>
    
  </div>
</body>
</html>
    `;

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // Set viewport to match the card dimensions (1440x2560 for 9:16)
    await page.setViewport({
      width: 1440,
      height: 2560,
      deviceScaleFactor: 1,
    });

    // Set content
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

    // Wait for fonts and images to load - increased wait time for fonts
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Wait for fonts to be loaded
    await page.evaluate(() => {
      return document.fonts.ready;
    });

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

    // Capture screenshot (1440x2560)
    const screenshot = await page.screenshot({
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1440,
        height: 2560,
      },
    });

    await browser.close();

    // Send image as response
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="goal.png"');
    res.send(screenshot);

    console.log('Goal image generated successfully');
  } catch (err) {
    console.error('Error generating goal image:', err);
    res.status(500).json({ error: 'Failed to generate goal image', details: err.message });
  }
});

// API endpoint for render status (for polling)
app.get('/api/render-status/:renderId', (req, res) => {
  const { renderId } = req.params;
  
  // For now, return a simple status
  // In a real implementation, you'd track render progress
  res.json({
    overallProgress: 1,
    outputFile: `videos/${renderId}.mp4`,
    outKey: `${renderId}.mp4`,
    outBucket: 'local',
  });
});

const PORT = process.env.PORT_SERVER || 4000;
app.listen(PORT, () => {
  console.log(`🎬 Local video server listening on port ${PORT}`);
  console.log(`📁 Videos will be saved to: ${VIDEOS_DIR}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🔗 React app should be running on: http://localhost:3000`);
  console.log(`📋 Available API endpoints:`);
  console.log(`   • POST http://localhost:${PORT}/api/render (Goal video)`);
  console.log(`   • POST http://localhost:${PORT}/api/formation-render (Formation video - archived)`);
  console.log(`   • POST http://localhost:${PORT}/api/final-result-render (Final result video)`);
  console.log(`   • POST http://localhost:${PORT}/api/lineup-generate (Lineup image)`);
  console.log(`   • POST http://localhost:${PORT}/api/goal-generate (Goal image)`);
  console.log(`   • GET  http://localhost:${PORT}/api/render-status/:renderId (Render status)`);
});
