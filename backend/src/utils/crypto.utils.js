'use strict';
const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Encrypt sensitive data using AES-256-GCM
 */
const encrypt = (plaintext) => {
  if (!plaintext) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(
    config.encryption.key,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, authTag, encrypted]).toString('hex');
};

/**
 * Decrypt AES-256-GCM encrypted data
 */
const decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  const buf = Buffer.from(ciphertext, 'hex');
  const salt = buf.subarray(0, SALT_LENGTH);
  const iv = buf.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = buf.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buf.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const key = crypto.pbkdf2Sync(
    config.encryption.key,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
};

/**
 * Generate a cryptographically secure random token
 */
const generateSecureToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString('hex');

/**
 * Hash a value using SHA-256 (for non-password data like tokens)
 */
const hashSHA256 = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');

/**
 * Constant-time comparison to prevent timing attacks
 */
const safeCompare = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = { encrypt, decrypt, generateSecureToken, hashSHA256, safeCompare };
