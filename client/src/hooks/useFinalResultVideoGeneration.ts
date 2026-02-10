import { useState, useCallback } from 'react';
import { videoService } from '../services/videoService';
import { FinalResultVideoRequest } from '../types';
import { pollForVideo } from '../utils/videoPolling';

interface UseFinalResultVideoGenerationReturn {
  loading: boolean;
  progress: number;
  generatedUrl: string | null;
  error: string | null;
  generateVideo: (request: FinalResultVideoRequest) => Promise<void>;
  reset: () => void;
}

export const useFinalResultVideoGeneration = (): UseFinalResultVideoGenerationReturn => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = useCallback(async (request: FinalResultVideoRequest) => {
    setLoading(true);
    setProgress(0);
    setGeneratedUrl(null);
    setError(null);

    try {
      const startResponse = await videoService.startFinalResultVideoGeneration(request);
      const { bucketName, renderId } = startResponse;

      const videoUrl = await pollForVideo(
        bucketName,
        renderId,
        { setProgress },
        {
          localErrorMessage: 'Local final result video generation failed - no valid URL generated',
          timeoutMessage: 'Timeout: la generazione del video ha impiegato troppo tempo',
        }
      );
      setGeneratedUrl(videoUrl);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto durante la generazione del video';
      setError(errorMessage);
      console.error('Error in final result video generation:', err);
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
