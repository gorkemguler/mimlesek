// İnternetsiz çalışma güvenceleri: uygulama hiçbir kaynağı dışarıdan yüklememeli.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const read = (p) => readFile(new URL(p, ROOT), 'utf8');
const exists = (p) => access(new URL(p, ROOT)).then(() => true, () => false);

test('index.html dışarıdan stil, betik ya da yazı tipi yüklemez', async () => {
  const html = await read('index.html');
  const loads = [...html.matchAll(/<(?:link|script)\b[^>]*(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  const external = loads.filter((u) => /^(https?:)?\/\//.test(u));
  assert.deepEqual(external, [], `dış kaynaklar: ${external.join(', ')}`);
});

test('yazı tipleri yerel ve her dosya repoda', async () => {
  const css = await read('fonts/fonts.css');
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]);
  assert.ok(urls.length > 0);
  for (const u of urls) {
    assert.ok(u.startsWith('./'), `yerel olmayan yazı tipi: ${u}`);
    assert.ok(await exists(`fonts/${u.slice(2)}`), `eksik dosya: ${u}`);
  }
  for (const family of ['bricolage-grotesque', 'figtree', 'ibm-plex-mono', 'reem-kufi']) {
    assert.ok(await exists(`fonts/lisanslar/${family}-OFL.txt`), `lisans eksik: ${family}`);
  }
});

test('service worker önbelleğe aldığı her dosya mevcut, yazı tipleri de önbelleğe giriyor', async () => {
  const sw = await read('sw.js');
  const shell = [...sw.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  for (const f of shell) assert.ok(await exists(f), `önbellek listesinde olmayan dosya: ${f}`);
  assert.ok(shell.includes('fonts/fonts.css'));
  const modules = (await read('scripts/tek-dosya.mjs')).match(/const ORDER = \[([^\]]+)\]/)[1].match(/'(\w+)'/g).map((m) => `src/${m.slice(1, -1)}.js`);
  for (const m of modules) assert.ok(shell.includes(m), `önbelleğe alınmayan modül: ${m}`);
});

test('masaüstü/Android güvenlik politikası dış kaynağa izin vermez', async () => {
  const conf = JSON.parse(await read('src-tauri/tauri.conf.json'));
  const csp = Object.values(conf.app.security.csp).join(' ');
  assert.equal(/https?:\/\/(?!ipc\.localhost)/.test(csp), false, csp);
});

test('kaynak kodda ağ isteği yok', async () => {
  for (const m of ['main', 'model', 'store', 'kasa', 'views', 'charts', 'util', 'demo']) {
    const src = await read(`src/${m}.js`);
    assert.equal(/\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon/.test(src), false, `${m}.js ağ isteği yapıyor`);
  }
});
