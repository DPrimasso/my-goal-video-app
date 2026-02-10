import { useState, useCallback } from 'react';
import { videoService } from '../services/videoService';
import { GoalVideoRequest } from '../types';
import { pollForVideo } from '../utils/videoPolling';

interface UseVideoGenerationReturn {
  loading: boolean;
  progress: number;
  generatedUrl: string | null;
  error: string | null;
  generateVideo: (request: GoalVideoRequest) => Promise<void>;
  reset: () => void;
}

export const useVideoGeneration = (): UseVideoGenerationReturn => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = useCallback(async (request: GoalVideoRequest) => {
    setLoading(true);
    setProgress(0);
    setGeneratedUrl(null);
    setError(null);

    try {
      const startResponse = await videoService.startGoalVideoGeneration(request);
      const { bucketName, renderId } = startResponse;

      const videoUrl = await pollForVideo(
        bucketName,
        renderId,
        { setProgress },
        {
          localErrorMessage: 'Local video generation failed - no valid URL generated',
          timeoutMessage: 'Timeout in attesa del render',
        }
      );
      setGeneratedUrl(videoUrl);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella generazione del video';
      setError(errorMessage);
      console.error('Video generation error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setProgress(0);
    setGeneratedUrl(null);
    setError(null);
  }, []);

  return {
    loading,
    progress,
    generatedUrl,
    error,
    generateVideo,
    reset,
  };
};
