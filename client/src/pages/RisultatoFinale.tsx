import React, { useState } from 'react';
import { PageTemplate } from '../components/layout';
import { Button, Input, Select } from '../components/ui';
import { players, getSurname } from '../players';
import { useFinalResultVideoGeneration } from '../hooks/useFinalResultVideoGeneration';
import { isDevelopment, isProduction } from '../config/environment';
import type { FinalResultImagePayload, Scorer } from '../types';
import '../components/ui/Input.css';
import './RisultatoFinale.css';

interface TeamScore {
  home: number;
  away: number;
}

function buildFinalResultImagePayload(
  homeLabel: string,
  awayLabel: string,
  score: TeamScore,
  scorerLines: string[],
  scorersUnder: 'home' | 'away'
): FinalResultImagePayload {
  return {
    homeTeam: homeLabel.trim(),
    awayTeam: awayLabel.trim(),
    homeScore: score.home,
    awayScore: score.away,
    scorerLines,
    scorersUnder,
  };
}

const RisultatoFinale: React.FC = () => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [score, setScore] = useState<TeamScore>({ home: 0, away: 0 });
  const [casalpoglioScorers, setCasalpoglioScorers] = useState<Scorer[]>([]);
  const [manualScorerLines, setManualScorerLines] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const { loading, progress, generatedUrl, error, generateVideo, reset } = useFinalResultVideoGeneration();

  React.useEffect(() => {
    return () => {
      if (generatedImageUrl) URL.revokeObjectURL(generatedImageUrl);
    };
  }, [generatedImageUrl]);

  // Error boundary for the component
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('🚨 RisultatoFinale component error:', error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Debug logging for re-renders
  if (generatedUrl && isDevelopment()) {
    console.log('🎯 Final result video ready for preview:', generatedUrl);
  }

  const teamOptions = [
    { value: 'casalpoglio', label: 'Casalpoglio' },
    { value: 'amatori_club', label: 'Amatori Club' },
    { value: 'team_3', label: 'Team 3' },
    { value: 'team_4', label: 'Team 4' },
  ];

  const handleScoreChange = (team: 'home' | 'away', value: string) => {
    const numValue = parseInt(value) || 0;
    setScore(prev => ({
      ...prev,
      [team]: numValue
    }));
  };

  const handleScorerChange = (index: number, field: 'playerId' | 'minute', value: string) => {
    const newScorers = [...casalpoglioScorers];
    if (field === 'playerId') {
      newScorers[index] = { ...newScorers[index], playerId: value };
    } else if (field === 'minute') {
      const minuteValue = parseInt(value) || 0;
      newScorers[index] = { ...newScorers[index], minute: minuteValue };
    }
    setCasalpoglioScorers(newScorers);
  };

  const getCasalpoglioGoals = (): number => {
    if (homeTeam === 'casalpoglio') return score.home;
    if (awayTeam === 'casalpoglio') return score.away;
    return 0;
  };

  const updateScorersArray = () => {
    const goals = getCasalpoglioGoals();
    if (goals > casalpoglioScorers.length) {
      // Aggiungi nuovi slot per i gol
      const newScorers = [...casalpoglioScorers];
      for (let i = casalpoglioScorers.length; i < goals; i++) {
        newScorers.push({ playerId: '', minute: 0 });
      }
      setCasalpoglioScorers(newScorers);
    } else if (goals < casalpoglioScorers.length) {
      // Rimuovi slot extra
      setCasalpoglioScorers(casalpoglioScorers.slice(0, goals));
    }
  };

  // Aggiorna l'array dei marcatori quando cambia il punteggio (sync slot count; non includere casalpoglioScorers)
  React.useEffect(() => {
    updateScorersArray();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only react to score/teams for slot sizing
  }, [score, homeTeam, awayTeam]);

  const getTeamLabel = (value: string) =>
    teamOptions.find((t) => t.value === value)?.label || value;

  const buildScorerLinesForImage = (): string[] => {
    const lines: string[] = [];

    if (homeTeam === 'casalpoglio' || awayTeam === 'casalpoglio') {
      casalpoglioScorers.forEach((s) => {
        const player = players.find((p) => p.id === s.playerId);
        const surname = player ? getSurname(player.name) : '';
        if (surname && s.minute > 0) {
          lines.push(`${surname} ${s.minute}'`);
        }
      });
    }

    manualScorerLines
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((l) => lines.push(l));

    return lines;
  };

  const buildMatchSummary = () => {
    if (!homeTeam || !awayTeam) return '';
    const homeLabel = getTeamLabel(homeTeam);
    const awayLabel = getTeamLabel(awayTeam);
    const base = `${homeLabel} ${score.home} - ${score.away} ${awayLabel}`;

    const casalGoals = getCasalpoglioGoals();
    if (casalGoals === 0 || casalpoglioScorers.length === 0) {
      return base;
    }

    const scorersSummary = casalpoglioScorers
      .map((s) => {
        const player = players.find((p) => p.id === s.playerId);
        const surname = player ? getSurname(player.name) : '';
        if (!surname || !s.minute) return null;
        return `${surname} (${s.minute}')`;
      })
      .filter(Boolean)
      .join(', ');

    if (!scorersSummary) return base;
    return `${base} · Gol Casalpoglio: ${scorersSummary}`;
  };

  const handleGenerateVideo = async () => {
    if (!homeTeam || !awayTeam) {
      alert('Seleziona entrambe le squadre');
      return;
    }

    if (score.home < 0 || score.away < 0) {
      alert('Il punteggio non può essere negativo');
      return;
    }

    const casalpoglioGoals = getCasalpoglioGoals();
    if (casalpoglioGoals > 0 && casalpoglioScorers.some(s => !s.playerId || s.minute <= 0)) {
      alert('Inserisci tutti i marcatori del Casalpoglio e i minuti dei gol');
      return;
    }

    const payload = {
      homeTeam,
      awayTeam,
      score,
      casalpoglioScorers,
    };

    console.log('🎯 RisultatoFinale - Payload being sent:', JSON.stringify(payload, null, 2));

    try {
      await generateVideo(payload);
    } catch (err) {
      console.error('Error in final result video generation:', err);
    }
  };

  const handleGenerateImage = async () => {
    if (!homeTeam || !awayTeam) {
      alert('Seleziona entrambe le squadre');
      return;
    }
    if (score.home < 0 || score.away < 0) {
      alert('Il punteggio non può essere negativo');
      return;
    }

    const casalpoglioGoals = getCasalpoglioGoals();
    if (casalpoglioGoals > 0 && casalpoglioScorers.some((s) => !s.playerId || s.minute <= 0)) {
      alert('Inserisci tutti i marcatori del Casalpoglio e i minuti dei gol');
      return;
    }

    setImageLoading(true);
    setImageError(null);
    if (generatedImageUrl) {
      URL.revokeObjectURL(generatedImageUrl);
      setGeneratedImageUrl(null);
    }

    const homeLabel = getTeamLabel(homeTeam);
    const awayLabel = getTeamLabel(awayTeam);
    const scorerLines = buildScorerLinesForImage();
    const scorersUnder: 'home' | 'away' =
      homeTeam === 'casalpoglio' ? 'home' : awayTeam === 'casalpoglio' ? 'away' : 'home';
    const payload = buildFinalResultImagePayload(homeLabel, awayLabel, score, scorerLines, scorersUnder);

    try {
      let response: Response;
      if (isProduction()) {
        const url =
          process.env.REACT_APP_FINAL_RESULT_IMAGE_URL ||
          '';
        if (!url.trim()) {
          throw new Error('URL immagine risultato non configurato in produzione (REACT_APP_FINAL_RESULT_IMAGE_URL)');
        }
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('http://localhost:4000/api/final-result-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        if (isProduction()) {
          throw new Error(`HTTP ${response.status}`);
        }
        const errJson = await response.json();
        throw new Error(errJson.error || 'Errore generazione immagine');
      }

      const blob = await response.blob();
      setGeneratedImageUrl(URL.createObjectURL(blob));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Errore durante la generazione';
      setImageError(msg);
      console.error('final result image:', e);
    } finally {
      setImageLoading(false);
    }
  };

  const resetImage = () => {
    if (generatedImageUrl) URL.revokeObjectURL(generatedImageUrl);
    setGeneratedImageUrl(null);
    setImageError(null);
  };


  return (
    <PageTemplate
      title="Risultato Finale"
      description="Squadre, punteggio e marcatori: genera il video celebrativo e l'immagine 9:16 per social (stile goal)"
      icon="🏆"
    >
      <div className="result-container">
        <div className="card result-form-container">
          <div className="teams-section">
            <div className="team-input">
              <Select
                label="Squadra Casa"
                value={homeTeam}
                onChange={setHomeTeam}
                options={teamOptions}
                required
              />
            </div>
            
            <div className="vs-section">
              <div className="vs-text">VS</div>
            </div>
            
            <div className="team-input">
              <Select
                label="Squadra Ospite"
                value={awayTeam}
                onChange={setAwayTeam}
                options={teamOptions}
                required
              />
            </div>
          </div>

          <div className="score-section">
            <h3>Punteggio Finale</h3>
            <div className="score-inputs">
              <div className="score-input">
                <Input
                  label="Casa"
                  value={score.home.toString()}
                  onChange={(value) => handleScoreChange('home', value)}
                  type="number"
                  min={0}
                  required
                />
              </div>
              
              <div className="score-separator">-</div>
              
              <div className="score-input">
                <Input
                  label="Ospite"
                  value={score.away.toString()}
                  onChange={(value) => handleScoreChange('away', value)}
                  type="number"
                  min={0}
                  required
                />
              </div>
            </div>
          </div>

          {/* Sezione Marcatori Casalpoglio */}
          {(homeTeam === 'casalpoglio' || awayTeam === 'casalpoglio') && getCasalpoglioGoals() > 0 && (
            <div className="scorers-section">
              <h3>Marcatori Casalpoglio</h3>
              <div className="scorers-list">
                {casalpoglioScorers.map((scorer, index) => (
                  <div key={index} className="scorer-input">
                    <label className="scorer-label">
                      Gol {index + 1}:
                    </label>
                    <div className="scorer-fields">
                      <Select
                        label=""
                        value={scorer.playerId}
                        onChange={(value) => handleScorerChange(index, 'playerId', value)}
                        options={players.map(p => ({
                          value: p.id,
                          label: getSurname(p.name)
                        }))}
                        required
                      />
                      <Input
                        label="Minuto"
                        value={scorer.minute.toString()}
                        onChange={(value) => handleScorerChange(index, 'minute', value)}
                        type="number"
                        min={1}
                        max={150}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {homeTeam && awayTeam && (
            <div className="match-summary">
              {buildMatchSummary()}
            </div>
          )}

          <div className="image-scorers-section">
            <h3>Marcatori (immagine &amp; testo)</h3>
            <p className="image-scorers-hint">
              Se il Casalpoglio segna, compila i gol sopra: finiscono in lista automaticamente. Aggiungi qui una riga per
              ogni altro marcatore (es. avversari o formato libero).
            </p>
            <div className="input-group">
              <label className="input__label" htmlFor="manual-scorers">
                Righe extra marcatori
              </label>
              <textarea
                id="manual-scorers"
                className="input maratori-textarea"
                value={manualScorerLines}
                onChange={(e) => setManualScorerLines(e.target.value)}
                placeholder={"ROSSI 23'\nBIANCHI 67'"}
                rows={5}
              />
            </div>
          </div>

          <div className="result-actions">
            <div className="result-actions-row">
              <Button
                onClick={handleGenerateImage}
                disabled={imageLoading}
                loading={imageLoading}
                size="large"
                variant="primary"
                className="result-generate-btn"
              >
                {imageLoading ? 'Immagine...' : '📷 Genera immagine 9:16'}
              </Button>
              <Button
                onClick={handleGenerateVideo}
                disabled={loading}
                loading={loading}
                size="large"
                className="result-generate-btn"
              >
                {loading ? 'Video...' : '🎬 Genera video'}
              </Button>
            </div>

            {(generatedUrl || generatedImageUrl) && (
              <div className="result-actions-row">
                {generatedImageUrl && (
                  <Button onClick={resetImage} variant="outline" size="medium">
                    Nuova immagine
                  </Button>
                )}
                {generatedUrl && (
                  <Button onClick={reset} variant="secondary" size="medium" className="result-reset-btn">
                    Nuovo video
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-text">Generazione in corso... {progress}%</p>
          </div>
        )}

        {error && (
          <div className="error-section">
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
            <Button 
              onClick={reset}
              variant="secondary"
              size="small"
            >
              Riprova
            </Button>
          </div>
        )}

        <div className="preview-section">
          {imageError && (
            <div className="error-section">
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{imageError}</span>
              </div>
            </div>
          )}

          <div className="preview-dual">
            {generatedImageUrl ? (
              <div className="final-result-image-preview">
                <h3 className="preview-block-title">Immagine social</h3>
                <div className="phone-frame">
                  <div className="phone-frame-inner">
                    <img src={generatedImageUrl} alt="Risultato finale" className="final-result-image" />
                  </div>
                </div>
                <p className="preview-meta">Formato 9:16 · Stile goal</p>
                <div className="video-actions">
                  <Button
                    onClick={() => window.open(generatedImageUrl, '_blank', 'noopener,noreferrer')}
                    variant="secondary"
                    size="medium"
                  >
                    Apri PNG
                  </Button>
                  <a className="download-link" href={generatedImageUrl} download={`risultato_${Date.now()}.png`}>
                    Scarica PNG
                  </a>
                </div>
              </div>
            ) : (
              <div className="preview-placeholder preview-placeholder--compact">
                <div className="placeholder-icon">📷</div>
                <h3>Anteprima immagine</h3>
                <p>Genera l&apos;immagine 9:16 con punteggio e marcatori</p>
              </div>
            )}

            {generatedUrl ? (
              <div className="video-preview">
                <h3 className="preview-block-title">Video</h3>
                <video className="video-player" src={generatedUrl} controls />
                <div className="video-actions">
                  <Button
                    onClick={() => window.open(generatedUrl, '_blank', 'noopener,noreferrer')}
                    variant="secondary"
                    size="medium"
                  >
                    Apri in Nuova Scheda
                  </Button>
                  <a className="download-link" href={generatedUrl} download>
                    Scarica video
                  </a>
                </div>
              </div>
            ) : (
              <div className="preview-placeholder preview-placeholder--compact">
                <div className="placeholder-icon">🏆</div>
                <h3>Anteprima video</h3>
                <p>Genera il video celebrativo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default RisultatoFinale;
