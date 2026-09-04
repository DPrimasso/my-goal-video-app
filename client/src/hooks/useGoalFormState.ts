import { useEffect, useState } from 'react';
import type { GoalCount } from '../types';

interface TeamScore {
  home: number;
  away: number;
}

export interface SavedGoal {
  playerId: string;
  goalCount: GoalCount;
  minuteGoal: string;
  homeTeam: string;
  awayTeam: string;
  score: TeamScore;
}

const COOKIE_NAME = 'savedGoal';
const COOKIE_DAYS = 365;

function setCookie(name: string, value: string, days: number = COOKIE_DAYS) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.startsWith(nameEQ)) return c.substring(nameEQ.length);
  }
  return null;
}

const initialState: SavedGoal = {
  playerId: '',
  goalCount: 1,
  minuteGoal: '',
  homeTeam: '',
  awayTeam: '',
  score: { home: 0, away: 0 },
};

function readSavedGoal(): SavedGoal {
  const saved = getCookie(COOKIE_NAME);
  if (!saved) return initialState;

  try {
    const parsed = JSON.parse(decodeURIComponent(saved)) as Partial<SavedGoal>;
    return {
      playerId: typeof parsed.playerId === 'string' ? parsed.playerId : '',
      goalCount: parsed.goalCount === 2 || parsed.goalCount === 3 ? parsed.goalCount : 1,
      minuteGoal: typeof parsed.minuteGoal === 'string' ? parsed.minuteGoal : '',
      homeTeam: typeof parsed.homeTeam === 'string' ? parsed.homeTeam : '',
      awayTeam: typeof parsed.awayTeam === 'string' ? parsed.awayTeam : '',
      score: parsed.score && Number.isFinite(parsed.score.home) && Number.isFinite(parsed.score.away)
        ? parsed.score
        : initialState.score,
    };
  } catch (err) {
    console.error('Errore nel caricamento dei dati salvati:', err);
    return initialState;
  }
}

export function useGoalFormState() {
  const [state, setState] = useState<SavedGoal>(readSavedGoal);

  // Save to cookie when state changes
  useEffect(() => {
    const encoded = encodeURIComponent(JSON.stringify(state));
    setCookie(COOKIE_NAME, encoded, COOKIE_DAYS);
  }, [state]);

  return { state, setState };
}
