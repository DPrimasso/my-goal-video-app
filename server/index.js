const express = require('express');
const path = require('path');
const fs = require('fs');
const {bundle} = require('@remotion/bundler');
const {getCompositions, renderMedia} = require('@remotion/renderer');
// Ensure TypeScript files are compiled to CommonJS so `require` can resolve them
require('ts-node').register({compilerOptions: {module: 'commonjs'}});
require('dotenv').config();
const players = require('./players');
const teams = require('./teams');
const {fetchGoalClip} = require('../src/api/fetchGoalClip');
const {getSignedS3Url} = require('../src/api/s3Signer');

const VIDEOS_DIR = path.join(__dirname, '..', 'videos');
const ASSET_BASE = process.env.ASSET_BASE || '';
// Resolve an asset path. If it points to an object stored on S3 the function
// generates a short-lived pre-signed URL so that private buckets can be used
// transparently by all routes.
const asset = async (p) => {
  if (!p) {
    return p;
  }

  // Prefix with ASSET_BASE if the path is relative
  const full = p.startsWith('http')
    ? p
    : ASSET_BASE
    ? `${ASSET_BASE}/${p}`
    : p;

  try {
    const {hostname, pathname} = new URL(full);
    // Detect URLs that target S3 and sign them
    if (/\.s3\./.test(hostname)) {
      const bucket = hostname.split('.')[0];
      const key = pathname.replace(/^\//, '');
      return await getSignedS3Url({bucket, key});
    }
  } catch (err) {
    // If parsing fails, fall back to the unmodified path
  }

  return full;
};
const GOAL_CLIP = `s3://${process.env.ASSET_BUCKET}/clips/goal.mp4`;
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR);
}
const app = express();
app.use(express.json());
const PORT = 4000;

// Serve generated videos so that Remotion can access them through an HTTP URL
// during the rendering phase.
app.use('/videos', express.static(VIDEOS_DIR));

// Generate a short-lived pre-signed URL for a given S3 object key.
// The client can use this URL to access private assets without exposing
// AWS credentials in the browser.
app.get('/api/signed-url', async (req, res) => {
  const {key} = req.query;
  if (!key) {
    return res.status(400).json({error: 'Missing key'});
  }
  try {
    const bucket = process.env.ASSET_BUCKET;
    if (!bucket) {
      return res.status(500).json({error: 'Missing ASSET_BUCKET'});
    }
    const url = await getSignedS3Url({bucket, key, expiresIn: 300});
    res.json({url});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to generate URL'});
  }
});

app.post('/api/render', async (req, res) => {
  const {playerId, minuteGoal, goalClip} = req.body || {};
  if (!playerId || !minuteGoal) {
    return res
      .status(400)
      .json({error: 'Missing playerId or minuteGoal'});
  }

  const player = players[playerId];
  if (!player) {
    return res.status(404).json({error: 'Player not found'});
  }

  const playerName = player.name;
  const overlayImage = await asset(player.overlayImagePath);

  try {
    const resolvedGoalClip = goalClip
      ? await fetchGoalClip({clipPath: goalClip})
      : GOAL_CLIP;

    // Bundle the Remotion project
    const entry = path.join(__dirname, '..', 'src', 'remotion', 'index.tsx');
    const bundled = await bundle(entry);

    // Select composition
    const inputProps = {
      playerName,
      minuteGoal,
      goalClip: resolvedGoalClip,
      overlayImage,
    };

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

    const videoUrl = `${req.protocol}://${req.get('host')}/videos/${path.basename(
        outPath
    )}`;
    res.json({video: videoUrl});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to render video'});
  }
});

app.post('/api/render-formation', async (req, res) => {
  const {
    goalkeeper,
    defenders = [],
    midfielders = [],
    attackingMidfielders = [],
    forwards = [],
  } = req.body || {};
  if (!goalkeeper) {
    return res.status(400).json({error: 'Missing goalkeeper'});
  }

  const totalSelected = [
    goalkeeper,
    ...defenders,
    ...midfielders,
    ...attackingMidfielders,
    ...forwards,
  ].filter(Boolean).length;
  if (totalSelected !== 11) {
    return res.status(400).json({error: 'Exactly 11 players required'});
  }

  const mapPlayer = (id) => players[id];
  const gk = mapPlayer(goalkeeper);
  if (!gk) {
    return res.status(404).json({error: 'Player not found'});
  }

  const toInput = async (p) => ({
    name: p.name,
    image: await asset(p.overlayImagePath),
  });
  const toOptionalInput = async (id) => {
    const p = mapPlayer(id);
    return p ? await toInput(p) : null;
  };
  const inputProps = {
    goalkeeper: await toInput(gk),
    defenders: await Promise.all(defenders.map(toOptionalInput)),
    midfielders: await Promise.all(midfielders.map(toOptionalInput)),
    attackingMidfielders: await Promise.all(
      attackingMidfielders.map(toOptionalInput)
    ),
    forwards: await Promise.all(forwards.map(toOptionalInput)),
  };

  try {
    const entry = path.join(__dirname, '..', 'src', 'remotion', 'index.tsx');
    const bundled = await bundle(entry);
    const comps = await getCompositions(bundled, {
      inputProps,
    });
    const comp = comps.find((c) => c.id === 'FormationComp');
    if (!comp) {
      throw new Error('Composition FormationComp not found');
    }
    const outPath = path.join(
        VIDEOS_DIR,
        `${Date.now()}-formation.mp4`
    );
    await renderMedia({
      composition: comp,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outPath,
      inputProps,
    });
    const videoUrl = `${req.protocol}://${req.get('host')}/videos/${path.basename(
        outPath
    )}`;
    res.json({video: videoUrl});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to render formation'});
  }
});

app.post('/api/render-result', async (req, res) => {
  const {teamA, teamB, scoreA, scoreB, scorers = []} = req.body || {};
  if (!teamA || !teamB) {
    return res.status(400).json({error: 'Missing teamA or teamB'});
  }

  const tA = teams[teamA];
  const tB = teams[teamB];
  if (!tA || !tB) {
    return res.status(404).json({error: 'Team not found'});
  }

  const scorerNames = scorers
    .map((id) => {
      const p = players[id];
      return p ? p.name.split(' ').slice(-1)[0] : null;
    })
    .filter(Boolean);

  const inputProps = {
    teamA: {name: tA.name, logo: await asset(tA.logo)},
    teamB: {name: tB.name, logo: await asset(tB.logo)},
    scoreA,
    scoreB,
    scorers: scorerNames,
  };

  try {
    const entry = path.join(__dirname, '..', 'src', 'remotion', 'index.tsx');
    const bundled = await bundle(entry);
    const comps = await getCompositions(bundled, {inputProps});
    const comp = comps.find((c) => c.id === 'FinalResultComp');
    if (!comp) {
      throw new Error('Composition FinalResultComp not found');
    }
    const outPath = path.join(VIDEOS_DIR, `${Date.now()}-result.mp4`);
    await renderMedia({
      composition: comp,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outPath,
      inputProps,
    });
    const videoUrl = `${req.protocol}://${req.get('host')}/videos/${path.basename(
      outPath
    )}`;
    res.json({video: videoUrl});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to render result'});
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
