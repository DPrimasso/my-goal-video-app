import { APP_CONFIG } from '../constants/config';
import { 
  GoalVideoRequest, 
  VideoGenerationResponse, 
  VideoGenerationStatus 
} from '../types';

class VideoService {
  private config = APP_CONFIG;

  async startGoalVideoGeneration(request: GoalVideoRequest): Promise<VideoGenerationResponse> {
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

  async getVideoGenerationStatus(bucketName: string, renderId: string): Promise<VideoGenerationStatus> {
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

    // Altrimenti costruisci l'URL S3
    const key = status.outKey || status.outputFile;
    if (!key) return null;

    const bucket = status.outBucket || bucketName;
    if (!bucket) return null;

    const base = this.config.s3PublicBase || `https://${bucket}.s3.${this.config.awsRegion}.amazonaws.com`;
    return `${base}/${key}`;
  }

  makeAssetUrl(assetPath: string): string {
    if (!assetPath) return assetPath;
    if (/^https?:\/\//i.test(assetPath)) return assetPath;
    if (!this.config.assetBucket) return assetPath;
    
    const key = assetPath.replace(/^\/+/, '');
    return `https://${this.config.assetBucket}.s3.${this.config.awsRegion}.amazonaws.com/${key}`;
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
