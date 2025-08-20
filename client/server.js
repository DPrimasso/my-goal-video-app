const express = require('express');
const path = require('path');
const fs = require('fs');
const { bundle } = require('@remotion/bundler');
const { getCompositions, renderMedia } = require('@remotion/renderer');
const cors = require('cors');

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
  const { homeTeam, awayTeam, score, casalpoglioScorers } = req.body || {};
  
  if (!homeTeam || !awayTeam || !score) {
    return res.status(400).json({ error: 'Missing match data' });
  }

  try {
    console.log('Starting final result video render...');

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
      
      // Default case
      console.log(`Default case: ${assetPath}`);
      return assetPath;
    };

    // Helper function to get a safe player image URL
    const getSafePlayerImage = (playerId) => {
      if (!playerId) return `${baseUrl}/players/default_player.png`;
      
      const player = players.find(p => p.id === playerId);
      if (!player || !player.image) return `${baseUrl}/players/default_player.png`;
      
      // Check if the image path is valid
      if (player.image.startsWith('players/') || player.image.startsWith('/players/')) {
        return `${baseUrl}/${player.image}`;
      }
      
      // If it's an S3 URL, use it as is
      if (player.image.startsWith('http://') || player.image.startsWith('https://')) {
        return player.image;
      }
      
      // Fallback to default
      return `${baseUrl}/players/default_player.png`;
    };

    // Get player names for the filename
    const playersModule = require('./players');
    
    // Check if we have the players array
    const players = playersModule.players || playersModule;
    
    const getPlayerName = (playerId) => {
      if (!Array.isArray(players)) {
        console.error('Players is not an array (final result):', players);
        return 'Unknown Player';
      }
      if (!playerId) {
        return 'Default Player';
      }
      const player = players.find(p => p.id === playerId);
      return player ? player.name : 'Unknown Player';
    };

    // Map team IDs to team info with proper logos
    const getTeamInfo = (teamId, isHomeTeam) => {
      const teamNames = {
        'casalpoglio': 'Casalpoglio',
        'amatori_club': 'Amatori Club',
        'team_3': 'Team 3',
        'team_4': 'Team 4'
      };
      
      const teamLogos = {
        'casalpoglio': 'logo_casalpoglio.png',
        'amatori_club': 'logo_amatori_club.png',
        'team_3': 'logo192.png',
        'team_4': 'logo192.png'
      };
      
      return {
        name: teamNames[teamId] || teamId,
        logo: teamLogos[teamId] || 'logo192.png'
      };
    };

    // Determine which team is which based on home/away
    const homeTeamInfo = getTeamInfo(homeTeam, true);
    const awayTeamInfo = getTeamInfo(awayTeam, false);
    
    // Determine which team is Casalpoglio and get their scorers
    const isCasalpoglioHome = homeTeam === 'casalpoglio';
    const isCasalpoglioAway = awayTeam === 'casalpoglio';
    
    // Get scorer names for Casalpoglio
    const casalpoglioScorerNames = casalpoglioScorers
      .map(scorerId => {
        if (!scorerId) return null;
        return getPlayerName(scorerId);
      })
      .filter(name => name !== null && name !== 'Default Player' && name !== 'Unknown Player');
    
    // Create input props with proper team positioning
    const inputProps = {
      teamA: homeTeamInfo,  // Team A is always home team
      teamB: awayTeamInfo,  // Team B is always away team
      scoreA: score.home,   // Score A is home score
      scoreB: score.away,   // Score B is away score
      scorers: casalpoglioScorerNames,
      baseUrl,
      // Add flags to help the video component position scorers correctly
      casalpoglioIsHome: isCasalpoglioHome,
      casalpoglioIsAway: isCasalpoglioAway,
    };
    
    // Get compositions
    const comps = await getCompositions(bundled, { inputProps });
    const comp = comps.find(c => c.id === 'FinalResultComp');
    if (!comp) {
      throw new Error('Composition FinalResultComp not found');
    }

    // Prepare output filename
    const homeTeamName = homeTeamInfo.name.replace(/\s+/g, '_');
    const awayTeamName = awayTeamInfo.name.replace(/\s+/g, '_');
    const matchResult = `${score.home}-${score.away}`;
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
  console.log(`   • POST http://localhost:${PORT}/api/formation-render (Formation video)`);
  console.log(`   • POST http://localhost:${PORT}/api/final-result-render (Final result video)`);
  console.log(`   • GET  http://localhost:${PORT}/api/render-status/:renderId (Render status)`);
});
