import React, {useState} from 'react';
import './VideoForm.css';
import {players} from './players';

const VideoForm: React.FC = () => {
  const [playerId, setPlayerId] = useState('');
  const [minuteGoal, setMinuteGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!playerId) {
      alert('Seleziona un giocatore');
      return;
    }
    if (!minuteGoal) {
      alert('Inserisci il minuto del gol');
      return;
    }
    setLoading(true);
    setGeneratedUrl(null);
    const payload = {
      playerId,
      minuteGoal,
    };

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        setGeneratedUrl(json.video);
      } else {
        alert(json.error || 'Errore nella generazione');
      }
    } catch (err) {
      alert('Errore nella richiesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-form">
      <div className="form-section">
        <label className="form-label">
          Giocatore:
          <select
              className="form-input"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
          >
            <option value="">Seleziona...</option>
            {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Minuto del Gol:
          <input
              className="form-input"
              type="text"
              value={minuteGoal}
              onChange={(e) => setMinuteGoal(e.target.value)}
          />
        </label>
        <button className="form-button" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generazione in corso...' : 'Genera Video'}
        </button>
      </div>
      <div className="preview-container">
        {generatedUrl ? (
            <>
              <video className="video-preview" src={generatedUrl} controls />
              <a className="download-link" href={generatedUrl} download>
                Scarica video
              </a>
            </>
        ) : (
            <div className="preview-placeholder">Anteprima video</div>
        )}
      </div>
    </div>
  );
};

export default VideoForm;
