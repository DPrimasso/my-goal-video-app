const express = require('express');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const VIDEOS_DIR =
  rootDir === path.parse(rootDir).root
    ? path.resolve(__dirname, 'videos')
    : path.resolve(rootDir, 'videos');

if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR);
}

const app = express();
const PORT = process.env.PORT || 4000;
const BUILD_DIR = path.join(__dirname, '..', 'client', 'build');

app.get('/download/goal', (req, res) => {
  const filePath = path.join(VIDEOS_DIR, 'goal.mp4');
  res.download(filePath, 'goal.mp4', (err) => {
    if (err) {
      console.error('Download error:', err);
      res.sendStatus(500);
    }
  });
});

app.use(express.static(BUILD_DIR));
app.use((req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
