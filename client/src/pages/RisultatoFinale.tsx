import React, { useState } from 'react';
import { PageTemplate } from '../components/layout';
import { Button, Input, Select } from '../components/ui';
import { players, getSurname } from '../players';
import { useFinalResultVideoGeneration } from '../hooks/useFinalResultVideoGeneration';
import { isDevelopment } from '../config/environment';
import { Scorer } from '../types';
import './RisultatoFinale.css';

interface TeamScore {
  home: number;
  away: number;
}

const RisultatoFinale: React.FC = () => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [score, setScore] = useState<TeamScore>({ home: 0, away: 0 });
  const [casalpoglioScorers, setCasalpoglioScorers] = useState<Scorer[]>([]);

  const { loading, progress, generatedUrl, error, generateVideo, reset } = useFinalResultVideoGeneration();

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

  // Aggiorna l'array dei marcatori quando cambia il punteggio
  React.useEffect(() => {
    updateScorersArray();
  }, [score, homeTeam, awayTeam]);

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

    try {
      await generateVideo(payload);
    } catch (err) {
      console.error('Error in final result video generation:', err);
    }
  };



  return (
    <PageTemplate
      title="Risultato Finale"
      description="Seleziona le due squadre, il risultato finale e chi ha segnato per il Casalpoglio"
      icon="🏆"
    >
      <div className="result-container">
        <div className="result-form-container">
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
                        max={90}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-actions">
            <Button
              onClick={handleGenerateVideo}
              disabled={loading}
              loading={loading}
              size="large"
              className="result-generate-btn"
            >
              {loading ? 'Generazione...' : 'Genera Video'}
            </Button>
            
            {generatedUrl && (
              <Button 
                onClick={reset}
                variant="secondary"
                size="medium"
                className="result-reset-btn"
              >
                Genera Nuovo Video
              </Button>
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
          {generatedUrl ? (
            <div className="video-preview">
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
            <div className="preview-placeholder">
              <div className="placeholder-icon">🏆</div>
              <h3>Anteprima Video</h3>
              <p>Inserisci le squadre e il punteggio per generare il video celebrativo</p>
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
};

export default RisultatoFinale;
