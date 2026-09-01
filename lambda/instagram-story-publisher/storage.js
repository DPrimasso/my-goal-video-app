const DEFAULT_PROCESSING_STALE_MS = 7 * 60 * 1000;

function isPreconditionFailed(error) {
  return error?.name === 'PreconditionFailed' || error?.$metadata?.httpStatusCode === 412;
}

function createStoryStorage({ bucket, region, client: clientOverride, now = () => new Date() }) {
  const { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const client = clientOverride || new S3Client({ region });
  const stateKey = (idempotencyKey) => `instagram-stories/requests/${idempotencyKey}.json`;
  const imageKey = (idempotencyKey) => `instagram-stories/media/${idempotencyKey}.jpg`;

  async function readState(idempotencyKey) {
    try {
      const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: stateKey(idempotencyKey) }));
      return {
        state: JSON.parse(await result.Body.transformToString()),
        etag: result.ETag,
      };
    } catch (error) {
      if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) return { state: null, etag: undefined };
      throw error;
    }
  }

  async function putState(idempotencyKey, state, conditions = {}) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: stateKey(idempotencyKey),
      Body: JSON.stringify({ ...state, updatedAt: now().toISOString() }),
      ContentType: 'application/json',
      CacheControl: 'no-store',
      ServerSideEncryption: 'AES256',
      ...(conditions.ifNoneMatch ? { IfNoneMatch: '*' } : {}),
      ...(conditions.ifMatch ? { IfMatch: conditions.ifMatch } : {}),
    });
    const result = await client.send(command);
    return result.ETag;
  }

  async function claim(idempotencyKey, processingStaleMs = DEFAULT_PROCESSING_STALE_MS) {
    try {
      const etag = await putState(idempotencyKey, { status: 'PROCESSING' }, { ifNoneMatch: true });
      return { claimed: true, etag };
    } catch (error) {
      if (!isPreconditionFailed(error)) throw error;
      const current = await readState(idempotencyKey);
      const updatedAt = Date.parse(current.state?.updatedAt || '');
      const processingExpired = current.state?.status === 'PROCESSING'
        && Number.isFinite(updatedAt)
        && now().getTime() - updatedAt >= processingStaleMs;
      if ((current.state?.status === 'FAILED_RETRYABLE' || processingExpired) && current.etag) {
        try {
          const etag = await putState(idempotencyKey, { status: 'PROCESSING' }, { ifMatch: current.etag });
          return { claimed: true, etag, recovered: processingExpired };
        } catch (claimError) {
          if (!isPreconditionFailed(claimError)) throw claimError;
          const winner = await readState(idempotencyKey);
          return { claimed: false, state: winner.state };
        }
      }
      return { claimed: false, state: current.state };
    }
  }

  async function uploadImage(idempotencyKey, image) {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: imageKey(idempotencyKey),
      Body: image,
      ContentType: 'image/jpeg',
      CacheControl: 'no-store',
      ServerSideEncryption: 'AES256',
    }));
  }

  async function getImageUrl(idempotencyKey) {
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: imageKey(idempotencyKey) }), { expiresIn: 600 });
  }

  async function deleteImage(idempotencyKey) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: imageKey(idempotencyKey) }));
  }

  return { claim, deleteImage, getImageUrl, putState, readState, uploadImage };
}

module.exports = { createStoryStorage, DEFAULT_PROCESSING_STALE_MS, isPreconditionFailed };
