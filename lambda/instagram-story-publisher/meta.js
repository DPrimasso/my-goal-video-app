class MetaApiError extends Error {
  constructor(code, message, status, authError = false, details = {}) {
    super(message);
    this.name = 'MetaApiError';
    this.code = code;
    this.status = status;
    this.authError = authError;
    this.metaCode = details.metaCode;
    this.metaSubcode = details.metaSubcode;
    this.metaType = details.metaType;
  }
}

function createMetaClient({ accessToken, instagramAccountId, apiVersion, graphBaseUrl = 'https://graph.instagram.com', fetchImpl = fetch, wait = undefined }) {
  const pause = wait || ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const baseUrl = `${graphBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(apiVersion)}`;

  async function request(path, options = {}) {
    const response = await fetchImpl(`${baseUrl}/${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${accessToken}`, ...options.headers },
    });
    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      throw new MetaApiError('META_INVALID_RESPONSE', 'Meta ha restituito una risposta non valida.', response.status);
    }
    if (!response.ok || body.error) {
      const metaCode = body.error?.code;
      const authError = response.status === 401 || metaCode === 190;
      throw new MetaApiError(
        authError ? 'META_AUTH_EXPIRED' : 'META_REQUEST_FAILED',
        body.error?.message || `Richiesta Meta non riuscita (HTTP ${response.status}).`,
        response.status,
        authError,
        {
          metaCode,
          metaSubcode: body.error?.error_subcode,
          metaType: body.error?.type,
        },
      );
    }
    return body;
  }

  async function createContainer(imageUrl) {
    const body = new URLSearchParams({
      image_url: imageUrl,
      media_type: 'STORIES',
    });
    const result = await request(`${encodeURIComponent(instagramAccountId)}/media`, { method: 'POST', body });
    if (!result.id) throw new MetaApiError('META_INVALID_RESPONSE', 'Meta non ha restituito il container della Storia.', 502);
    return result.id;
  }

  async function verifyAccount(expectedUsername) {
    const query = new URLSearchParams({ fields: 'id,username' });
    const result = await request(`${encodeURIComponent(instagramAccountId)}?${query}`);
    const actualUsername = String(result.username || '').replace(/^@/, '').toLowerCase();
    const wantedUsername = String(expectedUsername || '').replace(/^@/, '').toLowerCase();
    if (String(result.id || '') !== String(instagramAccountId) || !wantedUsername || actualUsername !== wantedUsername) {
      throw new MetaApiError(
        'META_ACCOUNT_MISMATCH',
        'L’account Instagram autorizzato non corrisponde alla destinazione configurata.',
        503,
      );
    }
    return { id: String(result.id), username: result.username };
  }

  async function waitUntilReady(containerId) {
    for (let attempt = 0; attempt <= 5; attempt += 1) {
      const query = new URLSearchParams({ fields: 'status_code,status' });
      const result = await request(`${encodeURIComponent(containerId)}?${query}`);
      if (result.status_code === 'FINISHED') return;
      if (['ERROR', 'EXPIRED'].includes(result.status_code)) {
        throw new MetaApiError(
          'META_PROCESSING_FAILED',
          result.status || 'Instagram non è riuscito a elaborare la grafica.',
          502,
        );
      }
      if (attempt < 5) await pause(60_000);
    }
    throw new MetaApiError('META_PROCESSING_TIMEOUT', 'Instagram sta impiegando troppo tempo a elaborare la grafica.', 504);
  }

  async function publish(containerId) {
    const body = new URLSearchParams({ creation_id: containerId });
    const result = await request(`${encodeURIComponent(instagramAccountId)}/media_publish`, { method: 'POST', body });
    if (!result.id) throw new MetaApiError('META_INVALID_RESPONSE', 'Meta non ha confermato la pubblicazione.', 502);
    return result.id;
  }

  return { createContainer, publish, verifyAccount, waitUntilReady };
}

module.exports = { createMetaClient, MetaApiError };
