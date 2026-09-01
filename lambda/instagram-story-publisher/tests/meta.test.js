const assert = require('node:assert/strict');
const test = require('node:test');
const { createMetaClient, MetaApiError } = require('../meta');

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

test('il client Meta crea, attende e pubblica una Storia', async () => {
  const calls = [];
  const responses = [
    jsonResponse({ id: 'container' }),
    jsonResponse({ id: 'container', status_code: 'IN_PROGRESS' }),
    jsonResponse({ id: 'container', status_code: 'FINISHED' }),
    jsonResponse({ id: 'media' }),
  ];
  const client = createMetaClient({
    accessToken: 'token', instagramAccountId: 'account', apiVersion: 'v25.0',
    fetchImpl: async (url, options) => { calls.push({ url, options }); return responses.shift(); },
    wait: async () => {},
  });
  const container = await client.createContainer('https://example.invalid/story.jpg');
  await client.waitUntilReady(container);
  const media = await client.publish(container);
  assert.equal(media, 'media');
  assert.equal(calls.length, 4);
  assert.equal(calls[0].options.body.get('media_type'), 'STORIES');
  assert.equal(calls[0].options.body.get('image_url'), 'https://example.invalid/story.jpg');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token');
  assert.equal(calls[0].options.body.has('access_token'), false);
});

test('riconosce un token Meta non valido', async () => {
  const client = createMetaClient({
    accessToken: 'expired', instagramAccountId: 'account', apiVersion: 'v25.0',
    fetchImpl: async () => jsonResponse({ error: { code: 190, message: 'Invalid token' } }, 400),
  });
  await assert.rejects(
    () => client.createContainer('https://example.invalid/story.jpg'),
    (error) => error instanceof MetaApiError
      && error.authError === true
      && error.metaCode === 190,
  );
});

test('verifica ID e username dell’account Instagram', async () => {
  const client = createMetaClient({
    accessToken: 'token', instagramAccountId: 'account-id', apiVersion: 'v25.0',
    fetchImpl: async () => jsonResponse({ id: 'account-id', username: 'polisportiva.casalpoglio' }),
  });
  await assert.doesNotReject(() => client.verifyAccount('polisportiva.casalpoglio'));
});

test('rifiuta un account Instagram differente da quello atteso', async () => {
  const client = createMetaClient({
    accessToken: 'token', instagramAccountId: 'account-id', apiVersion: 'v25.0',
    fetchImpl: async () => jsonResponse({ id: 'account-id', username: 'altro.account' }),
  });
  await assert.rejects(
    () => client.verifyAccount('polisportiva.casalpoglio'),
    (error) => error instanceof MetaApiError && error.code === 'META_ACCOUNT_MISMATCH',
  );
});

test('attende Meta ogni minuto per non più di cinque minuti', async () => {
  const waits = [];
  let calls = 0;
  const client = createMetaClient({
    accessToken: 'token', instagramAccountId: 'account-id', apiVersion: 'v25.0',
    fetchImpl: async () => { calls += 1; return jsonResponse({ status_code: 'IN_PROGRESS' }); },
    wait: async (milliseconds) => { waits.push(milliseconds); },
  });
  await assert.rejects(
    () => client.waitUntilReady('container'),
    (error) => error instanceof MetaApiError && error.code === 'META_PROCESSING_TIMEOUT',
  );
  assert.equal(calls, 6);
  assert.deepEqual(waits, [60_000, 60_000, 60_000, 60_000, 60_000]);
});

for (const statusCode of ['ERROR', 'EXPIRED']) {
  test(`interrompe l’attesa quando Meta restituisce ${statusCode}`, async () => {
    const client = createMetaClient({
      accessToken: 'token', instagramAccountId: 'account-id', apiVersion: 'v25.0',
      fetchImpl: async () => jsonResponse({ status_code: statusCode, status: 'failed' }),
      wait: async () => {},
    });
    await assert.rejects(
      () => client.waitUntilReady('container'),
      (error) => error instanceof MetaApiError && error.code === 'META_PROCESSING_FAILED',
    );
  });
}
