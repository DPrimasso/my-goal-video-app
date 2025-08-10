import React, {useState} from 'react';
import './VideoForm.css';
import {players} from './players';

const START_URL = process.env.REACT_APP_START_RENDER_URL!;
const STATUS_URL = process.env.REACT_APP_RENDER_STATUS_URL!;
const AWS_REGION = process.env.REACT_APP_AWS_REGION || 'eu-west-1';
const S3_PUBLIC_BASE = process.env.REACT_APP_S3_PUBLIC_BASE || '';

type StartResp = { bucketName: string; renderId: string };
type StatusResp = {
  overallProgress?: number;
  outputFile?: string;        // chiave S3 del file finale
  errors?: string[];
};

const VideoForm: React.FC = () => {
  const [playerId, setPlayerId] = useState('');
  const [minuteGoal, setMinuteGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!playerId) { alert('Seleziona un giocatore'); return; }
    if (!minuteGoal) { alert('Inserisci il minuto del gol'); return; }

    setLoading(true);
    setGeneratedUrl(null);
    setProgress(0);

    try {
      // 1) Avvio render
      const startRes = await fetch(START_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositionId: 'GoalComp',           // usa la tua composition
          inputProps: { playerId, minuteGoal } // parametri per il video
        })
      });

      const startJson: StartResp | {error?: string} = await startRes.json();
      if (!startRes.ok || !(startJson as StartResp).renderId) {
        throw new Error((startJson as any).error || 'Errore start-render');
      }

      const { bucketName, renderId } = startJson as StartResp;

      // 2) Polling stato
      let attempts = 0;
      const maxAttempts = 300; // ~10 minuti con interval 2s
      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

      while (attempts < maxAttempts) {
        attempts += 1;

        const url = new URL(STATUS_URL);
        url.searchParams.set('bucketName', bucketName);
        url.searchParams.set('renderId', renderId);

        const stRes = await fetch(url.toString(), { method: 'GET' });
        const stJson: StatusResp = await stRes.json();

        if (!stRes.ok) {
          throw new Error((stJson as any).error || 'Errore render-status');
        }

        const p = Math.round(((stJson.overallProgress || 0) * 100));
        setProgress(p);

        if (stJson.errors && stJson.errors.length) {
          throw new Error(stJson.errors.join(' | '));
        }

        if (stJson.outputFile) {
          // Costruisci un URL pubblico per l’anteprima:
          // 1) se hai impostato REACT_APP_S3_PUBLIC_BASE, usalo
          // 2) altrimenti prova a costruire l’URL standard S3
          const finalUrl = S3_PUBLIC_BASE
              ? `${S3_PUBLIC_BASE}/${stJson.outputFile}`
              : `https://${bucketName}.s3.${AWS_REGION}.amazonaws.com/${stJson.outputFile}`;

          setGeneratedUrl(finalUrl);
          setLoading(false);
          return;
        }

        await sleep(2000);
      }

      throw new Error('Timeout in attesa del render');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Errore nella generazione');
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
                  <option key={p.id} value={p.id}>{p.name}</option>
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
                placeholder="es. 78"
            />
          </label>

          <button className="form-button" onClick={handleGenerate} disabled={loading}>
            {loading ? `Generazione... ${progress}%` : 'Genera Video'}
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
              <div className="preview-placeholder">
                {loading ? `Progresso: ${progress}%` : 'Anteprima video'}
              </div>
          )}
        </div>
      </div>
  );
};

export default VideoForm;