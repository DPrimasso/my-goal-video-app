const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export interface InstagramPublishResult {
  code: 'STORY_PUBLISHED';
  message: string;
  mediaId: string;
  alreadyPublished?: boolean;
}

export class InstagramApiError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number) {
    super(message);
    this.name = 'InstagramApiError';
  }
}

async function readError(response: Response): Promise<InstagramApiError> {
  let code = 'PUBLISHING_FAILED';
  let message = `Pubblicazione non riuscita (HTTP ${response.status})`;
  try {
    const body = (await response.json()) as { code?: string; message?: string };
    code = body.code || code;
    message = body.message || message;
  } catch {
    // Conserva il messaggio HTTP se la risposta non è JSON.
  }
  return new InstagramApiError(message, code, response.status);
}

export async function publishInstagramStory(
  endpoint: string,
  imageUrl: string,
  pin: string,
  idempotencyKey: string,
): Promise<InstagramPublishResult> {
  let imageResponse: Response;
  try {
    imageResponse = await fetch(imageUrl);
  } catch {
    throw new InstagramApiError('Non riesco a leggere la grafica generata. Rigenerala e riprova.', 'IMAGE_UNAVAILABLE', 0);
  }
  if (!imageResponse.ok) {
    throw new InstagramApiError('Non riesco a leggere la grafica generata. Rigenerala e riprova.', 'IMAGE_UNAVAILABLE', imageResponse.status);
  }
  const image = await imageResponse.blob();
  const imageType = image.type || imageResponse.headers.get('content-type')?.split(';')[0] || '';
  if (imageType !== 'image/png' || !image.size) {
    throw new InstagramApiError('La grafica generata non è un PNG valido.', 'INVALID_IMAGE', 400);
  }
  if (image.size > MAX_IMAGE_BYTES) {
    throw new InstagramApiError('La grafica supera il limite di 4 MB.', 'IMAGE_TOO_LARGE', 413);
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'X-Publisher-Pin': pin,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: image,
    });
  } catch {
    throw new InstagramApiError('Connessione al servizio Instagram non riuscita. Riprova tra poco.', 'NETWORK_ERROR', 0);
  }
  if (!response.ok) throw await readError(response);

  const result = (await response.json()) as Partial<InstagramPublishResult>;
  if (result.code !== 'STORY_PUBLISHED' || !result.mediaId) {
    throw new InstagramApiError('Il servizio non ha confermato la pubblicazione.', 'INVALID_RESPONSE', 502);
  }
  return result as InstagramPublishResult;
}
