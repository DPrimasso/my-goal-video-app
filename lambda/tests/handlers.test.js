const assert = require('node:assert/strict');
const test = require('node:test');

process.env.ASSET_BUCKET = 'test-assets';

const goal = require('../goal-image');
const lineup = require('../lineup-image');
const finalResult = require('../final-result-image');

for (const [name, handler] of [['goal', goal.handler], ['lineup', lineup.handler], ['finalResult', finalResult.handler]]) {
  test(`${name}: OPTIONS restituisce 204 senza CORS applicativo`, async () => {
    const response = await handler({ requestContext: { http: { method: 'OPTIONS' } } });
    assert.equal(response.statusCode, 204);
    assert.equal(response.headers['Access-Control-Allow-Origin'], undefined);
  });

  test(`${name}: payload non valido restituisce errore JSON uniforme`, async () => {
    const response = await handler({ requestContext: { http: { method: 'POST' } }, body: '{}' });
    const body = JSON.parse(response.body);
    assert.equal(response.statusCode, 400);
    assert.equal(typeof body.code, 'string');
    assert.equal(typeof body.message, 'string');
    assert.equal(body.error, undefined);
  });
}

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const validCases = [
  ['goal', goal.createHandler, {
    playerId: 'davide_fava', minuteGoal: 21,
    homeTeam: 'Casalpoglio', homeScore: 1,
    awayTeam: 'Amatori Club', awayScore: 0,
  }],
  ['lineup', lineup.createHandler, {
    opponentTeam: 'Amatori Club',
    players: [
      'davide_fava', 'lorenzo_campagnari', 'davide_scalmana', 'saif_ardhaoui',
      'nicolo_castellini', 'andrea_contesini', 'davide_di_roberto',
      'francesco_gabusi', 'massimiliano_gandellini', 'lorenzo_gobbi', 'antonio_inglese',
    ].map((playerId, index) => ({ playerId, number: index + 1, isCaptain: index === 0 })),
  }],
  ['finalResult', finalResult.createHandler, {
    homeTeam: 'Casalpoglio', awayTeam: 'Amatori Club',
    homeScore: 2, awayScore: 1,
    scorerLines: ["FAVA 21'", "GOBBI 73'"], scorersUnder: 'home',
  }],
];

for (const [name, createHandler, payload] of validCases) {
  test(`${name}: payload valido restituisce PNG`, async () => {
    let renderCalls = 0;
    const handler = createHandler(async () => {
      renderCalls += 1;
      return png;
    });
    const response = await handler({
      requestContext: { http: { method: 'POST' } },
      body: JSON.stringify(payload),
    });

    assert.equal(renderCalls, 1);
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['Content-Type'], 'image/png');
    assert.equal(response.isBase64Encoded, true);
    assert.deepEqual(Buffer.from(response.body, 'base64'), png);
  });
}

test('goal: il template esegue escaping dei valori malevoli', async () => {
  let renderedHtml = '';
  const handler = goal.createHandler(async (html) => {
    renderedHtml = html;
    return png;
  });
  const maliciousTeam = '<img src=x onerror=alert(1)>';
  const response = await handler({
    requestContext: { http: { method: 'POST' } },
    body: JSON.stringify({
      playerId: 'davide_fava', minuteGoal: 21,
      homeTeam: maliciousTeam, homeScore: 1,
      awayTeam: 'Amatori Club', awayScore: 0,
    }),
  });

  assert.equal(response.statusCode, 200);
  assert.equal(renderedHtml.includes(maliciousTeam), false);
  assert.equal(renderedHtml.includes('&lt;IMG SRC=X ONERROR=ALERT(1)&gt;'), true);
});
