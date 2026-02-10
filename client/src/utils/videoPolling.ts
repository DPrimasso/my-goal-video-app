import { videoService } from '../services/videoService';
import { APP_CONFIG } from '../config/environment';

function formatErrors(errors: unknown[]): string {
  return errors
    .map((e: unknown) =>
      typeof e === 'string' ? e : (e as { message?: string })?.message || (e as { stack?: string })?.stack || JSON.stringify(e)
    )
    .join(' | ');
}

export interface PollCallbacks {
  setProgress: (percent: number) => void;
}

export interface PollOptions {
  localErrorMessage?: string;
  timeoutMessage?: string;
}

/**
 * Polls for video generation completion. Returns video URL on success, throws on error.
 */
export async function pollForVideo(
  bucketName: string,
  renderId: string,
  callbacks: PollCallbacks,
  options: PollOptions = {}
): Promise<string> {
  const { setProgress } = callbacks;
  const {
    localErrorMessage = 'Local video generation failed - no valid URL generated',
    timeoutMessage = 'Timeout in attesa del render',
  } = options;

  if (bucketName === 'local') {
    const status = await videoService.getVideoGenerationStatus(bucketName, renderId);

    if (status.overallProgress !== undefined) {
      setProgress(Math.round(status.overallProgress * 100));
    }

    if (status.errors && status.errors.length > 0) {
      throw new Error(formatErrors(status.errors));
    }

    const videoUrl = videoService.buildVideoUrl(status, bucketName);
    if (videoUrl && status.overallProgress !== undefined && status.overallProgress >= 1) {
      setProgress(100);
      return videoUrl;
    }

    throw new Error(localErrorMessage);
  }

  const maxAttempts = APP_CONFIG.maxPollAttempts;
  const pollInterval = APP_CONFIG.pollIntervalMs;

  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const status = await videoService.getVideoGenerationStatus(bucketName, renderId);

    if (status.overallProgress !== undefined) {
      setProgress(Math.round(status.overallProgress * 100));
    }

    if (status.errors && status.errors.length > 0) {
      throw new Error(formatErrors(status.errors));
    }

    const videoUrl = videoService.buildVideoUrl(status, bucketName);
    if (videoUrl) {
      setProgress(100);
      return videoUrl;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(timeoutMessage);
}
