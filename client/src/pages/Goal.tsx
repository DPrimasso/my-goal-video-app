import React, { useState, useEffect } from 'react';
import { PageTemplate } from '../components/layout';
import { Button, Input, Select } from '../components/ui';
import { players, getSurname } from '../players';
import { isProduction } from '../config/environment';
import { videoService } from '../services/videoService';
import './Goal.css';

interface TeamScore {
  home: number;
  away: number;
}

// Helper functions per gestire i cookie
function setCookie(name: string, value: string, days: number = 365) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

interface SavedGoal {
  playerId: string;
  minuteGoal: string;
  homeTeam: string;
  awayTeam: string;
  score: TeamScore;
}

const Goal: React.FC = () => {
  const [playerId, setPlayerId] = useState('');
  const [minuteGoal, setMinuteGoal] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [score, setScore] = useState<TeamScore>({ home: 0, away: 0 });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carica i dati salvati dai cookie all'avvio
  useEffect(() => {
    const savedGoal = getCookie('savedGoal');
    if (savedGoal) {
      try {
        const parsed: SavedGoal = JSON.parse(decodeURIComponent(savedGoal));
        if (parsed.playerId) {
          setPlayerId(parsed.playerId);
        }
        if (parsed.minuteGoal) {
          setMinuteGoal(parsed.minuteGoal);
        }
        if (parsed.homeTeam) {
          setHomeTeam(parsed.homeTeam);
        }
        if (parsed.awayTeam) {
          setAwayTeam(parsed.awayTeam);
        }
        if (parsed.score) {
          setScore(parsed.score);
        }
      } catch (err) {
        console.error('Errore nel caricamento dei dati salvati:', err);
      }
    }
  }, []);

  // Salva i dati nei cookie quando cambiano
  useEffect(() => {
    const goalData: SavedGoal = {
      playerId,
      minuteGoal,
      homeTeam,
      awayTeam,
      score,
    };
    const encodedData = encodeURIComponent(JSON.stringify(goalData));
    setCookie('savedGoal', encodedData, 365);
  }, [playerId, minuteGoal, homeTeam, awayTeam, score]);

  const handleScoreChange = (team: 'home' | 'away', value: string) => {
    const numValue = parseInt(value) || 0;
    setScore(prev => ({
      ...prev,
      [team]: numValue
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!playerId) {
      newErrors.playerId = 'Seleziona un giocatore';
    }

    if (!minuteGoal) {
      newErrors.minuteGoal = 'Inserisci il minuto del gol';
    } else if (isNaN(Number(minuteGoal)) || Number(minuteGoal) < 0) {
      newErrors.minuteGoal = 'Il minuto del gol deve essere un numero positivo';
    }

    if (!homeTeam.trim()) {
      newErrors.homeTeam = 'Inserisci il nome della squadra casa';
    }

    if (!awayTeam.trim()) {
      newErrors.awayTeam = 'Inserisci il nome della squadra ospite';
    }

    if (score.home < 0 || score.away < 0) {
      newErrors.score = 'Il punteggio non può essere negativo';
    }

    if (score.home === 0 && score.away === 0) {
      newErrors.score = 'Inserisci almeno un gol per una delle due squadre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generate = async () => {
    if (!validateForm()) return;

    const selectedPlayer = players.find(p => p.id === playerId);
    if (!selectedPlayer) return;

    setLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const playerImageUrl = videoService.makeAssetUrl(selectedPlayer.image);
      const playerName = getSurname(selectedPlayer.name);

      if (isProduction()) {
        // In produzione: genera IMMAGINE goal via Lambda
        const goalImageUrl = process.env.REACT_APP_GOAL_IMAGE_URL || 'https://xgafdelrk5bwrvizodeoepwejm0ntuuz.lambda-url.eu-west-1.on.aws/';
        console.log('Goal Image URL:', goalImageUrl);
        console.log('REACT_APP_GOAL_IMAGE_URL from env:', process.env.REACT_APP_GOAL_IMAGE_URL);
        console.log('isProduction:', isProduction());
        
        if (!goalImageUrl || goalImageUrl.trim() === '') {
          throw new Error('Goal image URL not configured for production');
        }
        
        const response = await fetch(goalImageUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            minuteGoal: Number(minuteGoal),
            playerName,
            playerImageUrl,
            homeTeam: homeTeam.trim(),
            homeScore: score.home,
            awayTeam: awayTeam.trim(),
            awayScore: score.away,
          }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setGeneratedImageUrl(imageUrl);
      } else {
        // In sviluppo locale: genera IMMAGINE via server locale
        const response = await fetch('http://localhost:4000/api/goal-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            minuteGoal: Number(minuteGoal),
            playerName,
            playerImageUrl,
            homeTeam: homeTeam.trim(),
            homeScore: score.home,
            awayTeam: awayTeam.trim(),
            awayScore: score.away,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Errore nella generazione dell\'immagine');
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setGeneratedImageUrl(imageUrl);
      }
    } catch (err: any) {
      console.error('Error generating goal image:', err);
      setError(err.message || 'Errore durante la generazione');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setGeneratedImageUrl(null);
    setError(null);
  };

  const playerOptions = players.map(player => ({
    value: player.id,
    label: getSurname(player.name),
  }));

  playerOptions.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <PageTemplate
      title="Goal"
      description="Seleziona il giocatore che ha segnato, il risultato parziale e il minuto del goal"
      icon="⚽"
    >
      <div className="goal-container">
        <div className="goal-form-container">
          <div className="form-section">
            <Select
              label="Giocatore"
              value={playerId}
              onChange={setPlayerId}
              options={playerOptions}
              required
              error={errors.playerId}
            />

            <Input
              label="Squadra Casa"
              value={homeTeam}
              onChange={setHomeTeam}
              type="text"
              placeholder="es. Casalpoglio"
              required
              error={errors.homeTeam}
            />

            <Input
              label="Squadra Ospite"
              value={awayTeam}
              onChange={setAwayTeam}
              type="text"
              placeholder="es. Squadra Avversaria"
              required
              error={errors.awayTeam}
            />

            <div className="score-section">
              <div className="score-inputs">
                <div className="score-input">
                  <Input
                    label="Parziale casa"
                    value={score.home.toString()}
                    onChange={(value) => handleScoreChange('home', value)}
                    type="number"
                    min={0}
                    placeholder="es. 2"
                    required
                  />
                </div>
                
                <div className="score-separator">-</div>
                
                <div className="score-input">
                  <Input
                    label="Parziale Ospite"
                    value={score.away.toString()}
                    onChange={(value) => handleScoreChange('away', value)}
                    type="number"
                    min={0}
                    placeholder="es. 1"
                    required
                  />
                </div>
              </div>
              {errors.score && <div className="error-text">{errors.score}</div>}
            </div>

            <Input
              label="Minuto del Gol"
              value={minuteGoal}
              onChange={setMinuteGoal}
              type="number"
              min={0}
              placeholder="es. 78"
              required
              error={errors.minuteGoal}
            />

            <div className="form-actions">
              <Button
                onClick={generate}
                disabled={loading}
                loading={loading}
                size="large"
                className="form-submit-btn"
              >
                {loading ? '⏳ Generazione...' : '✨ Genera Goal'}
              </Button>

              {generatedImageUrl && (
                <Button
                  onClick={reset}
                  variant="outline"
                  size="large"
                >
                  Nuovo Goal
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="preview-section">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {generatedImageUrl ? (
            <div className="image-preview">
              <img src={generatedImageUrl} alt="Goal" className="goal-image" />
              <div className="image-actions">
                <Button
                  onClick={() => window.open(generatedImageUrl, '_blank', 'noopener,noreferrer')}
                  variant="primary"
                  size="medium"
                >
                  📱 Apri
                </Button>
                <a
                  className="download-btn"
                  href={generatedImageUrl}
                  download={`goal_${Date.now()}.png`}
                >
                  💾 Scarica
                </a>
              </div>
            </div>
          ) : (
            <div className="preview-placeholder">
              <div className="placeholder-icon">⚽</div>
              <h3>Anteprima Goal</h3>
              <p>Compila il form e genera la tua immagine personalizzata</p>
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
};

export default Goal;
