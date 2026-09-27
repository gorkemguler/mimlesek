// Parolalı kasa testleri: gerçek WebCrypto ile şifreleme, yanlış parola, kaldırma.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Tarayıcının localStorage'ını taklit eden küçük bir bellek deposu.
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { memory.set(k, String(v)); },
  removeItem: (k) => { memory.delete(k); },
};

const { VAULT_KEY, hasVault, openVault, createVault, removeVault, destroyVault, createVaultStore } = await import('../src/kasa.js');
const { DATA_KEY } = await import('../src/store.js');

const FAST = 1000; // testlerde düşük tur sayısı; uygulama 600.000 kullanır
const people = [{
  id: 'p1', fileNo: 1, name: 'Kuzen Barış', alias: '', group: 'Aile', note: 'Sandalye mavi.',
  status: 'aktif', statusAt: 1, createdAt: 1, updatedAt: 1,
  marks: [{ id: 'm1', reason: 'Kamp sandalyesini getirmedi.', type: 'borc', level: 3, date: '2026-08-18', at: 1 }],
}];

beforeEach(() => memory.clear());

test('parola koyunca şifresiz kayıt silinir, kasada düz metin görünmez', async () => {
  memory.set(DATA_KEY, JSON.stringify(people));
  await createVault('gizli-parola', people, FAST);
  assert.equal(memory.has(DATA_KEY), false);
  assert.equal(hasVault(), true);
  const box = memory.get(VAULT_KEY);
  assert.ok(!box.includes('Barış') && !box.includes('Sandalye') && !box.includes('borc'));
  assert.equal(JSON.parse(box).sifre, 'AES-GCM-256');
});

test('doğru parola açar, yanlış parola reddedilir', async () => {
  await createVault('doğru-parola', people, FAST);
  const { people: opened } = await openVault('doğru-parola');
  assert.equal(opened[0].name, 'Kuzen Barış');
  await assert.rejects(openVault('yanlış-parola'), (e) => e.code === 'wrong_password');
  await assert.rejects(openVault('DOĞRU-PAROLA'), (e) => e.code === 'wrong_password');
});

test('her kayıt yeni IV ile yeniden şifrelenir ve sırası korunur', async () => {
  const session = await createVault('parola', people, FAST);
  const firstIv = JSON.parse(memory.get(VAULT_KEY)).iv;
  const store = createVaultStore(session);
  const v1 = structuredClone(people);
  v1[0].name = 'Birinci';
  const v2 = structuredClone(people);
  v2[0].name = 'İkinci';
  store.put(null, v1);
  await store.put(null, v2);
  assert.notEqual(JSON.parse(memory.get(VAULT_KEY)).iv, firstIv);
  const { people: opened } = await openVault('parola');
  assert.equal(opened[0].name, 'İkinci', 'son yazma kazanmalı');
});

test('parola kaldırılınca defter şifresiz geri döner', async () => {
  await createVault('parola', people, FAST);
  removeVault(people);
  assert.equal(hasVault(), false);
  assert.equal(JSON.parse(memory.get(DATA_KEY))[0].name, 'Kuzen Barış');
});

test('unutulan parola: kasa ve şifresiz kayıt tamamen silinir', async () => {
  await createVault('parola', people, FAST);
  destroyVault();
  assert.equal(hasVault(), false);
  assert.equal(memory.size, 0);
  await assert.rejects(openVault('parola'), (e) => e.code === 'no_vault');
});

test('Unicode parolalar normalize edilir', async () => {
  // "ş" tek karakter (U+015F) ile "s" + birleşen çengel (U+0073 U+0327) aynı parola sayılmalı.
  await createVault('kaşif', people, FAST);
  const { people: opened } = await openVault('kaşif');
  assert.equal(opened.length, 1);
});
