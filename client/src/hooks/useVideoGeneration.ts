import { useState, useCallback } from 'react';
import { videoService } from '../services/videoService';
import { GoalVideoRequest } from '../types';
import { APP_CONFIG } from '../config/environment';

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

        throw new Error('Local video generation failed - no valid URL generated');
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

      setLoading(false); // Set loading to false on timeout
      throw new Error('Timeout in attesa del render');
    } catch (err: any) {
      const errorMessage = err?.message || 'Errore nella generazione del video';
      setError(errorMessage);
      console.error('Video generation error:', err);
      setLoading(false); // Set loading to false only on error
    }
    // Note: For local generation, loading is set to false in the success path
    // For Lambda generation, loading will be set to false in the finally block below
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
