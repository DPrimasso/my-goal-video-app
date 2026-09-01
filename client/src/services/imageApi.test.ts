import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestGeneratedImage } from './imageApi';

afterEach(() => vi.restoreAllMocks());

describe('requestGeneratedImage', () => {
  it('crea un object URL soltanto da una risposta PNG', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('png', {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    })));
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:test') });
    await expect(requestGeneratedImage('https://example.test', { ok: true })).resolves.toBe('blob:test');
  });

  it('propaga il messaggio JSON uniforme', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 'INVALID_FIELD',
      message: 'Minuto non valido',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } })));
    await expect(requestGeneratedImage('https://example.test', {})).rejects.toEqual(
      expect.objectContaining({ code: 'INVALID_FIELD', status: 400, message: 'Minuto non valido' }),
    );
  });

  it('rifiuta una risposta di successo non PNG', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));
    await expect(requestGeneratedImage('https://example.test', {})).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
});
