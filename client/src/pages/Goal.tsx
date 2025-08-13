import React, { useState } from 'react';
import { PageTemplate } from '../components/layout';
import { Button, Input, Select } from '../components/ui';
import { useVideoGeneration } from '../hooks/useVideoGeneration';
import { videoService } from '../services/videoService';
import { players } from '../players';
import './Goal.css';

interface TeamScore {
  home: number;
  away: number;
}

const Goal: React.FC = () => {
  const [playerId, setPlayerId] = useState('');
  const [minuteGoal, setMinuteGoal] = useState('');
  const [score, setScore] = useState<TeamScore>({ home: 0, away: 0 });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { loading, progress, generatedUrl, error, generateVideo, reset } = useVideoGeneration();

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

    if (score.home < 0 || score.away < 0) {
      newErrors.score = 'Il punteggio non può essere negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const selectedPlayer = players.find(p => p.id === playerId);
    if (!selectedPlayer) return;

    const playerImageUrl = videoService.makeAssetUrl(selectedPlayer.image);
    const partialScore = `${score.home}-${score.away}`;

    try {
      await generateVideo({
        playerId,
        playerName: selectedPlayer.name,
        minuteGoal: Number(minuteGoal),
        s3PlayerUrl: playerImageUrl,
        overlayImage: playerImageUrl,
        partialScore,
      });
    } catch (err) {
      console.error('Error generating video:', err);
    }
  };

  const handleDownload = async () => {
    if (!generatedUrl) return;

    const namePart = playerId ? `player-${playerId}` : 'video';
    const minutePart = minuteGoal ? `-min-${minuteGoal}` : '';
    const filename = `goal-${namePart}${minutePart}.mp4`;

    await videoService.downloadVideo(generatedUrl, filename);
  };

  const handleReset = () => {
    setPlayerId('');
    setMinuteGoal('');
    setScore({ home: 0, away: 0 });
    setErrors({});
    reset();
  };

  const playerOptions = players.map(player => ({
    value: player.id,
    label: player.name,
  }));

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

            <div className="score-section">
              <h3>Risultato Parziale</h3>
              <div className="score-inputs">
                <div className="score-input">
                  <Input
                    label="Casa"
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
                    label="Ospite"
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
                onClick={handleSubmit}
                disabled={loading}
                loading={loading}
                size="large"
                className="form-submit-btn"
              >
                {loading ? `Generazione... ${progress}%` : 'Genera Video'}
              </Button>

              {generatedUrl && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="large"
                >
                  Nuovo Video
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

          {generatedUrl ? (
            <div className="video-preview">
              <video src={generatedUrl} controls className="video-player" />
              <div className="video-actions">
                <Button onClick={handleDownload} variant="primary" size="medium">
                  Scarica Video
                </Button>
                <Button
                  onClick={() => window.open(generatedUrl, '_blank', 'noopener,noreferrer')}
                  variant="secondary"
                  size="medium"
                >
                  Apri in Nuova Scheda
                </Button>
              </div>
            </div>
          ) : (
            <div className="preview-placeholder">
              <div className="placeholder-icon">🎥</div>
              <h3>Anteprima Video</h3>
              <p>Compila il form e genera il tuo video personalizzato</p>
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
};

export default Goal;
