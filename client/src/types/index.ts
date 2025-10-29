export interface Player {
  id: string;
  name: string;
  image: string;
  position?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
}


export interface GoalVideoRequest {
  playerId?: string;
  playerName: string;
  minuteGoal: string | number;
  goalClip?: string;
  s3PlayerUrl?: string;
  overlayImage?: string;
  partialScore?: string;
  textColor?: string;
  titleSize?: number;
  playerSize?: number;
  textShadow?: string;
}

export interface FormationPlayer {
  name: string;
  image: string;
}

export interface FormationVideoRequest {
  goalkeeper: FormationPlayer;
  defenders: (FormationPlayer | null)[];
  midfielders: (FormationPlayer | null)[];
  attackingMidfielders: (FormationPlayer | null)[];
  forwards: (FormationPlayer | null)[];
}

export interface FinalResultVideoRequest {
  homeTeam: string;
  awayTeam: string;
  score: {
    home: number;
    away: number;
  };
  casalpoglioScorers: Scorer[];
}

export interface FinalResultVideoFormattedProps {
  teamA: {
    name: string;
    logo: string;
  };
  teamB: {
    name: string;
    logo: string;
  };
  scoreA: number;
  scoreB: number;
  scorers: string[];
  casalpoglioIsHome: boolean;
  casalpoglioIsAway: boolean;
  teamALogoPath: string;
  teamBLogoPath: string;
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
  localFile?: string; // For local development
}

export interface AppConfig {
  environment: string;
  startRenderUrl: string;
  renderStatusUrl: string;
  pollIntervalMs: number;
  maxPollAttempts: number;
}

export interface Scorer {
  playerId: string;
  minute: number;
}

export interface LineupPlayer {
  playerId: string;
  playerName: string;
  number: number;
  isCaptain: boolean;
}

export interface LineupRequest {
  players: LineupPlayer[];
  opponentTeam: string;
}