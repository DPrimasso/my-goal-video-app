import catalogData from '@shared/catalog.json';

export interface Player {
  id: string;
  displayName: string;
  shortName: string;
  assetKey: string | null;
  defaultNumber?: number;
}

export interface Team {
  id: string;
  displayName: string;
}

export const players = catalogData.players as Player[];
export const teams = catalogData.teams as Team[];
export const fallbackPlayerAssetKey = catalogData.fallbackPlayerAssetKey;

export function getPlayer(playerId: string): Player | undefined {
  return players.find((player) => player.id === playerId);
}

export function getTeam(teamId: string): Team | undefined {
  return teams.find((team) => team.id === teamId);
}
