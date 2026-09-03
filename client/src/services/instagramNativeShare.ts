import { prepareInstagramImage } from './instagramApi';

export type InstagramNativeShareResult = 'SHARED' | 'CANCELLED' | 'DOWNLOADED';

const STORY_FILE_NAME = 'casalpoglio-storia.png';
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

interface ImageDimensions {
  width: number;
  height: number;
}

async function readPngDimensions(image: Blob): Promise<ImageDimensions | null> {
  const header = new Uint8Array(await image.slice(0, 24).arrayBuffer());
  if (header.length < 24 || PNG_SIGNATURE.some((byte, index) => header[index] !== byte)) return null;
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Impossibile adattare la grafica al formato Storia.'));
    }, 'image/png');
  });
}

export async function fitImageToInstagramStory(image: Blob): Promise<Blob> {
  const dimensions = await readPngDimensions(image);
  if (!dimensions || dimensions.width * STORY_HEIGHT === dimensions.height * STORY_WIDTH) return image;

  const bitmap = await createImageBitmap(image);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = STORY_WIDTH;
    canvas.height = STORY_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Impossibile adattare la grafica al formato Storia.');

    context.fillStyle = '#08000d';
    context.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
    const scale = Math.min(STORY_WIDTH / dimensions.width, STORY_HEIGHT / dimensions.height);
    const width = dimensions.width * scale;
    const height = dimensions.height * scale;
    context.drawImage(bitmap, (STORY_WIDTH - width) / 2, (STORY_HEIGHT - height) / 2, width, height);
    return await canvasToPng(canvas);
  } finally {
    bitmap.close();
  }
}

function downloadStory(image: Blob): void {
  const downloadUrl = URL.createObjectURL(image);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = STORY_FILE_NAME;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
}

export async function shareInstagramStoryForEditing(
  imageSource: string | Blob,
): Promise<InstagramNativeShareResult> {
  const sourceImage = typeof imageSource === 'string' ? await prepareInstagramImage(imageSource) : imageSource;
  const image = await fitImageToInstagramStory(sourceImage);
  const storyFile = new File([image], STORY_FILE_NAME, { type: 'image/png' });
  const shareData: ShareData = { files: [storyFile] };
  const canShareFile = typeof navigator.share === 'function'
    && (typeof navigator.canShare !== 'function' || navigator.canShare(shareData));

  if (canShareFile) {
    try {
      await navigator.share(shareData);
      return 'SHARED';
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return 'CANCELLED';
      // Alcuni browser espongono Web Share ma rifiutano i file: in quel caso
      // scarichiamo il PNG, così resta comunque possibile aprirlo in Instagram.
    }
  }

  downloadStory(image);
  return 'DOWNLOADED';
}
