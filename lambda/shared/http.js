const MAX_BODY_BYTES = 50 * 1024;

class HttpError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function getMethod(event) {
  return event?.requestContext?.http?.method || event?.httpMethod || 'POST';
}

function parseJsonBody(event) {
  if (!event || typeof event !== 'object') throw new HttpError(400, 'INVALID_REQUEST', 'Richiesta non valida.');
  if (event.body === undefined && !event.requestContext) return event;
  let body = event.body || '';
  if (event.isBase64Encoded) body = Buffer.from(body, 'base64').toString('utf8');
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'La richiesta supera 50 KB.');
  try {
    const parsed = body ? JSON.parse(body) : {};
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('object expected');
    return parsed;
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Il corpo della richiesta deve essere un oggetto JSON valido.');
  }
}

function responseJson(statusCode, code, message) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ code, message }),
  };
}

function responsePng(buffer) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    body: Buffer.from(buffer).toString('base64'),
    isBase64Encoded: true,
  };
}

function responseOptions() {
  return { statusCode: 204, headers: { 'Cache-Control': 'no-store' }, body: '' };
}

function handleError(error, requestId) {
  if (error instanceof HttpError) return responseJson(error.statusCode, error.code, error.message);
  console.error('Unhandled image generation error', { requestId, message: error?.message || String(error) });
  return responseJson(500, 'INTERNAL_ERROR', 'Impossibile generare l’immagine. Riprova tra poco.');
}

module.exports = { HttpError, getMethod, parseJsonBody, responseJson, responsePng, responseOptions, handleError };
