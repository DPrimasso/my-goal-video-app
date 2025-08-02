const express = require('express');
const path = require('path');
const fs = require('fs');
const {bundle} = require('@remotion/bundler');
const {getCompositions, renderMedia} = require('@remotion/renderer');

const VIDEOS_DIR = path.join(__dirname, '..', 'videos');
const GOAL_CLIP = path.join(
  __dirname,
  '..',
  'public',
  'clips',
  'goal.mp4'
);
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR);
}
const app = express();
app.use(express.json());
const PORT = 4000;

// Serve generated videos so that Remotion can access them through an HTTP URL
// during the rendering phase.
app.use('/videos', express.static(VIDEOS_DIR));

app.post('/api/render', async (req, res) => {
  const {
    playerName,
    overlayImage,
    minuteGoal,
  } = req.body || {};
  if (!playerName || !minuteGoal) {
    return res
      .status(400)
      .json({error: 'Missing playerName or minuteGoal'});
  }

  try {
    // Bundle the Remotion project
    const entry = path.join(__dirname, '..', 'src', 'remotion', 'index.tsx');
    const bundled = await bundle(entry);

    // Select composition
    const inputProps = {playerName, minuteGoal, goalClip: GOAL_CLIP};
    if (overlayImage) {
      inputProps.overlayImage = overlayImage;
    }
    const comps = await getCompositions(bundled, {
      inputProps,
    });
    const comp = comps.find(c => c.id === 'GoalComp');
    if (!comp) {
      throw new Error('Composition GoalComp not found');
    }

    const outPath = path.join(
      VIDEOS_DIR,
      `${Date.now()}-${playerName.replace(/\s+/g, '_')}.mp4`
    );

    await renderMedia({
      composition: comp,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outPath,
      inputProps,
    });

    res.json({video: `/videos/${path.basename(outPath)}`});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to render video'});
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
