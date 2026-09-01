function createStoryStorage({ bucket, region }) {
  const { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const client = new S3Client({ region });
  const stateKey = (idempotencyKey) => `instagram-stories/requests/${idempotencyKey}.json`;
  const imageKey = (idempotencyKey) => `instagram-stories/media/${idempotencyKey}.jpg`;

  async function getState(idempotencyKey) {
    try {
      const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: stateKey(idempotencyKey) }));
      return JSON.parse(await result.Body.transformToString());
    } catch (error) {
      if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) return null;
      throw error;
    }
  }

  async function putState(idempotencyKey, state, conditional = false) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: stateKey(idempotencyKey),
      Body: JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
      ContentType: 'application/json',
      CacheControl: 'no-store',
      ServerSideEncryption: 'AES256',
      ...(conditional ? { IfNoneMatch: '*' } : {}),
    });
    await client.send(command);
  }

  async function claim(idempotencyKey) {
    try {
      await putState(idempotencyKey, { status: 'PROCESSING' }, true);
      return { claimed: true };
    } catch (error) {
      if (error?.name !== 'PreconditionFailed' && error?.$metadata?.httpStatusCode !== 412) throw error;
      const state = await getState(idempotencyKey);
      if (state?.status === 'FAILED_RETRYABLE') {
        await putState(idempotencyKey, { status: 'PROCESSING' });
        return { claimed: true };
      }
      return { claimed: false, state };
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

  return { claim, deleteImage, getImageUrl, getState, putState, uploadImage };
}

module.exports = { createStoryStorage };
