const express = require('express');
const path = require('path');
require('dotenv').config();
const players = require('./players');
const teams = require('./teams');
const {fetchGoalClip} = require('./api/fetchGoalClip');
const {getSignedS3Url} = require('./api/s3Signer');
const {renderOnLambda} = require('./api/renderOnLambda');

const ASSET_BASE = process.env.ASSET_BASE || '';
const asset = async (p) => {
  if (!p) {
    return p;
  }

  const full = p.startsWith('http')
    ? p
    : ASSET_BASE
    ? `${ASSET_BASE}/${p}`
    : p;

  try {
    const {hostname, pathname} = new URL(full);
    if (/\.s3\./.test(hostname)) {
      const bucket = hostname.split('.')[0];
      const key = pathname.replace(/^\//, '');
      return await getSignedS3Url({bucket, key});
    }
  } catch (err) {
  }

  return full;
};
const GOAL_CLIP =
  process.env.GOAL_CLIP || `s3://${process.env.S3_BUCKET_NAME}/clips/goal.mov`;
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 4000;
const BUILD_DIR = path.join(__dirname, '..', 'client', 'build');
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
  const {playerId, minuteGoal} = req.body || {};
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
    const resolvedGoalClip = await fetchGoalClip({clipPath: GOAL_CLIP});
    const inputProps = {
      playerName,
      minuteGoal,
      goalClip: resolvedGoalClip,
      overlayImage,
    };
    const videoUrl = await renderOnLambda({
      composition: 'GoalComp',
      inputProps,
      outName: `${Date.now()}-${playerName.replace(/\s+/g, '_')}.mp4`,
    });
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
    const videoUrl = await renderOnLambda({
      composition: 'FormationComp',
      inputProps,
      outName: `${Date.now()}-formation.mp4`,
    });
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
    const videoUrl = await renderOnLambda({
      composition: 'FinalResultComp',
      inputProps,
      outName: `${Date.now()}-result.mp4`,
    });
    res.json({video: videoUrl});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to render result'});
  }
});

app.use(express.static(BUILD_DIR));
app.use((req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
