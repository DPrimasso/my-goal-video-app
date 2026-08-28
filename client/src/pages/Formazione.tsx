import { useEffect, useRef, useState } from 'react';
import { PageTemplate } from '../components/layout';
import { Button } from '../components/ui';
import { players } from '../catalog';
import { getEndpoint } from '../config/environment';
import { useGeneratedImage } from '../hooks';
import { requestGeneratedImage } from '../services/imageApi';
import type { LineupImagePayload, LineupPlayer } from '../types';
import './Formazione.css';

const COOKIE_NAME = 'savedFormation';
const emptyLineup = (): LineupPlayer[] => Array.from({ length: 11 }, (_, index) => ({
  playerId: '',
  number: index + 1,
  isCaptain: false,
}));

function readSavedLineup(): { players: LineupPlayer[]; opponentTeam: string } | null {
  const entry = document.cookie.split(';').map((value) => value.trim()).find((value) => value.startsWith(`${COOKIE_NAME}=`));
  if (!entry) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(entry.slice(COOKIE_NAME.length + 1))) as {
      players?: LineupPlayer[];
      lineupPlayers?: Array<LineupPlayer & { playerName?: string }>;
      opponentTeam?: string;
    };
    const savedPlayers = parsed.players || parsed.lineupPlayers;
    if (!Array.isArray(savedPlayers) || savedPlayers.length !== 11) return null;
    const knownIds = new Set(players.map((player) => player.id));
    return {
      players: savedPlayers.map((player, index) => ({
        playerId: knownIds.has(player.playerId) ? player.playerId : '',
        number: Number.isInteger(player.number) && player.number >= 1 && player.number <= 99 ? player.number : index + 1,
        isCaptain: Boolean(player.isCaptain),
      })),
      opponentTeam: typeof parsed.opponentTeam === 'string' ? parsed.opponentTeam.slice(0, 80) : '',
    };
  } catch {
    return null;
  }
}

export default function Formazione() {
  const [saved] = useState(() => readSavedLineup());
  const [lineup, setLineup] = useState<LineupPlayer[]>(saved?.players || emptyLineup());
  const [opponentTeam, setOpponentTeam] = useState(saved?.opponentTeam || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { url: generatedImageUrl, replace: replaceImage, reset: resetImage } = useGeneratedImage();
  const errorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const value = encodeURIComponent(JSON.stringify({ players: lineup, opponentTeam }));
    document.cookie = `${COOKIE_NAME}=${value};max-age=31536000;path=/;SameSite=Lax`;
  }, [lineup, opponentTeam]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (generatedImageUrl) previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [generatedImageUrl]);

  const selectedIds = new Set(lineup.map((player) => player.playerId).filter(Boolean));
  const filledPlayersCount = selectedIds.size;

  const updatePlayer = (index: number, playerId: string) => {
    setLineup((current) => current.map((entry, entryIndex) => {
      if (entryIndex !== index) return entry;
      const player = players.find((candidate) => candidate.id === playerId);
      return {
        playerId,
        number: player?.defaultNumber || entry.number || index + 1,
        isCaptain: playerId ? entry.isCaptain : false,
      };
    }));
  };

  const updateNumber = (index: number, value: string) => {
    const number = Math.min(99, Math.max(1, Number.parseInt(value, 10) || 1));
    setLineup((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, number } : entry));
  };

  const toggleCaptain = (index: number) => {
    setLineup((current) => current.map((entry, entryIndex) => ({
      ...entry,
      isCaptain: entryIndex === index ? !entry.isCaptain : false,
    })));
  };

  const generate = async () => {
    const ids = lineup.map((player) => player.playerId);
    if (ids.some((id) => !id)) {
      setError('Seleziona esattamente undici giocatori.');
      return;
    }
    if (new Set(ids).size !== 11) {
      setError('Ogni giocatore può comparire una sola volta.');
      return;
    }
    if (!opponentTeam.trim()) {
      setError('Inserisci il nome della squadra avversaria.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: LineupImagePayload = { players: lineup, opponentTeam: opponentTeam.trim() };
      replaceImage(await requestGeneratedImage(getEndpoint('lineup'), payload));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Errore durante la generazione della formazione.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate title="Starting XI" description="Componi gli undici titolari e genera la grafica ufficiale." icon="📋">
      <div className="lineup-container">
        <section className="card opponent-section">
          <label className="opponent-label" htmlFor="opponent-team">⚽ Squadra avversaria</label>
          <input
            id="opponent-team"
            type="text"
            className="opponent-input-mobile"
            value={opponentTeam}
            onChange={(event) => setOpponentTeam(event.target.value.slice(0, 80))}
            placeholder="Squadra avversaria"
            maxLength={80}
          />
        </section>

        <section className="card players-section" aria-labelledby="players-heading">
          <h2 id="players-heading" className="section-title">👥 Giocatori</h2>
          <div className="players-list">
            {lineup.map((entry, index) => (
              <div key={index} className={`player-row ${entry.playerId ? 'player-row-filled' : ''} ${entry.isCaptain ? 'player-row-captain' : ''}`}>
                <span className="player-number" aria-hidden="true">#{index + 1}</span>
                <label className="sr-only" htmlFor={`lineup-player-${index}`}>Giocatore {index + 1}</label>
                <select
                  id={`lineup-player-${index}`}
                  className="player-select-compact"
                  value={entry.playerId}
                  onChange={(event) => updatePlayer(index, event.target.value)}
                >
                  <option value="">Giocatore...</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id} disabled={selectedIds.has(player.id) && player.id !== entry.playerId}>
                      {player.shortName}{player.assetKey ? '' : ' · foto fallback'}
                    </option>
                  ))}
                </select>
                <label className="sr-only" htmlFor={`lineup-number-${index}`}>Numero maglia di {entry.playerId ? players.find((player) => player.id === entry.playerId)?.shortName : `giocatore ${index + 1}`}</label>
                <input
                  id={`lineup-number-${index}`}
                  className="number-input-compact"
                  type="number"
                  min={1}
                  max={99}
                  value={entry.number}
                  onChange={(event) => updateNumber(index, event.target.value)}
                />
                <button
                  type="button"
                  className={`captain-btn ${entry.isCaptain ? 'captain-btn-active' : ''}`}
                  disabled={!entry.playerId}
                  onClick={() => toggleCaptain(index)}
                  aria-pressed={entry.isCaptain}
                  aria-label={`Imposta ${entry.playerId ? players.find((player) => player.id === entry.playerId)?.shortName : `giocatore ${index + 1}`} come capitano`}
                >C</button>
              </div>
            ))}
          </div>
          <div className="lineup-counter-bottom" aria-live="polite">
            <span className="counter-value">{filledPlayersCount}/11</span>
            <span className="counter-label">giocatori univoci</span>
          </div>
        </section>

        {error && <div ref={errorRef} tabIndex={-1} className="error-message" role="alert">⚠️ {error}</div>}

        <div className="form-actions">
          <Button onClick={generate} disabled={loading} loading={loading} size="large">
            {loading ? 'Generazione...' : '✨ Genera formazione'}
          </Button>
          {generatedImageUrl && <Button onClick={resetImage} variant="outline">Nuova formazione</Button>}
        </div>

        <div ref={previewRef} className="preview-section">
          {generatedImageUrl ? (
            <div className="image-preview">
              <div className="phone-frame"><div className="phone-frame-inner"><img src={generatedImageUrl} alt="Formazione titolare generata" className="goal-image" /></div></div>
              <div className="image-actions">
                <Button onClick={() => window.open(generatedImageUrl, '_blank', 'noopener,noreferrer')}>Apri PNG</Button>
                <a className="download-btn" href={generatedImageUrl} download="formazione.png">Scarica PNG</a>
              </div>
            </div>
          ) : (
            <div className="preview-placeholder"><div className="placeholder-icon">🏟️</div><h3>Anteprima formazione</h3><p>La grafica apparirà qui dopo la generazione.</p></div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
