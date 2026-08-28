import { useEffect, useMemo, useRef, useState } from 'react';
import { PageTemplate } from '../components/layout';
import { Button, Input, Select } from '../components/ui';
import { players } from '../catalog';
import { getEndpoint } from '../config/environment';
import { useGeneratedImage, useGoalFormState } from '../hooks';
import { requestGeneratedImage } from '../services/imageApi';
import type { GoalImagePayload } from '../types';
import './Goal.css';

type GoalErrors = Partial<Record<'playerId' | 'minuteGoal' | 'homeTeam' | 'awayTeam' | 'score', string>>;

export default function Goal() {
  const { state, setState } = useGoalFormState();
  const { playerId, minuteGoal, homeTeam, awayTeam, score } = state;
  const [errors, setErrors] = useState<GoalErrors>({});
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { url: generatedImageUrl, replace: replaceImage, reset: resetImage } = useGeneratedImage();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestError) errorRef.current?.focus();
  }, [requestError]);

  const playerOptions = useMemo(() => players
    .map((player) => ({ value: player.id, label: `${player.shortName}${player.assetKey ? '' : ' · foto fallback'}` }))
    .sort((first, second) => first.label.localeCompare(second.label)), []);

  const updateScore = (team: 'home' | 'away', value: string) => {
    const numericValue = Math.min(99, Math.max(0, Number.parseInt(value, 10) || 0));
    setState((current) => ({ ...current, score: { ...current.score, [team]: numericValue } }));
  };

  const validate = (): boolean => {
    const nextErrors: GoalErrors = {};
    const minute = Number(minuteGoal);
    if (!playerId) nextErrors.playerId = 'Seleziona un giocatore.';
    if (!Number.isInteger(minute) || minute < 1 || minute > 150) nextErrors.minuteGoal = 'Inserisci un minuto compreso tra 1 e 150.';
    if (!homeTeam.trim()) nextErrors.homeTeam = 'Inserisci la squadra di casa.';
    if (!awayTeam.trim()) nextErrors.awayTeam = 'Inserisci la squadra ospite.';
    if (homeTeam.trim().toLocaleLowerCase() === awayTeam.trim().toLocaleLowerCase() && homeTeam.trim()) {
      nextErrors.awayTeam = 'Le due squadre devono essere differenti.';
    }
    if (score.home < 0 || score.away < 0 || score.home > 99 || score.away > 99) nextErrors.score = 'Il punteggio deve essere compreso tra 0 e 99.';
    if (score.home === 0 && score.away === 0) nextErrors.score = 'Il parziale deve contenere almeno un gol.';
    setErrors(nextErrors);

    const firstInvalidField = [
      ['playerId', 'goal-player'],
      ['homeTeam', 'goal-home-team'],
      ['awayTeam', 'goal-away-team'],
      ['score', 'goal-score-home'],
      ['minuteGoal', 'goal-minute'],
    ].find(([field]) => nextErrors[field as keyof GoalErrors]);
    if (firstInvalidField) {
      requestAnimationFrame(() => document.getElementById(firstInvalidField[1])?.focus());
    }
    return Object.keys(nextErrors).length === 0;
  };

  const generate = async () => {
    if (!validate()) return;
    setLoading(true);
    setRequestError(null);
    try {
      const payload: GoalImagePayload = {
        playerId,
        minuteGoal: Number(minuteGoal),
        homeTeam: homeTeam.trim(),
        homeScore: score.home,
        awayTeam: awayTeam.trim(),
        awayScore: score.away,
      };
      replaceImage(await requestGeneratedImage(getEndpoint('goal'), payload));
    } catch (reason) {
      setRequestError(reason instanceof Error ? reason.message : 'Errore durante la generazione del goal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate title="Goal" description="Giocatore, risultato parziale e minuto del gol." icon="⚽">
      <div className="goal-container">
        <section className="card goal-form-container" aria-label="Dati del goal">
          <div className="form-section">
            <Select id="goal-player" label="Giocatore" value={playerId} onChange={(value) => setState((current) => ({ ...current, playerId: value }))} options={playerOptions} required error={errors.playerId} />
            <Input id="goal-home-team" label="Squadra casa" value={homeTeam} onChange={(value) => setState((current) => ({ ...current, homeTeam: value.slice(0, 80) }))} placeholder="es. Casalpoglio" maxLength={80} required error={errors.homeTeam} />
            <Input id="goal-away-team" label="Squadra ospite" value={awayTeam} onChange={(value) => setState((current) => ({ ...current, awayTeam: value.slice(0, 80) }))} placeholder="es. Amatori Club" maxLength={80} required error={errors.awayTeam} />

            <fieldset className="score-section">
              <legend>Risultato parziale</legend>
              <div className="score-inputs">
                <Input id="goal-score-home" label="Parziale casa" value={score.home.toString()} onChange={(value) => updateScore('home', value)} type="number" min={0} max={99} required />
                <div className="score-separator" aria-hidden="true">–</div>
                <Input id="goal-score-away" label="Parziale ospite" value={score.away.toString()} onChange={(value) => updateScore('away', value)} type="number" min={0} max={99} required />
              </div>
              {errors.score && <div className="error-text" role="alert">{errors.score}</div>}
            </fieldset>

            <Input id="goal-minute" label="Minuto del gol" value={minuteGoal} onChange={(value) => setState((current) => ({ ...current, minuteGoal: value }))} type="number" min={1} max={150} placeholder="es. 78" required error={errors.minuteGoal} />

            {requestError && <div ref={errorRef} tabIndex={-1} className="error-message" role="alert">⚠️ {requestError}</div>}
            <div className="form-actions">
              <Button onClick={generate} disabled={loading} loading={loading} size="large">{loading ? 'Generazione...' : '✨ Genera goal'}</Button>
              {generatedImageUrl && <Button onClick={resetImage} variant="outline" size="large">Nuovo goal</Button>}
            </div>
          </div>
        </section>

        <section className="preview-section" aria-live="polite">
          {generatedImageUrl ? (
            <div className="image-preview">
              <div className="phone-frame"><div className="phone-frame-inner"><img src={generatedImageUrl} alt="Grafica goal generata" className="goal-image" /></div></div>
              <p className="preview-meta">Formato 9:16 · pronto per Stories e Reels</p>
              <div className="image-actions">
                <Button onClick={() => window.open(generatedImageUrl, '_blank', 'noopener,noreferrer')}>Apri PNG</Button>
                <a className="download-btn" href={generatedImageUrl} download="goal.png">Scarica PNG</a>
              </div>
            </div>
          ) : (
            <div className="preview-placeholder"><div className="placeholder-icon">⚽</div><h3>Anteprima goal</h3><p>Compila il modulo per generare la grafica.</p></div>
          )}
        </section>
      </div>
    </PageTemplate>
  );
}
