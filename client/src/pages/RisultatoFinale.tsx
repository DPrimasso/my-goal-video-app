import { useEffect, useMemo, useRef, useState } from 'react';
import { PageTemplate } from '../components/layout';
import { Button, Input, Select } from '../components/ui';
import { getPlayer, getTeam, players, teams } from '../catalog';
import { getEndpoint } from '../config/environment';
import { useGeneratedImage } from '../hooks';
import { requestGeneratedImage } from '../services/imageApi';
import type { FinalResultImagePayload, Scorer } from '../types';
import './RisultatoFinale.css';

interface TeamScore {
  home: number;
  away: number;
}

export default function RisultatoFinale() {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [score, setScore] = useState<TeamScore>({ home: 0, away: 0 });
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [manualScorerLines, setManualScorerLines] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { url: generatedImageUrl, replace: replaceImage, reset: resetImage } = useGeneratedImage();
  const errorRef = useRef<HTMLDivElement>(null);

  const teamOptions = useMemo(() => teams.map((team) => ({ value: team.id, label: team.displayName })), []);
  const playerOptions = useMemo(() => players.map((player) => ({ value: player.id, label: player.shortName })) , []);
  const casalpoglioGoals = homeTeam === 'casalpoglio' ? score.home : awayTeam === 'casalpoglio' ? score.away : 0;

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const resizeScorers = (length: number) => {
    setScorers((current) => Array.from(
      { length },
      (_, index) => current[index] || { playerId: '', minute: 0 },
    ));
  };

  const updateTeam = (side: 'home' | 'away', teamId: string) => {
    const nextHomeTeam = side === 'home' ? teamId : homeTeam;
    const nextAwayTeam = side === 'away' ? teamId : awayTeam;
    const nextGoals = nextHomeTeam === 'casalpoglio'
      ? score.home
      : nextAwayTeam === 'casalpoglio' ? score.away : 0;
    if (side === 'home') setHomeTeam(teamId);
    else setAwayTeam(teamId);
    resizeScorers(nextGoals);
  };

  const updateScore = (side: 'home' | 'away', value: string) => {
    const numericValue = Math.min(99, Math.max(0, Number.parseInt(value, 10) || 0));
    const nextScore = { ...score, [side]: numericValue };
    setScore(nextScore);
    resizeScorers(homeTeam === 'casalpoglio' ? nextScore.home : awayTeam === 'casalpoglio' ? nextScore.away : 0);
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
    const automatic = scorers.flatMap((scorer) => {
      const player = getPlayer(scorer.playerId);
      return player && scorer.minute > 0 ? [`${player.shortName} ${scorer.minute}'`] : [];
    });
    const manual = manualScorerLines.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 20);
    return [...automatic, ...manual];
  };

  const validate = (): string | null => {
    if (!homeTeam || !awayTeam) return 'Seleziona entrambe le squadre.';
    if (homeTeam === awayTeam) return 'Le due squadre devono essere differenti.';
    if (score.home < 0 || score.away < 0 || score.home > 99 || score.away > 99) return 'Il punteggio deve essere compreso tra 0 e 99.';
    if (scorers.some((scorer) => !scorer.playerId || scorer.minute < 1 || scorer.minute > 150)) {
      return 'Compila giocatore e minuto per ogni gol del Casalpoglio.';
    }
    if (manualScorerLines.split('\n').some((line) => line.length > 80)) return 'Ogni riga marcatore può contenere al massimo 80 caratteri.';
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
      const homeLabel = getTeam(homeTeam)?.displayName || homeTeam;
      const awayLabel = getTeam(awayTeam)?.displayName || awayTeam;
      const payload: FinalResultImagePayload = {
        homeTeam: homeLabel,
        awayTeam: awayLabel,
        homeScore: score.home,
        awayScore: score.away,
        scorerLines: buildScorerLines(),
        scorersUnder: homeTeam === 'casalpoglio' ? 'home' : awayTeam === 'casalpoglio' ? 'away' : 'home',
      };
      replaceImage(await requestGeneratedImage(getEndpoint('finalResult'), payload));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Errore durante la generazione del risultato finale.');
    } finally {
      setLoading(false);
    }
  };

  const summary = homeTeam && awayTeam
    ? `${getTeam(homeTeam)?.displayName} ${score.home} – ${score.away} ${getTeam(awayTeam)?.displayName}`
    : '';

  return (
    <PageTemplate title="Risultato finale" description="Squadre, punteggio e marcatori in una grafica 9:16." icon="🏆">
      <div className="result-container">
        <section className="card result-form-container" aria-label="Dati del risultato finale">
          <div className="teams-section">
            <Select label="Squadra casa" value={homeTeam} onChange={(value) => updateTeam('home', value)} options={teamOptions} required />
            <div className="vs-section"><div className="vs-text" aria-hidden="true">VS</div></div>
            <Select label="Squadra ospite" value={awayTeam} onChange={(value) => updateTeam('away', value)} options={teamOptions} required />
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

          <section className="image-scorers-section" aria-labelledby="extra-scorers-title">
            <h2 id="extra-scorers-title">Marcatori extra</h2>
            <p className="image-scorers-hint">Una riga per ogni marcatore aggiuntivo, massimo 20 righe e 80 caratteri per riga.</p>
            <label className="input__label" htmlFor="manual-scorers">Righe extra marcatori</label>
            <textarea
              id="manual-scorers"
              className="input marcatori-textarea"
              value={manualScorerLines}
              onChange={(event) => setManualScorerLines(event.target.value.slice(0, 1600))}
              placeholder={"ROSSI 23'\nBIANCHI 67'"}
              rows={5}
            />
          </section>

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
