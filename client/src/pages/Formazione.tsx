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
        // La Lambda restituisce JSON con base64, lo decodifichiamo
        const data = await response.json();
        if (!data.success || !data.image) {
          throw new Error('Invalid response from Lambda');
        }
        // Convertiamo base64 in blob
        const byteCharacters = atob(data.image);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.contentType || 'image/png' });
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

  return (
    <PageTemplate
      title="Starting XI"
      description="Crea la formazione titolare con i tuoi giocatori"
      icon="📋"
    >
      <div className="lineup-container">
        <div className="lineup-form">
          <div className="lineup-section">
            <h3>Squadra Avversaria</h3>
            <Input
              type="text"
              value={opponentTeam}
              onChange={(value) => setOpponentTeam(value)}
              placeholder="Es: ASD Le Grazie"
              className="opponent-input"
            />
          </div>

          <div className="lineup-section">
            <h3>Giocatori (11)</h3>
            <div className="lineup-players-list">
              {lineupPlayers.map((player, index) => (
                <div key={index} className="lineup-player-row">
                  <select
                    className="lineup-player-select"
                    value={player.playerId}
                    onChange={(e) => handlePlayerChange(index, e.target.value)}
                  >
                    <option value="">-- Seleziona giocatore --</option>
        {players.map((p) => (
            <option key={p.id} value={p.id}>
              {getSurname(p.name)}
            </option>
        ))}
      </select>
                  
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={player.number.toString()}
                    onChange={(value) => handleNumberChange(index, parseInt(value) || 1)}
                    className="lineup-number-input"
                    placeholder="Numero"
                  />
                  
                  <label className="lineup-captain-label">
                    <input
                      type="checkbox"
                      checked={player.isCaptain}
                      onChange={() => handleCaptainChange(index)}
                      disabled={!player.playerId}
                    />
                    <span>Capitano</span>
                  </label>
                </div>
            ))}
                </div>
          </div>
          
          <div className="lineup-actions">
            <Button 
              onClick={generate} 
              disabled={loading}
              loading={loading}
              size="large"
              className="lineup-generate-btn"
            >
              {loading ? 'Generazione...' : 'Genera Immagine'}
            </Button>
            
            {generatedImageUrl && (
              <Button 
                onClick={reset}
                variant="secondary"
                size="medium"
                className="lineup-reset-btn"
              >
                Genera Nuova Immagine
              </Button>
            )}
          </div>
        </div>

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
          {generatedImageUrl ? (
            <div className="image-preview">
              <img src={generatedImageUrl} alt="Lineup" className="lineup-image" />
              <div className="image-actions">
                  <Button 
                  onClick={() => window.open(generatedImageUrl, '_blank', 'noopener,noreferrer')}
                    variant="secondary"
                    size="medium"
                  >
                    Apri in Nuova Scheda
                  </Button>
                <a
                  className="download-link"
                  href={generatedImageUrl}
                  download={`lineup_${Date.now()}.png`}
                >
                  Scarica immagine
                  </a>
                </div>
              </div>
          ) : (
              <div className="preview-placeholder">
              <div className="placeholder-icon">🖼️</div>
              <h3>Anteprima Lineup</h3>
              <p>Seleziona i giocatori e genera la tua formazione</p>
              </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
};

export default Formazione;