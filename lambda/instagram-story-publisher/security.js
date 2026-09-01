const crypto = require('node:crypto');

const PIN_PATTERN = /^\d{8,16}$/;
const HASH_BYTES = 32;
const PBKDF2_ITERATIONS = 210_000;

function validatePinFormat(pin) {
  return typeof pin === 'string' && PIN_PATTERN.test(pin);
}

function derivePinHash(pin, salt) {
  return crypto.pbkdf2Sync(pin, Buffer.from(salt, 'base64'), PBKDF2_ITERATIONS, HASH_BYTES, 'sha256');
}

function verifyPin(pin, salt, expectedHash) {
  if (!validatePinFormat(pin) || typeof salt !== 'string' || typeof expectedHash !== 'string') return false;
  let expected;
  try {
    expected = Buffer.from(expectedHash, 'hex');
  } catch {
    return false;
  }
  if (expected.length !== HASH_BYTES) return false;
  return crypto.timingSafeEqual(derivePinHash(pin, salt), expected);
}

function createPinHash(pin, salt = crypto.randomBytes(16).toString('base64')) {
  if (!validatePinFormat(pin)) throw new Error('Il PIN deve contenere da 8 a 16 cifre.');
  return { pinSalt: salt, pinHash: derivePinHash(pin, salt).toString('hex') };
}

module.exports = { createPinHash, validatePinFormat, verifyPin };
