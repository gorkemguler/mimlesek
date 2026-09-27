// Kayıt katmanı. Depolar aynı arayüzü paylaşır: put(kişi, tümü), remove(id, tümü), sync(değişenler, silinenler, tümü).
//  - yerel: tarayıcının localStorage'ı (web, masaüstü ve Android sürümleri)
//  - kasa: yerel deponun parolayla şifrelenmiş hâli (bkz. kasa.js)
//  - bulut: claude.ai Artifact içinde çalışırken, izleyiciye özel veritabanı alanı
//  - demo: hiçbir şey kaydetmeyen bellek deposu

import { cleanPerson } from './model.js';

export const DATA_KEY = 'mimlesek.v1';
export const PREFS_KEY = 'mimlesek.tercihler';

export const inArtifact = () => !!(window.claude && typeof window.claude.use === 'function');
/** Masaüstü ya da Android uygulaması olarak (Tauri kabuğunda) mı çalışıyoruz? */
export const inNativeShell = () => !!(window.__TAURI__ || window.__TAURI_INTERNALS__);

// ---------- Tercihler (her cihaza özel küçük ayarlar) ----------

const DEFAULT_PREFS = { tema: 'sistem', sonYedek: 0, otomatikKilit: 5, karsilandi: false };

export function readPrefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; }
  catch { return { ...DEFAULT_PREFS }; }
}
export function writePrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* özel pencere: tercih bu oturumla sınırlı */ }
}

// ---------- Yerel depo ----------

export function readLocalPeople() {
  try {
    const raw = JSON.parse(localStorage.getItem(DATA_KEY) || '[]');
    return Array.isArray(raw) ? raw.map((p) => cleanPerson(p)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeLocalPeople(all) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(all));
  } catch {
    throw { code: 'local_unavailable' };
  }
}

export function clearLocalPeople() {
  try { localStorage.removeItem(DATA_KEY); } catch { /* yoksay */ }
}

export function createLocalStore() {
  return {
    kind: 'local',
    async put(_p, all) { writeLocalPeople(all); },
    async remove(_id, all) { writeLocalPeople(all); },
    async sync(_changed, _removed, all) { writeLocalPeople(all); },
  };
}

export function createMemoryStore() {
  return {
    kind: 'demo',
    async put() {},
    async remove() {},
    async sync() {},
  };
}

// ---------- Bulut deposu (claude.ai Artifact) ----------

const personDoc = ({ id, ...rest }) => rest;

async function withRetry(fn) {
  try {
    return await fn();
  } catch (e) {
    if (e && e.code === 'unavailable') {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 900));
      return fn();
    }
    throw e;
  }
}

/** Artifact içinde, izleyicinin kendi özel alanına bağlanır. Mümkün değilse null döner. */
export async function connectCloud() {
  if (!inArtifact()) return null;
  let db = null;
  let user = null;
  let uid = null;
  try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch { return null; }
  if (!db || !user) return null;
  try { uid = await user.id(); } catch { return null; }
  if (!uid) return null;
  let col;
  try { col = db.collection('data/users/' + uid); } catch { return null; }

  // Aynı belgeye yazmalar sırayla gider.
  const queues = new Map();
  const enqueue = (id, task) => {
    const next = (queues.get(id) || Promise.resolve()).catch(() => {}).then(task);
    queues.set(id, next);
    return next;
  };

  const store = {
    kind: 'cloud',
    subscribe(onData, onError) {
      return col.onSnapshot(
        (snap) => onData(
          snap.docs.map((d) => cleanPerson(d.data(), d.id)).filter(Boolean),
          !(snap.metadata && snap.metadata.fromCache),
        ),
        onError,
      );
    },
    put(p) { return enqueue(p.id, () => withRetry(() => col.doc(p.id).set(personDoc(p)))); },
    remove(id) { return enqueue(id, () => withRetry(() => col.doc(id).delete())); },
    async sync(changed, removed) {
      for (const id of removed) await store.remove(id);
      for (const p of changed) await store.put(p);
    },
  };
  return store;
}

// ---------- Dosya verme ----------

/**
 * Metni dosya olarak sunar: masaüstü ve Android'de sistemin "Farklı kaydet" penceresini,
 * Artifact içinde platformun indirme onayını, tarayıcıda normal indirmeyi kullanır.
 */
export async function offerFile(filename, text, mime) {
  const tauri = window.__TAURI__;
  if (tauri && tauri.dialog && tauri.fs) {
    const path = await tauri.dialog.save({ defaultPath: filename, filters: [{ name: 'Mimlesek yedeği', extensions: ['json'] }] });
    if (!path) throw { code: 'declined' };
    await tauri.fs.writeTextFile(path, text);
    return;
  }
  if (inArtifact()) {
    const downloads = await window.claude.use('downloads').catch(() => null);
    if (!downloads) throw { code: 'unavailable' };
    await downloads.save({ filename, data: text });
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
