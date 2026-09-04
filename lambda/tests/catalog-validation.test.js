const assert = require('node:assert/strict');
const test = require('node:test');
const { catalog } = require('../shared/catalog');
const { HttpError, parseJsonBody } = require('../shared/http');
const { escapeHtml, validateFinalResult, validateGoal, validateLineup } = require('../shared/validation');

test('il catalogo contiene ID univoci e cinque fallback fotografici', () => {
  const ids = catalog.players.map((player) => player.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(catalog.players.filter((player) => !player.assetKey).length, 5);
});

test('il goal accetta playerId e non usa URL forniti dal client', () => {
  const value = validateGoal({
    playerId: 'daniele_primasso',
    goalCount: 2,
    playerImageUrl: 'http://169.254.169.254/latest/meta-data',
    minuteGoal: 78,
    homeTeam: 'Casalpoglio',
    awayTeam: 'Amatori Club',
    homeScore: 2,
    awayScore: 1,
  });
  assert.equal(value.player.id, 'daniele_primasso');
  assert.equal(value.goalCount, 2);
  assert.equal('playerImageUrl' in value, false);
});

test('il goal accetta solo goal, doppietta o tripletta e mantiene compatibilità con i vecchi payload', () => {
  const basePayload = {
    playerId: 'daniele_primasso', minuteGoal: 78,
    homeTeam: 'Casalpoglio', awayTeam: 'Amatori Club', homeScore: 3, awayScore: 0,
  };
  assert.equal(validateGoal(basePayload).goalCount, 1);
  assert.equal(validateGoal({ ...basePayload, goalCount: 3 }).goalCount, 3);
  assert.throws(() => validateGoal({ ...basePayload, goalCount: 4 }), HttpError);
});

test('il goal rifiuta minuto zero e squadre uguali', () => {
  assert.throws(() => validateGoal({
    playerId: 'daniele_primasso', minuteGoal: 0, homeTeam: 'A', awayTeam: 'B', homeScore: 1, awayScore: 0,
  }), HttpError);
  assert.throws(() => validateGoal({
    playerId: 'daniele_primasso', minuteGoal: 1, homeTeam: 'Casalpoglio', awayTeam: 'casalpoglio', homeScore: 1, awayScore: 0,
  }), HttpError);
});

test('la formazione richiede undici giocatori differenti', () => {
  const duplicate = Array.from({ length: 11 }, (_, index) => ({
    playerId: index === 10 ? 'davide_fava' : catalog.players[index].id,
    number: index + 1,
    isCaptain: false,
  }));
  assert.throws(() => validateLineup({ players: duplicate, opponentTeam: 'Avversari' }), /una sola volta/);
});

test('il risultato limita righe e punteggi', () => {
  assert.throws(() => validateFinalResult({
    homeTeam: 'A', awayTeam: 'B', homeScore: 100, awayScore: 0, scorerLines: [], scorersUnder: 'home',
  }), HttpError);
  assert.throws(() => validateFinalResult({
    homeTeam: 'A', awayTeam: 'B', homeScore: 1, awayScore: 0, scorerLines: ['x'.repeat(81)], scorersUnder: 'home',
  }), HttpError);
});

test('escaping HTML e limite corpo proteggono i template', () => {
  assert.equal(escapeHtml('<script>"x"</script>'), '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
  assert.throws(() => parseJsonBody({ body: JSON.stringify({ value: 'x'.repeat(51 * 1024) }) }), /50 KB/);
});
