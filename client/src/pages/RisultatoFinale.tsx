import React, { useState } from 'react';
import { PageTemplate } from '../components/layout';
import { Button, Input, Select } from '../components/ui';
import { players } from '../players';
import './RisultatoFinale.css';

interface TeamScore {
  home: number;
  away: number;
}

const RisultatoFinale: React.FC = () => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [score, setScore] = useState<TeamScore>({ home: 0, away: 0 });
  const [casalpoglioScorers, setCasalpoglioScorers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

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

  const handleScorerChange = (index: number, value: string) => {
    const newScorers = [...casalpoglioScorers];
    newScorers[index] = value;
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
        newScorers.push('');
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

  const generateVideo = async () => {
    if (!homeTeam || !awayTeam) {
      alert('Seleziona entrambe le squadre');
      return;
    }

    if (score.home < 0 || score.away < 0) {
      alert('Il punteggio non può essere negativo');
      return;
    }

    const casalpoglioGoals = getCasalpoglioGoals();
    if (casalpoglioGoals > 0 && casalpoglioScorers.some(s => !s)) {
      alert('Inserisci tutti i marcatori del Casalpoglio');
      return;
    }

    setLoading(true);
    setGeneratedUrl(null);

    try {
      // Simula la generazione del video
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Per ora generiamo un URL di esempio
      setGeneratedUrl('https://example.com/video.mp4');
    } catch (error) {
      alert('Errore nella generazione del video');
    } finally {
      setLoading(false);
    }
  };

  const getSurname = (name: string) => name.split(" ").slice(-1)[0];

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
                    <Select
                      label=""
                      value={scorer}
                      onChange={(value) => handleScorerChange(index, value)}
                      options={players.map(p => ({
                        value: p.id,
                        label: getSurname(p.name)
                      }))}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-actions">
            <Button
              onClick={generateVideo}
              disabled={loading}
              loading={loading}
              size="large"
              className="result-generate-btn"
            >
              {loading ? 'Generazione...' : 'Genera Video'}
            </Button>
          </div>
        </div>

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
