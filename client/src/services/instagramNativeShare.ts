import { prepareInstagramImage } from './instagramApi';

export type InstagramNativeShareResult = 'SHARED' | 'CANCELLED' | 'DOWNLOADED';

const STORY_FILE_NAME = 'casalpoglio-storia.png';

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
  const image = typeof imageSource === 'string' ? await prepareInstagramImage(imageSource) : imageSource;
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
