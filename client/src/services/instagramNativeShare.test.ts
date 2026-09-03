import { afterEach, describe, expect, it, vi } from 'vitest';
import { fitImageToInstagramStory, shareInstagramStoryForEditing } from './instagramNativeShare';

function pngHeader(width: number, height: number): Blob {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return new Blob([bytes], { type: 'image/png' });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('shareInstagramStoryForEditing', () => {
  it('lascia invariata una grafica gia 9:16', async () => {
    const image = pngHeader(1440, 2560);
    await expect(fitImageToInstagramStory(image)).resolves.toBe(image);
  });

  it('inserisce la lineup 1080x2000 interamente in una Storia 1080x1920', async () => {
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    const close = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage, fillRect, fillStyle: '' })),
      toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['story'], { type: 'image/png' }))),
    } as unknown as HTMLCanvasElement;
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => (
      tagName === 'canvas' ? canvas : createElement(tagName, options)
    ));
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ close })));

    const result = await fitImageToInstagramStory(pngHeader(1080, 2000));

    expect(result.type).toBe('image/png');
    expect(canvas).toMatchObject({ width: 1080, height: 1920 });
    expect(fillRect).toHaveBeenCalledWith(0, 0, 1080, 1920);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 21.600000000000023, 0, 1036.8, 1920);
    expect(close).toHaveBeenCalledTimes(1);
  });

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
