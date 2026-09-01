const assert = require('node:assert/strict');
const test = require('node:test');
const { createStoryStorage, DEFAULT_PROCESSING_STALE_MS } = require('../storage');

function preconditionFailed() {
  const error = new Error('Precondition failed');
  error.name = 'PreconditionFailed';
  error.$metadata = { httpStatusCode: 412 };
  return error;
}

function createMemoryS3() {
  const objects = new Map();
  let version = 0;
  return {
    objects,
    async send(command) {
      const input = command.input;
      const type = command.constructor.name;
      if (type === 'PutObjectCommand') {
        const current = objects.get(input.Key);
        if (input.IfNoneMatch === '*' && current) throw preconditionFailed();
        if (input.IfMatch && current?.etag !== input.IfMatch) throw preconditionFailed();
        version += 1;
        const etag = `"etag-${version}"`;
        objects.set(input.Key, { body: String(input.Body), etag });
        return { ETag: etag };
      }
      if (type === 'GetObjectCommand') {
        const current = objects.get(input.Key);
        if (!current) {
          const error = new Error('Missing');
          error.name = 'NoSuchKey';
          throw error;
        }
        return {
          ETag: current.etag,
          Body: { transformToString: async () => current.body },
        };
      }
      if (type === 'DeleteObjectCommand') {
        objects.delete(input.Key);
        return {};
      }
      throw new Error(`Unexpected command ${type}`);
    },
  };
}

test('una richiesta concorrente non acquisisce un PROCESSING attivo', async () => {
  const client = createMemoryS3();
  const storage = createStoryStorage({ bucket: 'bucket', region: 'eu-west-1', client });
  const first = await storage.claim('request-key');
  const duplicate = await storage.claim('request-key');
  assert.equal(first.claimed, true);
  assert.equal(duplicate.claimed, false);
  assert.equal(duplicate.state.status, 'PROCESSING');
});

test('soltanto un concorrente può recuperare un FAILED_RETRYABLE', async () => {
  const client = createMemoryS3();
  const storage = createStoryStorage({ bucket: 'bucket', region: 'eu-west-1', client });
  const first = await storage.claim('request-key');
  await storage.putState('request-key', { status: 'FAILED_RETRYABLE' }, { ifMatch: first.etag });
  const claims = await Promise.all([storage.claim('request-key'), storage.claim('request-key')]);
  assert.equal(claims.filter((claim) => claim.claimed).length, 1);
  assert.equal(claims.filter((claim) => !claim.claimed).length, 1);
});

test('recupera atomicamente un PROCESSING più vecchio di sette minuti', async () => {
  let currentTime = new Date('2026-09-01T10:00:00.000Z');
  const client = createMemoryS3();
  const storage = createStoryStorage({
    bucket: 'bucket', region: 'eu-west-1', client, now: () => currentTime,
  });
  await storage.claim('request-key');
  currentTime = new Date(currentTime.getTime() + DEFAULT_PROCESSING_STALE_MS);
  const recovered = await storage.claim('request-key');
  assert.equal(recovered.claimed, true);
  assert.equal(recovered.recovered, true);
});

test('UNKNOWN e PUBLISHED non vengono mai acquisiti nuovamente', async () => {
  for (const status of ['UNKNOWN', 'PUBLISHED']) {
    const client = createMemoryS3();
    const storage = createStoryStorage({ bucket: 'bucket', region: 'eu-west-1', client });
    const first = await storage.claim(`request-${status}`);
    await storage.putState(`request-${status}`, { status, mediaId: 'media' }, { ifMatch: first.etag });
    const retry = await storage.claim(`request-${status}`);
    assert.equal(retry.claimed, false);
    assert.equal(retry.state.status, status);
  }
});
