import React, {useState} from 'react';
import './VideoForm.css';
import {players} from './players';
import {forceDownload} from './utils/download';

const START_URL = process.env.REACT_APP_START_RENDER_URL!;
const STATUS_URL = process.env.REACT_APP_RENDER_STATUS_URL!;
const AWS_REGION = process.env.REACT_APP_AWS_REGION || 'eu-west-1';
const S3_PUBLIC_BASE = process.env.REACT_APP_S3_PUBLIC_BASE || '';
const ASSET_BUCKET = process.env.REACT_APP_ASSET_BUCKET || '';
const POLL_INTERVAL_MS = Number(process.env.REACT_APP_POLL_INTERVAL_MS || 2000);
const MAX_ATTEMPTS = Number(process.env.REACT_APP_MAX_POLL_ATTEMPTS || 300);

// Costruisce l'URL pubblico in modo resiliente
const urlFromStatus = (
  status: any,
  bucketName: string,
  region: string,
  s3Base: string
): string | null => {
  // 1) Se outputFile è già una URL assoluta, usala così com'è
  if (typeof status.outputFile === 'string' && /^https?:\/\//i.test(status.outputFile)) {
    return status.outputFile;
  }

  // 2) Altrimenti usa una chiave: preferisci outKey, poi outputFile
  const key = status.outKey || status.outputFile;
  if (!key) return null;

  // 3) Bucket: preferisci outBucket, altrimenti quello dello start
  const bucket = status.outBucket || bucketName;
  if (!bucket) return null;

  const base = s3Base ? s3Base : `https://${bucket}.s3.${region}.amazonaws.com`;
  return `${base}/${key}`;
};

// Se è già una URL assoluta la lascia com'è; se è una chiave tipo "players/7.png" e conosciamo il bucket, la trasformiamo in URL S3
const makeAbsoluteIfKey = (value: string): string => {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value; // già assoluta
  if (!ASSET_BUCKET) return value;               // lascio che normalizzi la Lambda
  const key = value.replace(/^\/+/, '');
  return `https://${ASSET_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
};

type StartResp = { bucketName: string; renderId: string; error?: string };
type StatusResp = {
  overallProgress?: number;
  outputFile?: string;        // può essere URL assoluta o chiave S3
  outKey?: string;            // chiave S3 (alcune versioni la restituiscono)
  outBucket?: string;         // bucket di output (alcune versioni lo restituiscono)
  errors?: any[];
  error?: string;
};

const VideoForm: React.FC = () => {
  const [playerId, setPlayerId] = useState('');
  const [minuteGoal, setMinuteGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = async () => {
    if (!START_URL || !STATUS_URL) {
      alert('Config mancante: START_URL o STATUS_URL');
      return;
    }
    if (!playerId) { alert('Seleziona un giocatore'); return; }
    if (!minuteGoal) { alert('Inserisci il minuto del gol'); return; }

    if (isNaN(Number(minuteGoal)) || Number(minuteGoal) < 0) {
      alert('Il minuto del gol deve essere un numero positivo');
      return;
    }

    const selected = players.find(p => p.id === playerId);
    const playerNameVal = selected?.name || '';
    const rawPlayerImage = selected?.image || '';
    const playerImageUrl = makeAbsoluteIfKey(rawPlayerImage);

    setLoading(true);
    setGeneratedUrl(null);
    setProgress(0);

    try {
      const payload = {
        compositionId: 'GoalComp',
        inputProps: {
          playerId,
          playerName: playerNameVal,
          minuteGoal: Number(minuteGoal),
          s3PlayerUrl: playerImageUrl,
          overlayImage: playerImageUrl,
        },
      };

      // 1) Avvio render
      const startRes = await fetch(START_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let startJson: StartResp;
      try {
        startJson = await startRes.json();
      } catch {
        throw new Error('Risposta non valida da start-render');
      }

      if (!startRes.ok || !startJson.renderId || !startJson.bucketName) {
        throw new Error(startJson.error || 'Errore start-render');
      }

      const { bucketName, renderId } = startJson;

      // 2) Polling stato
      let attempts = 0;
      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

      while (attempts < MAX_ATTEMPTS) {
        attempts += 1;

        const url = new URL(STATUS_URL);
        url.searchParams.set('bucketName', bucketName);
        url.searchParams.set('renderId', renderId);

        const stRes = await fetch(url.toString(), { method: 'GET' });
        let stJson: StatusResp;
        try {
          stJson = await stRes.json();
        } catch {
          throw new Error('Risposta non valida da render-status');
        }

        if (!stRes.ok) {
          throw new Error(stJson.error || 'Errore render-status');
        }

        const p = Math.round(((stJson.overallProgress || 0) * 100));
        if (!Number.isNaN(p)) setProgress(p);

        if (stJson.errors && stJson.errors.length) {
          const msg = stJson.errors
            .map((e: any) => typeof e === 'string' ? e : e?.message || e?.stack || JSON.stringify(e))
            .join(' | ');
          throw new Error(msg);
        }

        const maybeUrl = urlFromStatus(stJson, bucketName, AWS_REGION, S3_PUBLIC_BASE);
        if (maybeUrl) {
          setGeneratedUrl(maybeUrl);
          setLoading(false);
          return;
        }

        await sleep(POLL_INTERVAL_MS);
      }

      throw new Error('Timeout in attesa del render');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Errore nella generazione');
    } finally {
      setLoading(false);
    }
  };

  // Forza il download del video provando prima via fetch+Blob
  const downloadVideo = async () => {
    if (!generatedUrl) return;
    try {
      setDownloading(true);
      const namePart = playerId ? `player-${playerId}` : 'video';
      const minutePart = minuteGoal ? `-min-${minuteGoal}` : '';
      const filename = `goal-${namePart}${minutePart}.mp4`;
      await forceDownload(generatedUrl, filename);
    } catch (e) {
      // Se CORS blocca il fetch o c'è un errore, apro in una nuova scheda
      window.open(generatedUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
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
                type="number"
                min="0"
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
                <div style={{display: 'flex', gap: 12, alignItems: 'center', marginTop: 8}}>
                  <button className="form-button" onClick={downloadVideo} disabled={downloading}>
                    {downloading ? 'Preparazione download…' : 'Scarica video'}
                  </button>
                  <a className="download-link" href={generatedUrl} target="_blank" rel="noopener noreferrer">
                    Apri in nuova scheda
                  </a>
                </div>
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