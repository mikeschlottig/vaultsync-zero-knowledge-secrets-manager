/**
 * VaultSync Crypto Utilities
 * Uses Web Crypto API for Zero-Knowledge operations
 */
const ITERATIONS = 100000;
const ALGO = 'AES-GCM';
export async function deriveKey(password: string, saltStr: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const salt = encoder.encode(saltStr);
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGO, length: 256 },
    true, // Set to true to allow exporting the key for service token wrapping
    ['encrypt', 'decrypt']
  );
}
export async function exportKeyRaw(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}
export async function encryptValue(key: CryptoKey, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    data
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}
export async function decryptValue(key: CryptoKey, ciphertext: string, iv: string): Promise<string> {
  const decoder = new TextDecoder();
  const data = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const ivData = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt(
    { name: ALGO, iv: ivData },
    key,
    data
  );
  return decoder.decode(decrypted);
}