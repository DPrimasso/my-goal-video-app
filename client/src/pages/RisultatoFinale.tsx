import { useEffect, useMemo, useRef, useState } from 'react';
import { PageTemplate } from '../components/layout';
import { InstagramPublishDialog } from '../components/instagram/InstagramPublishDialog';
import { Button, Input, Select } from '../components/ui';
import { getPlayer, players } from '../catalog';
import { getEndpoint } from '../config/environment';
import { useGeneratedImage } from '../hooks';
import { requestGeneratedImage } from '../services/imageApi';
import type { FinalResultImagePayload, Scorer } from '../types';
import './RisultatoFinale.css';

interface TeamScore {
  home: number;
  away: number;
}

interface SavedFinalResult {
  homeTeam: string;
  awayTeam: string;
  score: TeamScore;
  scorers: Scorer[];
}

const COOKIE_NAME = 'savedFinalResult';
const EMPTY_SCORE: TeamScore = { home: 0, away: 0 };
const isCasalpoglio = (teamName: string) => teamName.trim().toLocaleLowerCase('it-IT') === 'casalpoglio';

const sanitizeScore = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(99, Math.max(0, Math.trunc(value)))
    : 0
);

function readSavedFinalResult(): SavedFinalResult {
  const emptyState: SavedFinalResult = { homeTeam: '', awayTeam: '', score: EMPTY_SCORE, scorers: [] };
  const entry = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE_NAME}=`));
  if (!entry) return emptyState;

  try {
    const parsed = JSON.parse(decodeURIComponent(entry.slice(COOKIE_NAME.length + 1))) as Partial<SavedFinalResult>;
    const homeTeam = typeof parsed.homeTeam === 'string' ? parsed.homeTeam.slice(0, 80) : '';
    const awayTeam = typeof parsed.awayTeam === 'string' ? parsed.awayTeam.slice(0, 80) : '';
    const score = {
      home: sanitizeScore(parsed.score?.home),
      away: sanitizeScore(parsed.score?.away),
    };
    const casalpoglioGoals = isCasalpoglio(homeTeam) ? score.home : isCasalpoglio(awayTeam) ? score.away : 0;
    const savedScorers = Array.isArray(parsed.scorers) ? parsed.scorers : [];
    const scorers = Array.from({ length: casalpoglioGoals }, (_, index) => {
      const scorer = savedScorers[index];
      return {
        playerId: typeof scorer?.playerId === 'string' && getPlayer(scorer.playerId) ? scorer.playerId : '',
        minute: typeof scorer?.minute === 'number' && Number.isFinite(scorer.minute)
          ? Math.min(150, Math.max(0, Math.trunc(scorer.minute)))
          : 0,
      };
    });

    return { homeTeam, awayTeam, score, scorers };
  } catch {
    return emptyState;
  }
}

export default function RisultatoFinale() {
  const [saved] = useState(readSavedFinalResult);
  const [homeTeam, setHomeTeam] = useState(saved.homeTeam);
  const [awayTeam, setAwayTeam] = useState(saved.awayTeam);
  const [score, setScore] = useState<TeamScore>(saved.score);
  const [scorers, setScorers] = useState<Scorer[]>(saved.scorers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { url: generatedImageUrl, replace: replaceImage, reset: resetImage } = useGeneratedImage();
  const errorRef = useRef<HTMLDivElement>(null);

  const playerOptions = useMemo(() => players.map((player) => ({ value: player.id, label: player.shortName })) , []);
  const homeIsCasalpoglio = isCasalpoglio(homeTeam);
  const awayIsCasalpoglio = isCasalpoglio(awayTeam);
  const casalpoglioGoals = homeIsCasalpoglio ? score.home : awayIsCasalpoglio ? score.away : 0;

  useEffect(() => {
    const value = encodeURIComponent(JSON.stringify({ homeTeam, awayTeam, score, scorers }));
    document.cookie = `${COOKIE_NAME}=${value};max-age=31536000;path=/;SameSite=Lax`;
  }, [homeTeam, awayTeam, score, scorers]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const resizeScorers = (length: number) => {
    setScorers((current) => Array.from(
      { length },
      (_, index) => current[index] || { playerId: '', minute: 0 },
    ));
  };

  const updateTeam = (side: 'home' | 'away', teamName: string) => {
    const nextTeamName = teamName.slice(0, 80);
    const nextHomeTeam = side === 'home' ? nextTeamName : homeTeam;
    const nextAwayTeam = side === 'away' ? nextTeamName : awayTeam;
    const nextGoals = isCasalpoglio(nextHomeTeam)
      ? score.home
      : isCasalpoglio(nextAwayTeam) ? score.away : 0;
    if (side === 'home') setHomeTeam(nextTeamName);
    else setAwayTeam(nextTeamName);
    resizeScorers(nextGoals);
  };

  const updateScore = (side: 'home' | 'away', value: string) => {
    const numericValue = Math.min(99, Math.max(0, Number.parseInt(value, 10) || 0));
    const nextScore = { ...score, [side]: numericValue };
    setScore(nextScore);
    resizeScorers(homeIsCasalpoglio ? nextScore.home : awayIsCasalpoglio ? nextScore.away : 0);
  };

  const updateScorer = (index: number, field: keyof Scorer, value: string) => {
    setScorers((current) => current.map((scorer, scorerIndex) => {
      if (scorerIndex !== index) return scorer;
      return field === 'playerId'
        ? { ...scorer, playerId: value }
        : { ...scorer, minute: Math.min(150, Math.max(0, Number.parseInt(value, 10) || 0)) };
    }));
  };

  const buildScorerLines = (): string[] => {
    return scorers.flatMap((scorer) => {
      const player = getPlayer(scorer.playerId);
      return player && scorer.minute > 0 ? [`${player.shortName} ${scorer.minute}'`] : [];
    });
  };

  const validate = (): string | null => {
    const normalizedHomeTeam = homeTeam.trim();
    const normalizedAwayTeam = awayTeam.trim();
    if (!normalizedHomeTeam || !normalizedAwayTeam) return 'Inserisci entrambe le squadre.';
    if (normalizedHomeTeam.localeCompare(normalizedAwayTeam, 'it', { sensitivity: 'base' }) === 0) return 'Le due squadre devono essere differenti.';
    if (score.home < 0 || score.away < 0 || score.home > 99 || score.away > 99) return 'Il punteggio deve essere compreso tra 0 e 99.';
    if (scorers.some((scorer) => !scorer.playerId || scorer.minute < 1 || scorer.minute > 150)) {
      return 'Compila giocatore e minuto per ogni gol del Casalpoglio.';
    }
    return null;
  };

  const generate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: FinalResultImagePayload = {
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        homeScore: score.home,
        awayScore: score.away,
        scorerLines: buildScorerLines(),
        scorersUnder: homeIsCasalpoglio ? 'home' : awayIsCasalpoglio ? 'away' : 'home',
      };
      replaceImage(await requestGeneratedImage(getEndpoint('finalResult'), payload));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Errore durante la generazione del risultato finale.');
    } finally {
      setLoading(false);
    }
  };

  const summary = homeTeam && awayTeam
    ? `${homeTeam.trim()} ${score.home} – ${score.away} ${awayTeam.trim()}`
    : '';

  return (
    <PageTemplate title="Risultato finale" description="Squadre, punteggio e marcatori in una grafica 9:16." icon="🏆">
      <div className="result-container">
        <section className="card result-form-container" aria-label="Dati del risultato finale">
          <div className="teams-section">
            <Input id="final-home-team" label="Squadra casa" value={homeTeam} onChange={(value) => updateTeam('home', value)} placeholder="es. Casalpoglio" maxLength={80} required />
            <div className="vs-section"><div className="vs-text" aria-hidden="true">VS</div></div>
            <Input id="final-away-team" label="Squadra ospite" value={awayTeam} onChange={(value) => updateTeam('away', value)} placeholder="es. Castelletto" maxLength={80} required />
          </div>

          <fieldset className="score-section">
            <legend>Punteggio finale</legend>
            <div className="score-inputs">
              <Input label="Casa" value={score.home.toString()} onChange={(value) => updateScore('home', value)} type="number" min={0} max={99} required />
              <div className="score-separator" aria-hidden="true">–</div>
              <Input label="Ospite" value={score.away.toString()} onChange={(value) => updateScore('away', value)} type="number" min={0} max={99} required />
            </div>
          </fieldset>

          {casalpoglioGoals > 0 && (
            <section className="scorers-section" aria-labelledby="scorers-title">
              <h2 id="scorers-title">Marcatori Casalpoglio</h2>
              <div className="scorers-list">
                {scorers.map((scorer, index) => (
                  <div key={index} className="scorer-input">
                    <span className="scorer-label">Gol {index + 1}</span>
                    <div className="scorer-fields">
                      <Select ariaLabel={`Marcatore del gol ${index + 1}`} value={scorer.playerId} onChange={(value) => updateScorer(index, 'playerId', value)} options={playerOptions} required />
                      <Input label="Minuto" ariaLabel={`Minuto del gol ${index + 1}`} value={scorer.minute ? scorer.minute.toString() : ''} onChange={(value) => updateScorer(index, 'minute', value)} type="number" min={1} max={150} required />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {summary && <div className="match-summary" aria-live="polite">{summary}</div>}

          {error && <div ref={errorRef} tabIndex={-1} className="error-message" role="alert">⚠️ {error}</div>}
          <div className="result-actions">
            <Button onClick={generate} disabled={loading} loading={loading} size="large">{loading ? 'Generazione...' : '📷 Genera immagine 9:16'}</Button>
            {generatedImageUrl && <Button onClick={resetImage} variant="outline">Nuovo risultato</Button>}
          </div>
        </section>

        <section className="preview-section" aria-live="polite">
          {generatedImageUrl ? (
            <div className="final-result-image-preview">
              <div className="phone-frame"><div className="phone-frame-inner"><img src={generatedImageUrl} alt="Grafica del risultato finale" className="final-result-image" /></div></div>
              <p className="preview-meta">Formato 9:16 · pronto per Stories e Reels</p>
              <div className="image-actions">
                <Button onClick={() => window.open(generatedImageUrl, '_blank', 'noopener,noreferrer')}>Apri PNG</Button>
                <a className="download-link" href={generatedImageUrl} download="risultato-finale.png">Scarica PNG</a>
                <InstagramPublishDialog key={generatedImageUrl} imageUrl={generatedImageUrl} />
              </div>
            </div>
          ) : (
            <div className="preview-placeholder"><div className="placeholder-icon">🏆</div><h3>Anteprima risultato</h3><p>La grafica apparirà qui dopo la generazione.</p></div>
          )}
        </section>
      </div>
    </PageTemplate>
  );
}
