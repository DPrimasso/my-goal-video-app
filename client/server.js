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
  console.log(`   • GET  http://localhost:${PORT}/api/render-status/:renderId (Render status)`);
});
