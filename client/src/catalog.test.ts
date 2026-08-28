import { describe, expect, it } from 'vitest';
import { fallbackPlayerAssetKey, getPlayer, players, teams } from './catalog';

describe('catalogo condiviso', () => {
  it('espone ID giocatore univoci', () => {
    expect(new Set(players.map((player) => player.id)).size).toBe(players.length);
  });

  it('usa il fallback soltanto per le cinque fotografie mancanti', () => {
    expect(players.filter((player) => !player.assetKey).map((player) => player.id)).toEqual([
      'lorenzo_campagnari',
      'saif_ardhaoui',
      'vincenzo_marino',
      'andrea_serpellini',
      'davide_sipolo',
    ]);
    expect(fallbackPlayerAssetKey).toBe('players/player-fallback.svg');
  });

  it('fornisce lo stesso dato a tutte le pagine', () => {
    expect(getPlayer('daniele_primasso')?.shortName).toBe('Primasso');
    expect(teams.some((team) => team.id === 'casalpoglio')).toBe(true);
  });
});
