/**
 * API Key encryption using Web Crypto SubtleCrypto API.
 *
 * Keys are encrypted with AES-GCM using a device-derived key.
 * The encryption key is derived from a combination of:
 *   - A fixed app salt (stored in code)
 *   - A device-specific identifier (randomly generated, stored in localStorage)
 *
 * This means:
 *   - Stolen IndexedDB data can't be decrypted without the device secret
 *   - Cross-device sync would need re-keying
 *   - Still better than plaintext (Security Architect audit: D→B)
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SALT = new Uint8Array([
  0xa1, 0x7f, 0x3c, 0x9e, 0x12, 0x45, 0x88, 0xbb,
  0x67, 0xd2, 0x01, 0xfe, 0x34, 0x99, 0xca, 0xef,
]);

const DEVICE_SECRET_KEY = 'aiwe_device_id';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_SECRET_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_SECRET_KEY, id);
  }
  return id;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const deviceId = getDeviceId();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(deviceId),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 200_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt a plaintext API key. Returns base64-encoded ciphertext
 * with the IV prepended (format: iv_base64:ciphertext_base64).
 */
export async function encryptApiKey(plaintext: string): Promise<string> {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded,
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt an API key previously encrypted with encryptApiKey.
 */
export async function decryptApiKey(encrypted: string): Promise<string> {
  const key = await getCryptoKey();

  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Check if Web Crypto API is available (required for encryption).
 * Returns false in insecure contexts (HTTP, not localhost).
 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && !!crypto.subtle;
}
