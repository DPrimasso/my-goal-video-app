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

// Serve generated videos and uploaded clips so that Remotion can
// access them through an HTTP URL during the rendering phase.
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
app.use('/videos', express.static(VIDEOS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

app.post(
  '/api/render',
  upload.fields([
    {name: 'clip', maxCount: 1},
    {name: 'overlay', maxCount: 1},
  ]),
  async (req, res) => {
    const playerName = req.body.playerName;
    const clipFile = req.files && req.files['clip'] ? req.files['clip'][0] : null;
    const overlayFile = req.files && req.files['overlay'] ? req.files['overlay'][0] : null;
    const clipPath = clipFile ? clipFile.path : null;
    const overlayPath = overlayFile ? overlayFile.path : null;
    const clipUrl = clipPath ? `http://localhost:${PORT}/${clipPath}` : null;
    const overlayUrl = overlayPath
      ? `http://localhost:${PORT}/${overlayPath}`
      : null;
    if (!playerName || !clipUrl || !overlayUrl) {
      return res
        .status(400)
        .json({error: 'Missing playerName, clip file or overlay image'});
    }

  try {
    // Bundle the Remotion project
    const entry = path.join(__dirname, '..', 'src', 'remotion', 'index.tsx');
    const bundled = await bundle(entry);

    // Select composition
    const comps = await getCompositions(bundled, {
      inputProps: {playerName, goalClip: clipUrl, overlayImage: overlayUrl},
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
      inputProps: {playerName, goalClip: clipPath, overlayImage: overlayPath},
    });

    res.json({video: `/videos/${path.basename(outPath)}`});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to render video'});
  } finally {
    // Cleanup uploaded files
    if (clipPath) {
      fs.unlink(clipPath, () => {});
    }
    if (overlayPath) {
      fs.unlink(overlayPath, () => {});
    }
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
