import { afterEach, describe, expect, it, vi } from 'vitest';
import { publishInstagramStory } from './instagramApi';

afterEach(() => vi.restoreAllMocks());

describe('publishInstagramStory', () => {
  it('invia il PNG con PIN e chiave idempotente', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(new Blob(['png'], { type: 'image/png' }), { status: 200, headers: { 'Content-Type': 'image/png' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: 'STORY_PUBLISHED', message: 'Pubblicata', mediaId: 'media-1',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(publishInstagramStory('https://publisher.test', 'blob:image', '12345678', 'request-key-12345678'))
      .resolves.toMatchObject({ mediaId: 'media-1' });
    expect(fetchMock).toHaveBeenLastCalledWith('https://publisher.test', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'X-Publisher-Pin': '12345678',
        'X-Idempotency-Key': 'request-key-12345678',
      }),
    }));
  });

  it('mostra il messaggio strutturato restituito dal backend', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(new Blob(['png'], { type: 'image/png' }), { status: 200, headers: { 'Content-Type': 'image/png' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 'INVALID_PIN', message: 'PIN non corretto.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })));
    await expect(publishInstagramStory('https://publisher.test', 'blob:image', '00000000', 'request-key-12345678'))
      .rejects.toMatchObject({ code: 'INVALID_PIN', message: 'PIN non corretto.', status: 401 });
  });

  it('non invia formati differenti dal PNG', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Blob(['jpg'], { type: 'image/jpeg' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(publishInstagramStory('https://publisher.test', 'blob:image', '12345678', 'request-key-12345678'))
      .rejects.toMatchObject({ code: 'INVALID_IMAGE' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
