import { APP_CONFIG } from '../config/environment';
import { 
  GoalVideoRequest, 
  FormationVideoRequest,
  FinalResultVideoRequest,
  FinalResultVideoFormattedProps,
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

  private formatFinalResultData(request: FinalResultVideoRequest): FinalResultVideoFormattedProps {
    console.log('🔍 formatFinalResultData - Input request:', JSON.stringify(request, null, 2));
    
    // Helper function to get team info
    const getTeamInfo = (teamId: string) => {
      const teamNames: Record<string, string> = {
        'casalpoglio': 'Casalpoglio',
        'amatori_club': 'Amatori Club',
        'team_3': 'Team 3',
        'team_4': 'Team 4'
      };
      
      const teamLogos: Record<string, string> = {
        'casalpoglio': 'teams/casalpoglio.png',
        'amatori_club': 'teams/amatori_club.png',
        'team_3': 'teams/logo192.png',
        'team_4': 'teams/logo192.png'
      };
      
      return {
        name: teamNames[teamId] || teamId,
        logo: teamLogos[teamId] || 'logo192.png'
      };
    };
    
    // Helper function to get player surname by ID
    const getPlayerSurname = (playerId: string) => {
      // Complete player mapping from players.ts with surnames only
      const playerSurnames: Record<string, string> = {
        'davide_fava': 'Fava',
        'lorenzo_campagnari': 'Campagnari',
        'davide_scalmana': 'Scalmana',
        'saif_ardhaoui': 'Ardhaoui',
        'nicolo_castellini': 'Castellini',
        'andrea_contesini': 'Contesini',
        'davide_di_roberto': 'Di Roberto',
        'francesco_gabusi': 'Gabusi',
        'massimiliano_gandellini': 'Gandellini',
        'lorenzo_gobbi': 'Gobbi',
        'antonio_inglese': 'Inglese',
        'vase_jakimovski': 'Jakimovski',
        'filippo_lodetti': 'Lodetti',
        'braian_marchi': 'Marchi',
        'vincenzo_marino': 'Marino',
        'rosario_nastasi': 'Nastasi',
        'david_perosi': 'Perosi',
        'michael_pezzi': 'Pezzi',
        'lorenzo_piccinelli': 'Piccinelli',
        'matteo_pinelli': 'Pinelli',
        'sebastiano_pretto': 'Pretto',
        'daniele_primasso': 'Primasso',
        'cristian_ramponi': 'Ramponi',
        'fabio_rampulla': 'Rampulla',
        'daniele_rossetto': 'Rossetto',
        'andrea_serpellini': 'Serpellini',
        'davide_sipolo': 'Sipolo',
        'marco_turini': 'Turini',
        'marco_vaccari': 'Vaccari',
        'nathan_gorgaini': 'Gorgaini',
        'alberto_viola': 'Viola',
      };
      return playerSurnames[playerId] || playerId;
    };
    
    // Convert the data format
    const homeTeamInfo = getTeamInfo(request.homeTeam);
    const awayTeamInfo = getTeamInfo(request.awayTeam);
    
    const isCasalpoglioHome = request.homeTeam === 'casalpoglio';
    const isCasalpoglioAway = request.awayTeam === 'casalpoglio';
    
    // Get scorer names with minutes for Casalpoglio
    const casalpoglioScorerNames = (request.casalpoglioScorers || [])
      .map(scorer => {
        const surname = getPlayerSurname(scorer.playerId);
        const minute = scorer.minute;
        return `${surname} ${minute}'`;
      })
      .filter(name => name && name !== 'Unknown Player');
    
    // Return the converted props in the format expected by FinalResultVideo
    const result = {
      teamA: homeTeamInfo,  // Team A is always home team
      teamB: awayTeamInfo,  // Team B is always away team
      scoreA: request.score?.home || 0,   // Score A is home score
      scoreB: request.score?.away || 0,   // Score B is away score
      scorers: casalpoglioScorerNames,
      casalpoglioIsHome: isCasalpoglioHome,
      casalpoglioIsAway: isCasalpoglioAway,
      // Add logo paths using the same logic as videoService.makeAssetUrl()
      teamALogoPath: homeTeamInfo.logo,
      teamBLogoPath: awayTeamInfo.logo,
    };
    
    console.log('🔍 formatFinalResultData - Output result:', JSON.stringify(result, null, 2));
    return result;
  }

  async startFinalResultVideoGeneration(request: FinalResultVideoRequest): Promise<VideoGenerationResponse> {
    if (isDevelopment()) {
      console.log("ISDEV - Final Result:", isDevelopment());
    }

    // Format the data for the composition
    const formattedProps = this.formatFinalResultData(request);

    // Check if we're in development mode
    if (isDevelopment()) {
      // For local development, generate video locally
      const filename = await localVideoService.generateFinalResultVideo(formattedProps);
      
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
        inputProps: formattedProps,
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

    const result = await response.json();
    
    // Extract the actual status from the Lambda response
    if (result.success && result.status) {
      return result.status;
    }
    
    return result;
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

    // For Lambda generation, check if we have outKey (Remotion's output key)
    if (bucketName !== 'local' && status.outKey) {
      const region = process.env.REACT_APP_S3_REGION || 'eu-west-1';
      const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${status.outKey}`;
      return s3Url;
    }

    // For Lambda generation, check if we have outputFile
    if (bucketName !== 'local' && status.outputFile) {
      const region = process.env.REACT_APP_S3_REGION || 'eu-west-1';
      const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${status.outputFile}`;
      return s3Url;
    }

    return null;
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
