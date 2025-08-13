export interface Player {
  id: string;
  name: string;
  image: string;
  position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
}

export interface Formation {
  goalkeeper: string;
  defenders: string[];
  midfielders: string[];
  attackingMidfielders: string[];
  forwards: string[];
}

export interface GoalVideoRequest {
  playerId: string;
  playerName: string;
  minuteGoal: number;
  s3PlayerUrl: string;
  overlayImage: string;
  partialScore: string;
}

// Nuova interfaccia per la richiesta semplificata
export interface SimplifiedGoalVideoRequest {
  playerId: string;
  playerName: string;
  minuteGoal: number;
  partialScore: string;
  playerImage: string; // Solo il nome del file
  overlayImage: string; // Solo il nome del file
}

export interface VideoGenerationStatus {
  overallProgress?: number;
  outputFile?: string;
  outKey?: string;
  outBucket?: string;
  errors?: any[];
  error?: string;
}

export interface VideoGenerationResponse {
  bucketName: string;
  renderId: string;
  error?: string;
}

export interface AppConfig {
  startRenderUrl: string;
  renderStatusUrl: string;
  awsRegion: string;
  s3PublicBase: string;
  assetBucket: string;
  pollIntervalMs: number;
  maxPollAttempts: number;
}
