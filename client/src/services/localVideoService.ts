import { GoalVideoRequest, FormationVideoRequest, FinalResultVideoRequest } from '../types';
import { APP_CONFIG } from '../config/environment';
import { isDevelopment } from '../config/environment';

interface LocalRenderStatus {
  overallProgress: number;
  outputFile?: string;
  outKey?: string;
  outBucket: string;
  errors?: string[];
}

class LocalVideoService {
  private renders: Map<string, LocalRenderStatus> = new Map();
  private serverUrl: string;

  constructor() {
    // Use local Express server for real video generation
    this.serverUrl = APP_CONFIG.serverUrls.videoServer(APP_CONFIG.ports.videoServer);
  }

  async generateGoalVideo(request: GoalVideoRequest): Promise<string> {
    try {
      if (isDevelopment()) {
        console.log('Starting local video generation with Express server...');
        console.log('Request data:', request);
      }
      
      // Generate a unique render ID
      const renderId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Initialize render status
      this.renders.set(renderId, {
        overallProgress: 0,
        outBucket: 'local',
        outputFile: '',
        outKey: renderId,
      });

      // Wait for the render process to complete
      await this.startRenderProcess(renderId, request);
      
      return renderId;
    } catch (error: unknown) {
      console.error('Error in local video generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate local video: ${errorMessage}`);
    }
  }

  async generateFormationVideo(request: FormationVideoRequest): Promise<string> {
    try {
      if (isDevelopment()) {
        console.log('Starting local formation video generation with Express server...');
        console.log('Request data:', request);
      }
      
      // Generate a unique render ID
      const renderId = `local-formation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Initialize render status
      this.renders.set(renderId, {
        overallProgress: 0,
        outBucket: 'local',
        outputFile: '',
        outKey: renderId,
      });

      // Wait for the render process to complete
      await this.startFormationRenderProcess(renderId, request);
      
      return renderId;
    } catch (error: unknown) {
      console.error('Error in local formation video generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate local formation video: ${errorMessage}`);
    }
  }

  async generateFinalResultVideo(request: FinalResultVideoRequest): Promise<string> {
    try {
      if (isDevelopment()) {
        console.log('Starting local final result video generation with Express server...');
        console.log('Request data:', request);
      }
      
      // Generate a unique render ID
      const renderId = `local-final-result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Initialize render status
      this.renders.set(renderId, {
        overallProgress: 0,
        outBucket: 'local',
        outputFile: '',
        outKey: renderId,
      });

      // Wait for the render process to complete
      await this.startFinalResultRenderProcess(renderId, request);
      
      return renderId;
    } catch (error: unknown) {
      console.error('Error in local final result video generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to generate local final result video: ${errorMessage}`);
    }
  }

  private async startRenderProcess(renderId: string, request: GoalVideoRequest): Promise<void> {
    try {
      // Update progress to 10%
      this.updateProgress(renderId, 0.1);

      if (isDevelopment()) {
        console.log('Sending request to local Express server...');
      }
      
      // Send request to local Express server for real video generation
      const response = await fetch(`${this.serverUrl}/api/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: request.playerName,
          minuteGoal: request.minuteGoal,
          goalClip: request.goalClip,
          overlayImage: request.overlayImage,
          s3PlayerUrl: request.s3PlayerUrl,
          partialScore: request.partialScore,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to render video');
      }

      const result = await response.json();
      
      // Update final status - IMPORTANT: update the existing status, don't overwrite it
      const currentStatus = this.renders.get(renderId);
      if (currentStatus) {
        this.renders.set(renderId, {
          ...currentStatus,
          overallProgress: 1.0,
          outputFile: result.video,
          outKey: result.filename,
        });
      } else {
        // Fallback if status not found
        this.renders.set(renderId, {
          overallProgress: 1.0,
          outputFile: result.video,
          outKey: result.filename,
          outBucket: 'local',
        });
      }

      if (isDevelopment()) {
        console.log(`Video generated successfully: ${result.video}`);
      }
    } catch (error: unknown) {
      console.error('Error in render process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update status with error
      this.renders.set(renderId, {
        overallProgress: 0,
        outBucket: 'local',
        errors: [errorMessage],
      });
    }
  }

  private async startFormationRenderProcess(renderId: string, request: FormationVideoRequest): Promise<void> {
    try {
      // Update progress to 10%
      this.updateProgress(renderId, 0.1);

      if (isDevelopment()) {
        console.log('Sending formation request to local Express server...');
      }
      
      // Send request to local Express server for real video generation
      const response = await fetch(`${this.serverUrl}/api/formation-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalkeeper: request.goalkeeper,
          defenders: request.defenders,
          midfielders: request.midfielders,
          attackingMidfielders: request.attackingMidfielders,
          forwards: request.forwards,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to render formation video');
      }

      const result = await response.json();
      
      // Update final status - IMPORTANT: update the existing status, don't overwrite it
      const currentStatus = this.renders.get(renderId);
      if (currentStatus) {
        this.renders.set(renderId, {
          ...currentStatus,
          overallProgress: 1.0,
          outputFile: result.video,
          outKey: result.filename,
        });
      } else {
        // Fallback if status not found
        this.renders.set(renderId, {
          overallProgress: 1.0,
          outputFile: result.video,
          outKey: result.filename,
          outBucket: 'local',
        });
      }

      if (isDevelopment()) {
        console.log(`Formation video generated successfully: ${result.video}`);
      }
    } catch (error: unknown) {
      console.error('Error in formation render process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update status with error
      this.renders.set(renderId, {
        overallProgress: 0,
        outBucket: 'local',
        errors: [errorMessage],
      });
    }
  }

  private async startFinalResultRenderProcess(renderId: string, request: FinalResultVideoRequest): Promise<void> {
    try {
      // Update progress to 10%
      this.updateProgress(renderId, 0.1);

      if (isDevelopment()) {
        console.log('Sending final result request to local Express server...');
      }
      
      // Send request to local Express server for real video generation
      const response = await fetch(`${this.serverUrl}/api/final-result-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeTeam: request.homeTeam,
          awayTeam: request.awayTeam,
          score: request.score,
          casalpoglioScorers: request.casalpoglioScorers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to render final result video');
      }

      const result = await response.json();
      
      // Update final status - IMPORTANT: update the existing status, don't overwrite it
      const currentStatus = this.renders.get(renderId);
      if (currentStatus) {
        this.renders.set(renderId, {
          ...currentStatus,
          overallProgress: 1.0,
          outputFile: result.video,
          outKey: result.filename,
        });
      } else {
        // Fallback if status not found
        this.renders.set(renderId, {
          overallProgress: 1.0,
          outputFile: result.video,
          outKey: result.filename,
          outBucket: 'local',
        });
      }

      if (isDevelopment()) {
        console.log(`Final result video generated successfully: ${result.video}`);
      }
    } catch (error: unknown) {
      console.error('Error in final result render process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update status with error
      this.renders.set(renderId, {
        overallProgress: 0,
        outBucket: 'local',
        errors: [errorMessage],
      });
    }
  }

  private updateProgress(renderId: string, progress: number): void {
    const currentStatus = this.renders.get(renderId);
    if (currentStatus) {
      this.renders.set(renderId, {
        ...currentStatus,
        overallProgress: progress,
      });
    }
  }

  getRenderStatus(renderId: string): LocalRenderStatus | null {
    return this.renders.get(renderId) || null;
  }

  async downloadVideo(filename: string): Promise<void> {
    try {
      if (isDevelopment()) {
        console.log(`Local video ready for download: ${filename}`);
        console.log('Video is available at:', `${this.serverUrl}/videos/${filename}`);
      }
    } catch (error: unknown) {
      console.error('Error downloading local video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to download local video: ${errorMessage}`);
    }
  }
}

export const localVideoService = new LocalVideoService();
