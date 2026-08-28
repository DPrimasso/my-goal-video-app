export class ImageApiError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number) {
    super(message);
    this.name = 'ImageApiError';
  }
}

export async function requestGeneratedImage(endpoint: string, payload: unknown, signal?: AbortSignal): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let code = 'GENERATION_FAILED';
    let message = `Generazione non riuscita (HTTP ${response.status})`;
    try {
      const body = (await response.json()) as { code?: string; message?: string; error?: string };
      code = body.code || code;
      message = body.message || body.error || message;
    } catch {
      // Mantiene il messaggio HTTP se la risposta non è JSON.
    }
    throw new ImageApiError(message, code, response.status);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('image/png')) {
    throw new ImageApiError('Il generatore ha restituito un formato inatteso', 'INVALID_RESPONSE', 502);
  }

  return URL.createObjectURL(await response.blob());
}
