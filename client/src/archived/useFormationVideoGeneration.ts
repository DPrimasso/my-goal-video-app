import { useState, useCallback } from 'react';
import { videoService } from '../services/videoService';
import { FormationVideoRequest } from '../types';
import { APP_CONFIG } from '../config/environment';

interface UseFormationVideoGenerationReturn {
  loading: boolean;
  progress: number;
  generatedUrl: string | null;
  error: string | null;
  generateVideo: (request: FormationVideoRequest) => Promise<void>;
  reset: () => void;
}

export const useFormationVideoGeneration = (): UseFormationVideoGenerationReturn => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateVideo = useCallback(async (request: FormationVideoRequest) => {
    setLoading(true);
    setProgress(0);
    setGeneratedUrl(null);
    setError(null);

    try {
      // 1. Avvia la generazione
      const startResponse = await videoService.startFormationVideoGeneration(request);
      const { bucketName, renderId } = startResponse;

      // Check if it's local generation
      if (bucketName === 'local') {
        // For local generation, the video is already ready, just get the final status
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
        
        if (videoUrl && status.overallProgress !== undefined && status.overallProgress >= 1) {
          // Set URL immediately for local generation
          setGeneratedUrl(videoUrl);
          setProgress(100);
          setLoading(false); // Set loading to false here for local generation
          
          return;
        }

        throw new Error('Local formation video generation failed - no valid URL generated');
      }

      // 2. Polling dello stato per Lambda generation
      let attempts = 0;
      const maxAttempts = APP_CONFIG.maxPollAttempts;
      const pollInterval = APP_CONFIG.pollIntervalMs;

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
          setLoading(false); // Set loading to false for Lambda generation
          return;
        }

        // Attendi prima del prossimo poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      throw new Error('Timeout: la generazione del video ha impiegato troppo tempo');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto durante la generazione del video';
      setError(errorMessage);
      setLoading(false);
      console.error('Error in formation video generation:', err);
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
