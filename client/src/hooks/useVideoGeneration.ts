import { useState, useCallback } from 'react';
import { videoService } from '../services/videoService';
import { GoalVideoRequest } from '../types';

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
      // 1. Avvia la generazione
      const startResponse = await videoService.startGoalVideoGeneration(request);
      const { bucketName, renderId } = startResponse;

      // 2. Polling dello stato
      let attempts = 0;
      const maxAttempts = 300; // Configurabile
      const pollInterval = 2000; // Configurabile

      while (attempts < maxAttempts) {
        attempts++;

        const status = await videoService.getVideoGenerationStatus(bucketName, renderId);
        
        // Aggiorna il progresso
        if (status.overallProgress !== undefined) {
          const progressPercent = Math.round(status.overallProgress * 100);
          setProgress(progressPercent);
        }

        // Controlla errori
        if (status.errors && status.errors.length > 0) {
          const errorMessage = status.errors
            .map((e: any) => typeof e === 'string' ? e : e?.message || e?.stack || JSON.stringify(e))
            .join(' | ');
          throw new Error(errorMessage);
        }

        // Controlla se il video è pronto
        const videoUrl = videoService.buildVideoUrl(status, bucketName);
        if (videoUrl) {
          setGeneratedUrl(videoUrl);
          setProgress(100);
          return;
        }

        // Attendi prima del prossimo poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      throw new Error('Timeout in attesa del render');
    } catch (err: any) {
      const errorMessage = err?.message || 'Errore nella generazione del video';
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
