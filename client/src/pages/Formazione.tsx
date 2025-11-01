import React, { useState, useEffect } from 'react';
import { PageTemplate } from '../components/layout';
import { Button } from '../components/ui';
import { Input } from '../components/ui';
import { players, getSurname } from '../players';
import { LineupPlayer, LineupRequest } from '../types';
import './Formazione.css';
import { isProduction } from '../config/environment';

// Mapping numeri di default per giocatori (basato sul demo)
const DEFAULT_PLAYER_NUMBERS: Record<string, number> = {
  'davide_sipolo': 1,
  'andrea_contesini': 19,
  'daniele_primasso': 5,
  'alberto_viola': 3,
  'matteo_pinelli': 22,
  'davide_di_roberto': 10,
  'filippo_lodetti': 4,
  'lorenzo_gobbi': 8,
  'marco_turini': 9,
  'lorenzo_piccinelli': 11,
  'cristian_ramponi': 15,
};

function getDefaultNumber(playerId: string, index: number): number {
  return DEFAULT_PLAYER_NUMBERS[playerId] || (index + 1);
}

function getPlayerName(playerId: string): string {
  const player = players.find(p => p.id === playerId);
  return player ? getSurname(player.name) : '';
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

interface SavedFormation {
  lineupPlayers: LineupPlayer[];
  opponentTeam: string;
  captainIndex: number | null;
}

const Formazione: React.FC = () => {
  const [lineupPlayers, setLineupPlayers] = useState<LineupPlayer[]>(
    Array.from({ length: 11 }, (_, index) => ({
      playerId: '',
      playerName: '',
      number: index + 1,
      isCaptain: false,
    }))
  );
  const [opponentTeam, setOpponentTeam] = useState('');
  const [captainIndex, setCaptainIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carica la formazione salvata dai cookie all'avvio
  useEffect(() => {
    const savedFormation = getCookie('savedFormation');
    if (savedFormation) {
      try {
        const parsed: SavedFormation = JSON.parse(decodeURIComponent(savedFormation));
        if (parsed.lineupPlayers && Array.isArray(parsed.lineupPlayers)) {
          setLineupPlayers(parsed.lineupPlayers);
        }
        if (parsed.opponentTeam) {
          setOpponentTeam(parsed.opponentTeam);
        }
        if (parsed.captainIndex !== undefined) {
          setCaptainIndex(parsed.captainIndex);
        }
      } catch (err) {
        console.error('Errore nel caricamento della formazione salvata:', err);
      }
    }
  }, []);

  // Salva la formazione nei cookie quando cambia
  useEffect(() => {
    const formationData: SavedFormation = {
      lineupPlayers,
      opponentTeam,
      captainIndex,
    };
    const encodedData = encodeURIComponent(JSON.stringify(formationData));
    setCookie('savedFormation', encodedData, 365);
  }, [lineupPlayers, opponentTeam, captainIndex]);

  const handlePlayerChange = (index: number, playerId: string) => {
    const newPlayers = [...lineupPlayers];
    const player = players.find(p => p.id === playerId);
    
    if (player) {
      newPlayers[index] = {
        playerId,
        playerName: getSurname(player.name),
        number: getDefaultNumber(playerId, index),
        isCaptain: index === captainIndex,
      };
    } else {
      newPlayers[index] = {
        playerId: '',
        playerName: '',
        number: index + 1,
        isCaptain: false,
      };
      if (captainIndex === index) {
        setCaptainIndex(null);
      }
    }
    
    setLineupPlayers(newPlayers);
  };

  const handleNumberChange = (index: number, number: number) => {
    const newPlayers = [...lineupPlayers];
    newPlayers[index] = {
      ...newPlayers[index],
      number: Math.max(1, Math.min(99, number || 1)),
    };
    setLineupPlayers(newPlayers);
  };

  const handleCaptainChange = (index: number) => {
    const newCaptainIndex = captainIndex === index ? null : index;
    setCaptainIndex(newCaptainIndex);
    
    const newPlayers = lineupPlayers.map((p, i) => ({
      ...p,
      isCaptain: i === newCaptainIndex,
    }));
    setLineupPlayers(newPlayers);
  };

  const generate = async () => {
    const validPlayers = lineupPlayers.filter(p => p.playerId);
    
    if (validPlayers.length !== 11) {
      alert('Seleziona esattamente 11 giocatori');
      return;
    }

    if (!opponentTeam.trim()) {
      alert('Inserisci il nome della squadra avversaria');
      return;
    }
    
    setLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      if (isProduction()) {
        // In produzione: genera IMMAGINE lineup via Lambda lineup-image (stesso design del locale)
        const validPlayersForRequest = lineupPlayers.filter(p => p.playerId);
        const lineupImageUrl = process.env.REACT_APP_LINEUP_IMAGE_URL || 'https://4nmg24nu7tkv6mo6ikistuh2la0dbxtl.lambda-url.eu-west-1.on.aws/';
        const response = await fetch(lineupImageUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            players: validPlayersForRequest,
            opponentTeam: opponentTeam.trim(),
          }),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        // La Lambda restituisce direttamente l'immagine binaria
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setGeneratedImageUrl(imageUrl);
      } else {
        // In sviluppo locale: genera IMMAGINE via server locale
        const request: LineupRequest = {
          players: lineupPlayers.filter(p => p.playerId),
          opponentTeam: opponentTeam.trim(),
        };

        const response = await fetch('http://localhost:4000/api/lineup-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
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
      console.error('Error generating lineup:', err);
      setError(err.message || 'Errore durante la generazione');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setGeneratedImageUrl(null);
    setError(null);
  };

  const filledPlayersCount = lineupPlayers.filter(p => p.playerId).length;

  return (
    <PageTemplate
      title="Starting XI"
      icon="📋"
    >
      <div className="lineup-container">
        {/* Squadra Avversaria */}
        <div className="opponent-section">
          <label className="opponent-label">
            <span className="label-icon">⚽</span>
            <span>Squadra Avversaria</span>
          </label>
          <input
            type="text"
            className="opponent-input-mobile"
            value={opponentTeam}
            onChange={(e) => setOpponentTeam(e.target.value)}
            placeholder="Squadra Avversaria"
          />
        </div>

        {/* Lista Giocatori */}
        <div className="players-section">
          <h3 className="section-title">
            <span>👥</span> Giocatori
          </h3>
          
          <div className="players-list">
            {lineupPlayers.map((player, index) => (
              <div 
                key={index} 
                className={`player-row ${player.playerId ? 'player-row-filled' : ''} ${player.isCaptain ? 'player-row-captain' : ''}`}
              >
                <span className="player-number">#{index + 1}</span>
                
                <select
                  className="player-select-compact"
                  value={player.playerId}
                  onChange={(e) => handlePlayerChange(index, e.target.value)}
                >
                  <option value="">Giocatore...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {getSurname(p.name)}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  max={99}
                  className="number-input-compact"
                  value={player.number}
                  onChange={(e) => handleNumberChange(index, parseInt(e.target.value) || 1)}
                  placeholder="N°"
                />

                <button
                  className={`captain-btn ${player.isCaptain ? 'captain-btn-active' : ''}`}
                  onClick={() => handleCaptainChange(index)}
                  disabled={!player.playerId}
                  title={player.isCaptain ? 'Capitano' : 'Imposta capitano'}
                >
                  <span className="captain-c">C</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Contatore e Azioni */}
        <div className="lineup-actions-mobile">
          {/* Contatore giocatori */}
          <div className="lineup-counter-bottom">
            <span className="counter-value">{filledPlayersCount}</span>
            <span className="counter-label">/ 11 giocatori</span>
          </div>

          <Button 
            onClick={generate} 
            disabled={loading || filledPlayersCount !== 11 || !opponentTeam.trim()}
            loading={loading}
            size="large"
            className="generate-btn-mobile"
          >
            {loading ? '⏳ Generazione...' : '✨ Genera Formazione'}
          </Button>
          
          {filledPlayersCount !== 11 && (
            <p className="helper-text">
              Seleziona tutti gli 11 giocatori per continuare
            </p>
          )}
          
          {filledPlayersCount === 11 && !opponentTeam.trim() && (
            <p className="helper-text">
              Inserisci il nome della squadra avversaria
            </p>
          )}
        </div>

        {/* Errore */}
        {error && (
          <div className="error-section-mobile">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
            <Button 
              onClick={reset}
              variant="secondary"
              size="medium"
              className="retry-btn"
            >
              Riprova
            </Button>
          </div>
        )}
        
        {/* Anteprima */}
        {generatedImageUrl && (
          <div className="preview-section-mobile">
            <h3 className="preview-title">
              <span>🎉</span> Formazione Generata
            </h3>
            <div className="image-container-mobile">
              <img src={generatedImageUrl} alt="Lineup" className="lineup-image-mobile" />
            </div>
            <div className="preview-actions-mobile">
              <Button 
                onClick={() => window.open(generatedImageUrl, '_blank', 'noopener,noreferrer')}
                variant="secondary"
                size="large"
                className="action-btn-mobile"
              >
                📱 Apri
              </Button>
              <a
                className="download-btn-mobile"
                href={generatedImageUrl}
                download={`lineup_${Date.now()}.png`}
              >
                💾 Scarica
              </a>
              <Button 
                onClick={reset}
                variant="secondary"
                size="large"
                className="action-btn-mobile"
              >
                🔄 Nuova Formazione
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageTemplate>
  );
};

export default Formazione;