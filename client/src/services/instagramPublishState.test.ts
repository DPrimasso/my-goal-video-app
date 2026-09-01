import { afterEach, describe, expect, it } from 'vitest';
import {
  createInstagramAttempt,
  getOrCreateInstagramAttempt,
  INSTAGRAM_ATTEMPT_TTL_MS,
  updateInstagramAttempt,
} from './instagramPublishState';

afterEach(() => sessionStorage.clear());

describe('stato locale della pubblicazione Instagram', () => {
  it('riutilizza lo stesso tentativo per la stessa immagine', () => {
    const first = getOrCreateInstagramAttempt('fingerprint', 1_000);
    const restored = getOrCreateInstagramAttempt('fingerprint', 2_000);
    expect(restored.key).toBe(first.key);
  });

  it('ripristina una pubblicazione confermata senza memorizzare il PIN', () => {
    const attempt = getOrCreateInstagramAttempt('fingerprint', 1_000);
    updateInstagramAttempt('fingerprint', attempt, 'PUBLISHED', 'media-id', 2_000);
    const restored = getOrCreateInstagramAttempt('fingerprint', 3_000);
    expect(restored).toMatchObject({ key: attempt.key, status: 'PUBLISHED', mediaId: 'media-id' });
    expect(JSON.stringify(sessionStorage)).not.toContain('pin');
  });

  it('crea una nuova chiave soltanto per una ripubblicazione esplicita', () => {
    const first = getOrCreateInstagramAttempt('fingerprint', 1_000);
    const republish = createInstagramAttempt('fingerprint', 2_000);
    expect(republish.key).not.toBe(first.key);
    expect(getOrCreateInstagramAttempt('fingerprint', 3_000).key).toBe(republish.key);
  });

  it('elimina i tentativi dopo 24 ore', () => {
    const first = getOrCreateInstagramAttempt('fingerprint', 1_000);
    const expired = getOrCreateInstagramAttempt('fingerprint', 1_000 + INSTAGRAM_ATTEMPT_TTL_MS);
    expect(expired.key).not.toBe(first.key);
  });
});
