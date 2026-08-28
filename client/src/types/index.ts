export interface Scorer {
  playerId: string;
  minute: number;
}

export interface LineupPlayer {
  playerId: string;
  number: number;
  isCaptain: boolean;
}

export interface LineupImagePayload {
  players: LineupPlayer[];
  opponentTeam: string;
}

export interface GoalImagePayload {
  playerId: string;
  minuteGoal: number;
  homeTeam: string;
  homeScore: number;
  awayTeam: string;
  awayScore: number;
}

export interface FinalResultImagePayload {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  scorerLines: string[];
  scorersUnder: 'home' | 'away';
}
