import { APP_CONFIG } from '../config/environment';
import { 
  GoalVideoRequest, 
  FormationVideoRequest,
  FinalResultVideoRequest,
  VideoGenerationResponse, 
  VideoGenerationStatus 
} from '../types';
import { localVideoService } from './localVideoService';
import { isDevelopment, isProduction } from '../config/environment';

class VideoService {
  private config = APP_CONFIG;

  async startGoalVideoGeneration(request: GoalVideoRequest): Promise<VideoGenerationResponse> {

    if (isDevelopment()) {
      console.log("ISDEV:", isDevelopment());
    }

    // Check if we're in development mode
    if (isDevelopment()) {
      // For local development, generate video locally
      const filename = await localVideoService.generateGoalVideo(request);
      
      // Return a mock response for local generation
      return {
        bucketName: 'local',
        renderId: filename,
        localFile: filename,
      };
    }

    // For production, validate Lambda URLs are configured
    if (isProduction()) {
      if (!this.config.startRenderUrl) {
        throw new Error('Lambda start render URL not configured for production environment');
      }
    }

    // For production, use Lambda function
    const response = await fetch(this.config.startRenderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compositionId: 'GoalComp',
        inputProps: request,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Errore nell\'avvio della generazione video');
    }

    return response.json();
  }

  async startFormationVideoGeneration(request: FormationVideoRequest): Promise<VideoGenerationResponse> {
    if (isDevelopment()) {
      console.log("ISDEV - Formation:", isDevelopment());
    }

    // Check if we're in development mode
    if (isDevelopment()) {
      // For local development, generate video locally
      const filename = await localVideoService.generateFormationVideo(request);
      
      // Return a mock response for local generation
      return {
        bucketName: 'local',
        renderId: filename,
        localFile: filename,
      };
    }

    // For production, validate Lambda URLs are configured
    if (isProduction()) {
      if (!this.config.startRenderUrl) {
        throw new Error('Lambda start render URL not configured for production environment');
      }
    }

    // For production, use Lambda function
    const response = await fetch(this.config.startRenderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compositionId: 'FormationComp',
        inputProps: request,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Errore nell\'avvio della generazione video formazione');
    }

    return response.json();
  }

  async startFinalResultVideoGeneration(request: FinalResultVideoRequest): Promise<VideoGenerationResponse> {
    if (isDevelopment()) {
      console.log("ISDEV - Final Result:", isDevelopment());
    }

    // Check if we're in development mode
    if (isDevelopment()) {
      // For local development, generate video locally
      const filename = await localVideoService.generateFinalResultVideo(request);
      
      // Return a mock response for local generation
      return {
        bucketName: 'local',
        renderId: filename,
        localFile: filename,
      };
    }

    // For production, validate Lambda URLs are configured
    if (isProduction()) {
      if (!this.config.startRenderUrl) {
        throw new Error('Lambda start render URL not configured for production environment');
      }
    }

    // For production, use Lambda function
    const response = await fetch(this.config.startRenderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compositionId: 'FinalResultComp',
        inputProps: request,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Errore nell\'avvio della generazione video risultato finale');
    }

    return response.json();
  }

  async getVideoGenerationStatus(bucketName: string, renderId: string): Promise<VideoGenerationStatus> {
    // If it's a local generation, get status from local service
    if (bucketName === 'local') {
      const status = localVideoService.getRenderStatus(renderId);
      
      if (status) {
        return {
          overallProgress: status.overallProgress,
          outputFile: status.outputFile,
          outKey: status.outKey,
          outBucket: status.outBucket,
          errors: status.errors,
        };
      }
      
      // Fallback to completed status if not found
      return {
        overallProgress: 1,
        outputFile: renderId,
        outKey: renderId,
        outBucket: 'local',
      };
    }

    // For production, validate Lambda URLs are configured
    if (isProduction()) {
      if (!this.config.renderStatusUrl) {
        throw new Error('Lambda render status URL not configured for production environment');
      }
    }

    // For production, use Lambda function
    const url = new URL(this.config.renderStatusUrl);
    url.searchParams.set('bucketName', bucketName);
    url.searchParams.set('renderId', renderId);

    const response = await fetch(url.toString(), { method: 'GET' });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Errore nel recupero dello stato');
    }

    return response.json();
  }

  buildVideoUrl(status: VideoGenerationStatus, bucketName: string): string | null {
    // Se outputFile è già una URL assoluta, usala così com'è
    if (typeof status.outputFile === 'string' && /^https?:\/\//i.test(status.outputFile)) {
      return status.outputFile;
    }

    // If it's a local file, return the local path
    if (bucketName === 'local' && status.outputFile) {
      return `file://${status.outputFile}`;
    }

    // For Lambda generation, return the outputFile as is
    return status.outputFile || null;
  }

  makeAssetUrl(assetPath: string): string {
    if (!assetPath) return assetPath;
    if (/^https?:\/\//i.test(assetPath)) return assetPath;
    
    // For local development, return as is
    return assetPath;
  }

  async downloadVideo(videoUrl: string, filename: string): Promise<void> {
    try {
      const response = await fetch(videoUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      // Fallback: apri in nuova scheda
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    }
  }
}

export const videoService = new VideoService();
