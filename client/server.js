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
    console.log('Starting video render...');

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
      s3PlayerUrl: getAssetUrl(s3PlayerUrl) || `${baseUrl}/players/davide_fava.png`,
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

    console.log('Rendering video...');
    
    // Render the video (exactly like the working server)
    await renderMedia({
      composition: comp,
      serveUrl: bundled, // Per sviluppo locale usa bundled, per Lambda usa la serveUrl del sito
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
    });

    const videoUrl = `http://localhost:4000/videos/${outputFilename}`;
    console.log(`Video rendered successfully: ${videoUrl}`);
    
    res.json({ 
      video: videoUrl,
      filename: outputFilename,
      path: outputPath
    });
  } catch (err) {
    console.error('Error rendering video:', err);
    res.status(500).json({ error: 'Failed to render video', details: err.message });
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
  console.log(`📋 API endpoint: http://localhost:${PORT}/api/render`);
});
