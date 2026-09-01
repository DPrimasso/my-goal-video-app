const STORAGE_PREFIX = 'instagram-publication:v1:';
export const INSTAGRAM_ATTEMPT_TTL_MS = 24 * 60 * 60 * 1000;

export type InstagramAttemptStatus = 'READY' | 'PUBLISHED' | 'UNKNOWN';

export interface InstagramAttemptRecord {
  key: string;
  status: InstagramAttemptStatus;
  mediaId?: string;
  updatedAt: number;
}

function newAttemptKey(): string {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2)}-instagram-attempt`;
}

function storageKey(fingerprint: string): string {
  return `${STORAGE_PREFIX}${fingerprint}`;
}

function readRecord(fingerprint: string, now = Date.now()): InstagramAttemptRecord | null {
  try {
    const raw = sessionStorage.getItem(storageKey(fingerprint));
    if (!raw) return null;
    const record = JSON.parse(raw) as Partial<InstagramAttemptRecord>;
    const valid = typeof record.key === 'string'
      && /^[A-Za-z0-9_-]{16,100}$/.test(record.key)
      && ['READY', 'PUBLISHED', 'UNKNOWN'].includes(record.status || '')
      && typeof record.updatedAt === 'number';
    if (!valid || now - record.updatedAt! >= INSTAGRAM_ATTEMPT_TTL_MS) {
      sessionStorage.removeItem(storageKey(fingerprint));
      return null;
    }
    return record as InstagramAttemptRecord;
  } catch {
    return null;
  }
}

export function saveInstagramAttempt(fingerprint: string, record: InstagramAttemptRecord): void {
  try {
    sessionStorage.setItem(storageKey(fingerprint), JSON.stringify(record));
  } catch {
    // La pubblicazione resta disponibile anche se lo storage del browser è disabilitato.
  }
}

export function createInstagramAttempt(fingerprint: string, now = Date.now()): InstagramAttemptRecord {
  const record: InstagramAttemptRecord = { key: newAttemptKey(), status: 'READY', updatedAt: now };
  saveInstagramAttempt(fingerprint, record);
  return record;
}

export function getOrCreateInstagramAttempt(fingerprint: string, now = Date.now()): InstagramAttemptRecord {
  return readRecord(fingerprint, now) || createInstagramAttempt(fingerprint, now);
}

export function updateInstagramAttempt(
  fingerprint: string,
  current: InstagramAttemptRecord,
  status: InstagramAttemptStatus,
  mediaId?: string,
  now = Date.now(),
): InstagramAttemptRecord {
  const record: InstagramAttemptRecord = { key: current.key, status, mediaId, updatedAt: now };
  saveInstagramAttempt(fingerprint, record);
  return record;
}
