import { useEffect, useRef, useState } from 'react';
import { INSTAGRAM_PUBLISH_URL } from '../../config/environment';
import { publishInstagramStory } from '../../services/instagramApi';
import { Button } from '../ui';
import './InstagramPublishDialog.css';

interface InstagramPublishDialogProps {
  imageUrl: string;
  endpoint?: string;
}

function newIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-instagram`;
}

export function InstagramPublishDialog({ imageUrl, endpoint = INSTAGRAM_PUBLISH_URL }: InstagramPublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const pinRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
    setLoading(true);
    setError(null);
    try {
      await publishInstagramStory(endpoint, imageUrl, pin, idempotencyKey);
      setPublished(true);
      setOpen(false);
      setPin('');
      setConfirmed(false);
      setIdempotencyKey(newIdempotencyKey());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Pubblicazione non riuscita.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`instagram-publish-trigger${published ? ' instagram-publish-trigger--success' : ''}`}
        onClick={() => { setError(null); setOpen(true); }}
        disabled={published}
      >
        <span aria-hidden="true">{published ? '✓' : '◎'}</span>
        {published ? 'Pubblicata su Instagram' : 'Pubblica come Storia'}
      </button>

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
              <div><strong>La pubblicazione è immediata</strong><span>La Storia sarà visibile su Instagram appena Meta completa l’elaborazione.</span></div>
            </div>

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
              <Button onClick={publish} disabled={!confirmed || pin.length < 8} loading={loading}>
                {loading ? 'Pubblicazione...' : 'Pubblica ora'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
