import React, { useState } from 'react';
import { PageTemplate } from '../components/layout';
import { Button } from '../components/ui';
import { players, getSurname } from '../players';
import { useFormationVideoGeneration } from '../hooks/useFormationVideoGeneration';
import { isDevelopment } from '../config/environment';
import './Formazione.css';

function getPlayerIdFromName(playerName: string): any {
    const player = players.find(p => getSurname(p.name) === playerName);
    return player ? player.id : '';
}

function getRandomPlayerId(): string {
    const randomIndex = Math.floor(Math.random() * players.length);
    return players[randomIndex]?.id || '';
}

// Funzione per convertire un ID giocatore in un oggetto FormationPlayer
function getFormationPlayer(playerId: string) {
  if (!playerId || playerId.trim() === '') {
    return null;
  }
  const player = players.find(p => p.id === playerId);
  if (!player) {
    return null;
  }
  
  return {
    name: player.name,
    image: player.image
  };
}

const Formazione: React.FC = () => {
  const [goalkeeper, setGoalkeeper] = useState(getRandomPlayerId() || '');
  const [defenders, setDefenders] = useState<string[]>([
    getRandomPlayerId() || '',
    getRandomPlayerId() || '',
    '',
    getRandomPlayerId() || '',
    getRandomPlayerId() || '',
  ]);
  const [midfielders, setMidfielders] = useState<string[]>([
    '',
    getRandomPlayerId() || '',
    getRandomPlayerId() || '',
    getRandomPlayerId() || '',
    '',
  ]);
  const [attackingMidfielders, setAttackingMidfielders] = useState<string[]>([
    '',
    getRandomPlayerId() || '',
    '',
  ]);
  const [forwards, setForwards] = useState<string[]>([
    '', // Esterno sx
    getRandomPlayerId() || '', // Attaccante sx
    '', // Attaccante cr
    getRandomPlayerId() || '', // Attaccante dx
    '', // Esterno dx
  ]);

  const { loading, progress, generatedUrl, error, generateVideo, reset } = useFormationVideoGeneration();

  // Error boundary for the component
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('🚨 Formazione component error:', error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Debug logging for re-renders
  if (generatedUrl && isDevelopment()) {
    console.log('🎯 Formation video ready for preview:', generatedUrl);
  }

  const handleArrayChange = (
      setter: React.Dispatch<React.SetStateAction<string[]>>,
      arr: string[],
      index: number
  ) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const copy = [...arr];
    copy[index] = e.target.value;
    setter(copy);
  };

  const generate = async () => {
    if (!goalkeeper) {
      alert('Seleziona il portiere');
      return;
    }
    const totalPlayers = [
      goalkeeper,
      ...defenders,
      ...midfielders,
      ...attackingMidfielders,
      ...forwards,
    ].filter(Boolean).length;
    if (totalPlayers !== 11) {
      alert('Seleziona 11 giocatori');
      return;
    }

    // Converti gli ID in oggetti FormationPlayer e mantieni la struttura delle posizioni
    const goalkeeperPlayer = getFormationPlayer(goalkeeper);
    if (!goalkeeperPlayer) {
      alert('Errore: portiere non valido');
      return;
    }
    
    const defendersPlayers = defenders.map(getFormationPlayer);
    const midfieldersPlayers = midfielders.map(getFormationPlayer);
    const attackingMidfieldersPlayers = attackingMidfielders.map(getFormationPlayer);
    const forwardsPlayers = forwards.map(getFormationPlayer);

    const payload = {
      goalkeeper: goalkeeperPlayer, 
      defenders: defendersPlayers, 
      midfielders: midfieldersPlayers, 
      attackingMidfielders: attackingMidfieldersPlayers, 
      forwards: forwardsPlayers
    };

    try {
      await generateVideo(payload);
    } catch (err) {
      console.error('Error in formation video generation:', err);
    }
  };

  const renderSelect = (value: string, onChange: any) => (
      <select className="player-select" value={value} onChange={onChange}>
        <option value="">--</option>
        {players.map((p) => (
            <option key={p.id} value={p.id}>
              {getSurname(p.name)}
            </option>
        ))}
      </select>
  );

  return (
    <PageTemplate
      title="Formazione Titolare"
      description="Seleziona 11 giocatori nelle loro posizioni"
      icon="🏟️"
    >
      <div className="formation-container">
        <div className="formation-field-container">
          <div
              className="field"
              style={{backgroundImage: `url(${process.env.PUBLIC_URL}/campo_da_calcio.png)`}}
          >
            <div className="position" style={{top: '80%', left: '50%'}}>
              {renderSelect(goalkeeper, (e: any) => setGoalkeeper(e.target.value))}
            </div>
            {defenders.map((d, i) => (
                <div
                    key={`def-${i}`}
                    className="position"
                    style={{top: '65%', left: ['10%','30%','50%','70%','90%'][i]}}
                >
                  {renderSelect(d, handleArrayChange(setDefenders, defenders, i))}
                </div>
            ))}
            {midfielders.map((m, i) => (
                <div
                    key={`mid-${i}`}
                    className="position"
                    style={{top: '50%', left: ['10%','30%','50%','70%','90%'][i]}}
                >
                  {renderSelect(m, handleArrayChange(setMidfielders, midfielders, i))}
                </div>
            ))}
            {attackingMidfielders.map((t, i) => (
                <div
                    key={`treq-${i}`}
                    className="position"
                    style={{top: '35%', left: ['30%','50%','70%'][i]}}
                >
                  {renderSelect(t, handleArrayChange(setAttackingMidfielders, attackingMidfielders, i))}
                </div>
            ))}
            {forwards.map((f, i) => (
                <div
                    key={`fwd-${i}`}
                    className="position"
                    style={{top: '20%', left: ['10%','30%','50%','70%','90%'][i]}}
                >
                  {renderSelect(f, handleArrayChange(setForwards, forwards, i))}
                </div>
            ))}
          </div>
          
          <div className="formation-actions">
            <Button 
              onClick={generate} 
              disabled={loading}
              loading={loading}
              size="large"
              className="formation-generate-btn"
            >
              {loading ? 'Generazione...' : 'Genera Video'}
            </Button>
            
            {generatedUrl && (
              <Button 
                onClick={reset}
                variant="secondary"
                size="medium"
                className="formation-reset-btn"
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
                <div className="placeholder-icon">🎥</div>
                <h3>Anteprima Video</h3>
                <p>Organizza la formazione e genera il tuo video personalizzato</p>
              </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
};

export default Formazione;
