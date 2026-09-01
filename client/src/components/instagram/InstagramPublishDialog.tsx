import { useEffect, useRef, useState } from 'react';
import { INSTAGRAM_PUBLISH_URL } from '../../config/environment';
import {
  fingerprintInstagramImage,
  InstagramApiError,
  prepareInstagramImage,
  publishInstagramStory,
} from '../../services/instagramApi';
import {
  createInstagramAttempt,
  getOrCreateInstagramAttempt,
  type InstagramAttemptRecord,
  updateInstagramAttempt,
} from '../../services/instagramPublishState';
import { Button } from '../ui';
import './InstagramPublishDialog.css';

interface InstagramPublishDialogProps {
  imageUrl: string;
  endpoint?: string;
}

export function InstagramPublishDialog({ imageUrl, endpoint = INSTAGRAM_PUBLISH_URL }: InstagramPublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparationError, setPreparationError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(true);
  const [preparedImage, setPreparedImage] = useState<Blob | null>(null);
  const [fingerprint, setFingerprint] = useState('');
  const [attempt, setAttempt] = useState<InstagramAttemptRecord | null>(null);
  const [published, setPublished] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!endpoint) return undefined;
    let cancelled = false;
    void (async () => {
      try {
        const image = await prepareInstagramImage(imageUrl);
        const imageFingerprint = await fingerprintInstagramImage(image);
        const storedAttempt = getOrCreateInstagramAttempt(imageFingerprint);
        if (cancelled) return;
        setPreparedImage(image);
        setFingerprint(imageFingerprint);
        setAttempt(storedAttempt);
        setPublished(storedAttempt.status === 'PUBLISHED');
        setUncertain(storedAttempt.status === 'UNKNOWN');
      } catch (reason) {
        if (!cancelled) setPreparationError(reason instanceof Error ? reason.message : 'Impossibile preparare la grafica.');
      } finally {
        if (!cancelled) setPreparing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [endpoint, imageUrl]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => pinRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, loading]);

  if (!endpoint) return null;

  const close = () => {
    if (loading) return;
    setOpen(false);
    setPin('');
    setConfirmed(false);
    setError(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const startNewAttempt = () => {
    if (!fingerprint) return;
    const nextAttempt = createInstagramAttempt(fingerprint);
    setAttempt(nextAttempt);
    setPublished(false);
    setUncertain(false);
    setPin('');
    setConfirmed(false);
    setError(null);
    setOpen(true);
  };

  const publish = async () => {
    if (!/^\d{8,16}$/.test(pin)) {
      setError('Inserisci il PIN di pubblicazione (da 8 a 16 cifre).');
      pinRef.current?.focus();
      return;
    }
    if (!confirmed) {
      setError('Conferma di voler pubblicare la Storia.');
      return;
    }
    if (!preparedImage || !attempt || !fingerprint) {
      setError(preparationError || 'La grafica è ancora in preparazione. Riprova tra poco.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await publishInstagramStory(endpoint, preparedImage, pin, attempt.key);
      const publishedAttempt = updateInstagramAttempt(fingerprint, attempt, 'PUBLISHED', result.mediaId);
      setAttempt(publishedAttempt);
      setPublished(true);
      setUncertain(false);
      setOpen(false);
      setPin('');
      setConfirmed(false);
    } catch (reason) {
      if (reason instanceof InstagramApiError && reason.code === 'PUBLISH_STATUS_UNKNOWN') {
        const unknownAttempt = updateInstagramAttempt(fingerprint, attempt, 'UNKNOWN');
        setAttempt(unknownAttempt);
        setUncertain(true);
      }
      setError(reason instanceof Error ? reason.message : 'Pubblicazione non riuscita.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="instagram-publish-controls">
        <button
          ref={triggerRef}
          type="button"
          className={`instagram-publish-trigger${published ? ' instagram-publish-trigger--success' : ''}`}
          onClick={() => { setError(preparationError); setOpen(true); }}
          disabled={published || preparing}
        >
          <span aria-hidden="true">{published ? '✓' : '◎'}</span>
          {published ? 'Pubblicata su Instagram' : preparing ? 'Preparazione...' : uncertain ? 'Controlla pubblicazione' : 'Pubblica come Storia'}
        </button>
        {published && (
          <button type="button" className="instagram-republish-trigger" onClick={startNewAttempt}>
            Pubblica di nuovo
          </button>
        )}
      </div>

      {open && (
        <div className="instagram-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}>
          <section className="instagram-dialog" role="dialog" aria-modal="true" aria-labelledby="instagram-dialog-title">
            <button type="button" className="instagram-dialog-close" onClick={close} aria-label="Chiudi">×</button>
            <div className="instagram-dialog-brand" aria-hidden="true">◎</div>
            <h2 id="instagram-dialog-title">Pubblica la Storia</h2>
            <p className="instagram-dialog-destination">Destinazione <strong>@polisportiva.casalpoglio</strong></p>

            <div className="instagram-dialog-preview">
              <img src={imageUrl} alt="Anteprima della Storia da pubblicare" />
              <div><strong>La pubblicazione è immediata</strong><span>Meta può impiegare fino a 5 minuti. Non chiudere questa pagina durante l’elaborazione.</span></div>
            </div>

            {uncertain && (
              <div className="instagram-dialog-warning" role="alert">
                <strong>Controlla prima Instagram</strong>
                <span>L’esito del tentativo precedente non è certo. Se la Storia non è presente, crea volontariamente un nuovo tentativo.</span>
                <button type="button" onClick={startNewAttempt}>Ho controllato: nuovo tentativo</button>
              </div>
            )}

            <label className="instagram-pin-label" htmlFor="instagram-publisher-pin">PIN di pubblicazione</label>
            <input
              ref={pinRef}
              id="instagram-publisher-pin"
              className="instagram-pin-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 16))}
              minLength={8}
              maxLength={16}
              aria-describedby="instagram-pin-help"
            />
            <span id="instagram-pin-help" className="instagram-pin-help">Il PIN non viene memorizzato.</span>

            <label className="instagram-confirmation">
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>Confermo di voler pubblicare ora questa grafica come Storia.</span>
            </label>

            {error && <div className="instagram-dialog-error" role="alert">⚠️ {error}</div>}
            <div className="instagram-dialog-actions">
              <Button variant="outline" onClick={close} disabled={loading}>Annulla</Button>
              <Button onClick={publish} disabled={!confirmed || pin.length < 8 || preparing || !preparedImage || uncertain} loading={loading}>
                {loading ? 'Elaborazione Instagram...' : 'Pubblica ora'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
