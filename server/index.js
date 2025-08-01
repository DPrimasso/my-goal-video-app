const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {bundle} = require('@remotion/bundler');
const {getCompositions, renderMedia} = require('@remotion/renderer');

const VIDEOS_DIR = path.join(__dirname, '..', 'videos');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR);
}
const app = express();
const upload = multer({dest: 'uploads/'});
const PORT = 4000;

app.use('/videos', express.static(VIDEOS_DIR));

app.post('/api/render', upload.single('clip'), async (req, res) => {
  const playerName = req.body.playerName;
  const clipPath = req.file ? req.file.path : null;
  if (!playerName || !clipPath) {
    return res.status(400).json({error: 'Missing playerName or clip file'});
  }

  try {
    // Bundle the Remotion project
    const entry = path.join(__dirname, '..', 'src', 'remotion', 'index.tsx');
    const bundled = await bundle(entry);

    // Select composition
    const comps = await getCompositions(bundled, {
      inputProps: {playerName, goalClip: clipPath},
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
      inputProps: {playerName, goalClip: clipPath},
    });

    res.json({video: `/videos/${path.basename(outPath)}`});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to render video'});
  } finally {
    // Cleanup uploaded clip
    if (clipPath) {
      fs.unlink(clipPath, () => {});
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
