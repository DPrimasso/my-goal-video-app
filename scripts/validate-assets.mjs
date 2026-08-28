import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(path.join(repositoryRoot, 'assets/manifest.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(repositoryRoot, manifest.catalog), 'utf8'));
const assetRoot = path.join(repositoryRoot, manifest.sourceDirectory);
const expected = new Set([
  ...manifest.requiredAssets,
  manifest.fallbackPlayerAsset,
  ...catalog.players.flatMap((player) => player.assetKey ? [player.assetKey] : []),
]);

const missing = [];
for (const asset of expected) {
  try {
    await access(path.join(assetRoot, ...asset.split('/')));
  } catch {
    missing.push(asset);
  }
}

const playerIds = catalog.players.map((player) => player.id);
if (new Set(playerIds).size !== playerIds.length) missing.push('catalog: duplicate player ID');

if (missing.length) {
  console.error(`Asset mancanti o non validi:\n- ${missing.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Asset manifest valido: ${expected.size} file verificati.`);
}
