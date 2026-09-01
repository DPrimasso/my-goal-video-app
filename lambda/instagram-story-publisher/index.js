const { convertPngToInstagramJpeg, isPng } = require('./image');
const { createMetaClient, MetaApiError } = require('./meta');
const { verifyPin } = require('./security');

// Il limite raw resta sotto i 6 MB sincroni di Lambda anche dopo la codifica base64.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;

class PublisherError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'PublisherError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function responseJson(statusCode, code, message, extra = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ code, message, ...extra }),
  };
}

function getHeader(event, name) {
  const headers = event?.headers || {};
  const wanted = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === wanted);
  return typeof entry?.[1] === 'string' ? entry[1].trim() : '';
}

function getMethod(event) {
  return event?.requestContext?.http?.method || event?.httpMethod || 'POST';
}

function parseImage(event) {
  const contentType = getHeader(event, 'content-type').split(';')[0].toLowerCase();
  if (contentType !== 'image/png') throw new PublisherError(415, 'INVALID_IMAGE_TYPE', 'La grafica deve essere un file PNG.');
  const body = event?.body;
  if (typeof body !== 'string' || !body) throw new PublisherError(400, 'INVALID_IMAGE', 'La grafica PNG è mancante.');
  const image = event.isBase64Encoded ? Buffer.from(body, 'base64') : Buffer.from(body, 'binary');
  if (!image.length || image.length > MAX_IMAGE_BYTES) {
    throw new PublisherError(413, 'IMAGE_TOO_LARGE', 'La grafica supera il limite di 4 MB.');
  }
  if (!isPng(image)) throw new PublisherError(400, 'INVALID_IMAGE', 'Il contenuto inviato non è un PNG valido.');
  return image;
}

function validateConfig(config) {
  const fields = ['accessToken', 'instagramAccountId', 'pinSalt', 'pinHash'];
  if (!config || fields.some((field) => typeof config[field] !== 'string' || !config[field])) {
    throw new PublisherError(503, 'PUBLISHER_NOT_CONFIGURED', 'La pubblicazione Instagram non è ancora configurata.');
  }
  return config;
}

function safeMetaMessage(message) {
  return String(message || '')
    .replace(/access[_ -]?token\s*[:=]?\s*[^\s,;]+/gi, 'access token [nascosto]')
    .replace(/[A-Za-z0-9_-]{80,}/g, '[dato nascosto]')
    .slice(0, 280);
}

function createParameterLoader({ parameterName, region, ttlMilliseconds = 300_000 }) {
  let cached;
  let cachedAt = 0;
  return async function loadConfig() {
    if (cached && Date.now() - cachedAt < ttlMilliseconds) return cached;
    const { GetParameterCommand, SSMClient } = require('@aws-sdk/client-ssm');
    const client = new SSMClient({ region });
    const result = await client.send(new GetParameterCommand({ Name: parameterName, WithDecryption: true }));
    try {
      cached = JSON.parse(result.Parameter?.Value || '');
      cachedAt = Date.now();
      return cached;
    } catch {
      throw new PublisherError(503, 'PUBLISHER_NOT_CONFIGURED', 'La configurazione Instagram in AWS non è valida.');
    }
  };
}

function createHandler(overrides = {}) {
  const enabled = overrides.enabled ?? process.env.PUBLISHING_ENABLED === 'true';
  const region = process.env.AWS_REGION || 'eu-west-1';
  const bucket = process.env.STAGING_BUCKET || process.env.ASSET_BUCKET;
  const loadConfig = overrides.loadConfig || createParameterLoader({
    parameterName: process.env.INSTAGRAM_CONFIG_PARAMETER || '/casalpoglio/instagram-publisher',
    region,
  });
  const convertImage = overrides.convertImage || convertPngToInstagramJpeg;
  const sleepAfterInvalidPin = overrides.sleepAfterInvalidPin || (() => new Promise((resolve) => setTimeout(resolve, 750)));
  const createStorage = overrides.createStorage || (() => {
    if (!bucket) throw new PublisherError(503, 'PUBLISHER_NOT_CONFIGURED', 'Bucket temporaneo non configurato.');
    return require('./storage').createStoryStorage({ bucket, region });
  });
  const createMeta = overrides.createMeta || ((config) => createMetaClient({
    accessToken: config.accessToken,
    instagramAccountId: config.instagramAccountId,
    apiVersion: process.env.META_GRAPH_API_VERSION || 'v25.0',
    graphBaseUrl: process.env.META_GRAPH_BASE_URL || 'https://graph.instagram.com',
  }));
  const expectedInstagramUsername = overrides.expectedInstagramUsername
    || process.env.EXPECTED_INSTAGRAM_USERNAME
    || 'polisportiva.casalpoglio';

  return async function handler(event = {}, context = {}) {
    const method = getMethod(event);
    if (method === 'OPTIONS') return { statusCode: 204, headers: { 'Cache-Control': 'no-store' }, body: '' };
    if (method !== 'POST') return responseJson(405, 'METHOD_NOT_ALLOWED', 'Usa il metodo POST.');
    if (!enabled) return responseJson(503, 'PUBLISHING_DISABLED', 'La pubblicazione Instagram non è ancora attiva.');

    let storage;
    let idempotencyKey = '';
    let claimEtag;
    let ownsClaim = false;
    let publishAttempted = false;
    let metaStage = 'configurazione';
    try {
      const config = validateConfig(await loadConfig());
      const pin = getHeader(event, 'x-publisher-pin');
      if (!verifyPin(pin, config.pinSalt, config.pinHash)) {
        await sleepAfterInvalidPin();
        throw new PublisherError(401, 'INVALID_PIN', 'PIN non corretto.');
      }

      idempotencyKey = getHeader(event, 'x-idempotency-key');
      if (!IDEMPOTENCY_PATTERN.test(idempotencyKey)) {
        throw new PublisherError(400, 'INVALID_IDEMPOTENCY_KEY', 'Identificativo di pubblicazione non valido.');
      }
      const png = parseImage(event);
      storage = createStorage();
      const claim = await storage.claim(idempotencyKey);
      if (!claim.claimed) {
        if (claim.state?.status === 'PUBLISHED') {
          return responseJson(200, 'STORY_PUBLISHED', 'Questa grafica è già stata pubblicata.', {
            mediaId: claim.state.mediaId,
            alreadyPublished: true,
          });
        }
        if (claim.state?.status === 'UNKNOWN') {
          throw new PublisherError(409, 'PUBLISH_STATUS_UNKNOWN', 'Controlla Instagram prima di riprovare: l’esito precedente non è certo.');
        }
        throw new PublisherError(409, 'PUBLISH_IN_PROGRESS', 'La pubblicazione di questa grafica è già in corso.');
      }
      ownsClaim = true;
      claimEtag = claim.etag;

      const meta = createMeta(config);
      metaStage = 'verifica dell’account';
      await meta.verifyAccount(expectedInstagramUsername);

      let jpeg;
      try {
        jpeg = await convertImage(png);
      } catch (conversionError) {
        console.error('Instagram image conversion failed', {
          requestId: context.awsRequestId,
          message: conversionError?.message || String(conversionError),
        });
        throw new PublisherError(400, 'INVALID_IMAGE', 'La grafica non può essere adattata al formato Storia.');
      }
      await storage.uploadImage(idempotencyKey, jpeg);
      const imageUrl = await storage.getImageUrl(idempotencyKey);
      metaStage = 'creazione del contenitore';
      const containerId = await meta.createContainer(imageUrl);
      metaStage = 'elaborazione del contenuto';
      await meta.waitUntilReady(containerId);
      publishAttempted = true;
      metaStage = 'pubblicazione';
      const mediaId = await meta.publish(containerId);
      await storage.putState(idempotencyKey, { status: 'PUBLISHED', mediaId }, { ifMatch: claimEtag });
      ownsClaim = false;
      try {
        await storage.deleteImage(idempotencyKey);
      } catch (cleanupError) {
        console.error('Instagram staging cleanup failed', { requestId: context.awsRequestId, message: cleanupError?.message });
      }
      return responseJson(200, 'STORY_PUBLISHED', 'Storia pubblicata su Instagram.', { mediaId });
    } catch (error) {
      if (ownsClaim && storage && idempotencyKey) {
        const status = publishAttempted ? 'UNKNOWN' : 'FAILED_RETRYABLE';
        try {
          await storage.putState(idempotencyKey, { status }, { ifMatch: claimEtag });
        } catch (stateError) {
          console.error('Instagram publication state update failed', { requestId: context.awsRequestId, message: stateError?.message });
        }
      }
      if (error instanceof PublisherError) return responseJson(error.statusCode, error.code, error.message);
      if (error instanceof MetaApiError) {
        const code = error.authError ? 'META_AUTH_EXPIRED' : error.code;
        const diagnosticParts = [error.metaCode, error.metaSubcode].filter((value) => value !== undefined);
        const diagnostic = diagnosticParts.length ? diagnosticParts.join('/') : error.code;
        console.error('Instagram Meta API request failed', {
          requestId: context.awsRequestId,
          stage: metaStage,
          code: error.code,
          status: error.status,
          metaCode: error.metaCode,
          metaSubcode: error.metaSubcode,
          metaType: error.metaType,
          message: safeMetaMessage(error.message),
        });
        const message = error.authError
          ? 'Il collegamento Instagram deve essere rinnovato.'
          : error.code === 'META_ACCOUNT_MISMATCH'
            ? error.message
          : `Instagram ha rifiutato la ${metaStage} (${diagnostic}): ${safeMetaMessage(error.message)}`;
        return responseJson(error.status || 502, code, message, { diagnostic, stage: metaStage });
      }
      console.error('Instagram story publication failed', { requestId: context.awsRequestId, message: error?.message || String(error) });
      return responseJson(500, 'PUBLISHING_FAILED', 'Impossibile pubblicare la Storia. Riprova tra poco.');
    }
  };
}

const handler = createHandler();

module.exports = { createHandler, createParameterLoader, handler, parseImage, PublisherError };
