// Parolalı kasa: parola koyulursa defter bu cihazda AES-GCM ile şifreli saklanır.
// Anahtar parolandan PBKDF2 ile türetilir ve yalnızca bellekte durur; parola hiçbir yere yazılmaz.
// Parola unutulursa defter açılamaz. Bu bir hata değil, özelliğin kendisi.

import { cleanPerson } from './model.js';
import { DATA_KEY } from './store.js';

export const VAULT_KEY = 'mimlesek.kasa';
export const VAULT_ITERATIONS = 600000;
export const MIN_PASSWORD = 4;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const cryptoAvailable = () => !!(globalThis.crypto && globalThis.crypto.subtle);

function toB64(bytes) {
  const a = new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromB64(b64) {
  const s = atob(b64);
  const a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
  return a;
}

function readVaultBox() {
  try {
    const box = JSON.parse(localStorage.getItem(VAULT_KEY) || 'null');
    return box && box.salt && box.iv && box.veri && Number(box.tekrar) > 0 ? box : null;
  } catch {
    return null;
  }
}

export const hasVault = () => readVaultBox() !== null;

async function deriveKey(password, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', textEncoder.encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function sealPeople(key, salt, iterations, people) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, textEncoder.encode(JSON.stringify(people)));
  return {
    surum: 1,
    sifre: 'AES-GCM-256',
    turetme: 'PBKDF2-SHA256',
    tekrar: iterations,
    salt: toB64(salt),
    iv: toB64(iv),
    veri: toB64(data),
  };
}

/** Açık kasanın oturumu: anahtar bellekte tutulur, her kayıtta tüm defter yeniden şifrelenir. */
function vaultSession(key, salt, iterations) {
  let chain = Promise.resolve();
  return {
    save(people) {
      const snapshot = structuredClone(people);
      chain = chain.catch(() => {}).then(async () => {
        const box = await sealPeople(key, salt, iterations, snapshot);
        try { localStorage.setItem(VAULT_KEY, JSON.stringify(box)); } catch { throw { code: 'local_unavailable' }; }
      });
      return chain;
    },
  };
}

/** Kasayı parolayla açar. Parola yanlışsa { code: 'wrong_password' } fırlatır. */
export async function openVault(password) {
  const box = readVaultBox();
  if (!box) throw { code: 'no_vault' };
  const salt = fromB64(box.salt);
  const key = await deriveKey(password, salt, box.tekrar);
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(box.iv) }, key, fromB64(box.veri));
  } catch {
    throw { code: 'wrong_password' };
  }
  const raw = JSON.parse(textDecoder.decode(plain));
  const people = Array.isArray(raw) ? raw.map((p) => cleanPerson(p)).filter(Boolean) : [];
  return { people, session: vaultSession(key, salt, box.tekrar) };
}

/** Yeni parola koyar: defteri şifreler, şifresiz kopyayı siler. */
export async function createVault(password, people, iterations = VAULT_ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, iterations);
  const session = vaultSession(key, salt, iterations);
  await session.save(people);
  try { localStorage.removeItem(DATA_KEY); } catch { /* yoksay */ }
  return session;
}

/** Parolayı kaldırır: defter yeniden şifresiz saklanır. */
export function removeVault(people) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(people));
  } catch {
    throw { code: 'local_unavailable' };
  }
  localStorage.removeItem(VAULT_KEY);
}

/** "Parolamı unuttum": kilitli defteri kalıcı olarak siler. */
export function destroyVault() {
  try {
    localStorage.removeItem(VAULT_KEY);
    localStorage.removeItem(DATA_KEY);
  } catch { /* yoksay */ }
}

export function createVaultStore(session) {
  return {
    kind: 'vault',
    put: (_p, all) => session.save(all),
    remove: (_id, all) => session.save(all),
    sync: (_changed, _removed, all) => session.save(all),
  };
}
