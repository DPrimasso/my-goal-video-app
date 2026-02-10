import { useEffect, useState } from 'react';

interface TeamScore {
  home: number;
  away: number;
}

export interface SavedGoal {
  playerId: string;
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
  minuteGoal: '',
  homeTeam: '',
  awayTeam: '',
  score: { home: 0, away: 0 },
};

export function useGoalFormState() {
  const [state, setState] = useState<SavedGoal>(initialState);

  // Load from cookie on mount
  useEffect(() => {
    const saved = getCookie(COOKIE_NAME);
    if (!saved) return;
    try {
      const parsed: SavedGoal = JSON.parse(decodeURIComponent(saved));
      setState((prev) => {
        const next = { ...prev };
        if (parsed.playerId) next.playerId = parsed.playerId;
        if (parsed.minuteGoal) next.minuteGoal = parsed.minuteGoal;
        if (parsed.homeTeam) next.homeTeam = parsed.homeTeam;
        if (parsed.awayTeam) next.awayTeam = parsed.awayTeam;
        if (parsed.score) next.score = parsed.score;
        return next;
      });
    } catch (err) {
      console.error('Errore nel caricamento dei dati salvati:', err);
    }
  }, []);

  // Save to cookie when state changes
  useEffect(() => {
    const encoded = encodeURIComponent(JSON.stringify(state));
    setCookie(COOKIE_NAME, encoded, COOKIE_DAYS);
  }, [state]);

  return { state, setState };
}
