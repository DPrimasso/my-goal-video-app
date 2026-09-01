import { afterEach, describe, expect, it, vi } from 'vitest';
import { shareInstagramStoryForEditing } from './instagramNativeShare';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('shareInstagramStoryForEditing', () => {
  it('usa Web Share con un singolo file PNG', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share, canShare: vi.fn(() => true) });

    await expect(shareInstagramStoryForEditing(new Blob(['png'], { type: 'image/png' }))).resolves.toBe('SHARED');

    const data = share.mock.calls[0][0] as ShareData;
    expect(data.files).toHaveLength(1);
    expect(data.files?.[0]).toMatchObject({ name: 'casalpoglio-storia.png', type: 'image/png' });
  });

  it('non scarica nulla quando l’utente annulla il menu Condividi', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('annullato', 'AbortError'));
    const createObjectURL = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, share, canShare: vi.fn(() => true) });
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });

    await expect(shareInstagramStoryForEditing(new Blob(['png'], { type: 'image/png' }))).resolves.toBe('CANCELLED');
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('scarica il PNG quando il browser non supporta la condivisione dei file', async () => {
    const createObjectURL = vi.fn(() => 'blob:download');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    vi.stubGlobal('navigator', { ...navigator, share: undefined, canShare: undefined });
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });

    await expect(shareInstagramStoryForEditing(new Blob(['png'], { type: 'image/png' }))).resolves.toBe('DOWNLOADED');
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
  });
});
