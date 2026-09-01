const assert = require('node:assert/strict');
const test = require('node:test');
const { createHandler } = require('../index');
const { MetaApiError } = require('../meta');
const { createPinHash, verifyPin } = require('../security');

const pin = '12345678';
const pinData = createPinHash(pin, Buffer.from('0123456789abcdef').toString('base64'));
const config = { accessToken: 'token', instagramAccountId: 'ig-id', ...pinData };
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

function event(overrides = {}) {
  return {
    requestContext: { http: { method: 'POST' } },
    headers: {
      'content-type': 'image/png',
      'x-publisher-pin': pin,
      'x-idempotency-key': '12345678-1234-4234-9234-123456789abc',
    },
    body: png.toString('base64'),
    isBase64Encoded: true,
    ...overrides,
  };
}

function dependencies(storageOverrides = {}, metaOverrides = {}) {
  const state = [];
  const storage = {
    claim: async () => ({ claimed: true }),
    uploadImage: async () => {},
    getImageUrl: async () => 'https://example.invalid/story.jpg',
    putState: async (_key, value) => state.push(value),
    deleteImage: async () => {},
    ...storageOverrides,
  };
  const meta = {
    createContainer: async () => 'container-id',
    waitUntilReady: async () => {},
    publish: async () => 'media-id',
    ...metaOverrides,
  };
  return {
    enabled: true,
    loadConfig: async () => config,
    sleepAfterInvalidPin: async () => {},
    convertImage: async () => Buffer.from('jpeg'),
    createStorage: () => storage,
    createMeta: () => meta,
    state,
  };
}

test('verifica il PIN con confronto derivato', () => {
  assert.equal(verifyPin(pin, config.pinSalt, config.pinHash), true);
  assert.equal(verifyPin('87654321', config.pinSalt, config.pinHash), false);
  assert.throws(() => createPinHash('1234'));
});

test('la pubblicazione è disattivata per impostazione predefinita', async () => {
  const response = await createHandler({ enabled: false })(event());
  assert.equal(response.statusCode, 503);
  assert.equal(JSON.parse(response.body).code, 'PUBLISHING_DISABLED');
});

test('rifiuta PIN errato senza iniziare la pubblicazione', async () => {
  const deps = dependencies();
  const response = await createHandler(deps)(event({
    headers: { ...event().headers, 'x-publisher-pin': '87654321' },
  }));
  assert.equal(response.statusCode, 401);
  assert.equal(JSON.parse(response.body).code, 'INVALID_PIN');
});

test('pubblica una grafica valida e registra il media id', async () => {
  const deps = dependencies();
  const response = await createHandler(deps)(event());
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(body.code, 'STORY_PUBLISHED');
  assert.equal(body.mediaId, 'media-id');
  assert.deepEqual(deps.state.at(-1), { status: 'PUBLISHED', mediaId: 'media-id' });
});

test('una chiave già pubblicata non crea una seconda Storia', async () => {
  let metaCalls = 0;
  const deps = dependencies({
    claim: async () => ({ claimed: false, state: { status: 'PUBLISHED', mediaId: 'existing-id' } }),
  }, {
    createContainer: async () => { metaCalls += 1; },
  });
  const response = await createHandler(deps)(event());
  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(body.alreadyPublished, true);
  assert.equal(body.mediaId, 'existing-id');
  assert.equal(metaCalls, 0);
});

test('dopo un errore precedente incerto blocca il retry', async () => {
  const deps = dependencies({ claim: async () => ({ claimed: false, state: { status: 'UNKNOWN' } }) });
  const response = await createHandler(deps)(event());
  assert.equal(response.statusCode, 409);
  assert.equal(JSON.parse(response.body).code, 'PUBLISH_STATUS_UNKNOWN');
});

test('restituisce una diagnostica Meta senza esporre token', async () => {
  const deps = dependencies({}, {
    createContainer: async () => {
      throw new MetaApiError(
        'META_REQUEST_FAILED',
        'Invalid parameter access_token=secret-value',
        400,
        false,
        { metaCode: 100, metaSubcode: 33 },
      );
    },
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await createHandler(deps)(event());
    const body = JSON.parse(response.body);
    assert.equal(response.statusCode, 400);
    assert.equal(body.diagnostic, '100/33');
    assert.equal(body.stage, 'creazione del contenitore');
    assert.equal(body.message.includes('secret-value'), false);
  } finally {
    console.error = originalError;
  }
});

test('OPTIONS restituisce 204 e un file non PNG viene rifiutato', async () => {
  const handler = createHandler({ enabled: true });
  const options = await handler({ requestContext: { http: { method: 'OPTIONS' } } });
  assert.equal(options.statusCode, 204);

  const deps = dependencies();
  const invalid = await createHandler(deps)(event({ body: Buffer.from('not png').toString('base64') }));
  assert.equal(invalid.statusCode, 400);
  assert.equal(JSON.parse(invalid.body).code, 'INVALID_IMAGE');
});
