const express = require('express');
const path = require('path');
const fs = require('fs');
const { renderMedia, getCompositions } = require('@remotion/renderer');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Serve videos directory
const VIDEOS_DIR = path.join(__dirname, 'videos');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// API endpoint for video rendering
app.post('/api/render', async (req, res) => {
  try {
    const { playerName, minuteGoal, goalClip, overlayImage, s3PlayerUrl, partialScore } = req.body;
    
    if (!playerName || !minuteGoal) {
      return res.status(400).json({ error: 'Missing required fields: playerName, minuteGoal' });
    }

    console.log('Received render request:', { playerName, minuteGoal, goalClip, overlayImage, s3PlayerUrl, partialScore });

    // Use the correct serveUrl for the Remotion site
    const serveUrl = 'https://remotionlambda-euwest1-sbow9mlo73.s3.eu-west-1.amazonaws.com/sites/remotion-site/index.html';
    
    // Prepare input props - use staticFile paths directly since we're using the site serveUrl
    const inputProps = {
      playerName,
      minuteGoal: String(minuteGoal),
      goalClip: goalClip || 'clips/goal.mp4', // Use staticFile path directly
      overlayImage: overlayImage || 'logo_casalpoglio.png', // Use staticFile path directly
      s3PlayerUrl: s3PlayerUrl || '', // Keep S3 URL if provided
      partialScore: partialScore || '',
      textColor: 'white',
      titleSize: 80,
      playerSize: 110,
      textShadow: '0 0 10px black',
    };
    
    console.log('Using serveUrl:', serveUrl);
    console.log('Input props:', inputProps);
    
    // Get compositions from the site
    const comps = await getCompositions(serveUrl, { inputProps });
    const comp = comps.find(c => c.id === 'GoalComp');
    if (!comp) {
      throw new Error('Composition GoalComp not found');
    }

    // Prepare output filename
    const outputFilename = `${Date.now()}-${playerName.replace(/\s+/g, '_')}.mp4`;
    const outputPath = path.join(VIDEOS_DIR, outputFilename);

    console.log('Rendering video...');
    
    // Render the video using the site serveUrl
    await renderMedia({
      composition: comp,
      serveUrl: serveUrl,
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
  
  res.json({
    overallProgress: 1,
    outputFile: `videos/${renderId}.mp4`,
    outKey: `${renderId}.mp4`,
    outBucket: 'local',
  });
});

const PORT = process.env.PORT_SERVER || 4001;
app.listen(PORT, () => {
  console.log(`🎬 Lambda-compatible video server listening on port ${PORT}`);
  console.log(`📁 Videos will be saved to: ${VIDEOS_DIR}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🔗 React app should be running on: http://localhost:3000`);
  console.log(`📋 API endpoint: http://localhost:${PORT}/api/render`);
  console.log(`🚀 Using Remotion site: https://remotionlambda-euwest1-sbow9mlo73.s3.eu-west-1.amazonaws.com/sites/remotion-site/index.html`);
});
