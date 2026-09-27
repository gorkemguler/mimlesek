// Kurulu uygulama paketi: demo yok, web sitesine özgü dosyalar yok, lisanslar var.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, access } from 'node:fs/promises';

const run = promisify(execFile);
const ROOT = new URL('..', import.meta.url);
const read = (p) => readFile(new URL(p, ROOT), 'utf8');
const exists = (p) => access(new URL(p, ROOT)).then(() => true, () => false);

test('masaüstü/Android paketi demo ve site dosyası içermez, lisansları içerir', async () => {
  await run(process.execPath, ['scripts/web-paketi.mjs', '--uygulama'], { cwd: new URL('.', ROOT) });
  assert.equal(await exists('dist/uygulama/src/demo.js'), false, 'demo.js pakete girmemeli');
  assert.equal(await exists('dist/uygulama/sw.js'), false);
  assert.equal(await exists('dist/uygulama/manifest.webmanifest'), false);
  assert.equal(await exists('dist/uygulama/fonts/lisanslar/figtree-OFL.txt'), true, 'yazı tipi lisansı pakette olmalı');
  const html = await read('dist/uygulama/index.html');
  assert.equal(html.includes('github.io'), false, 'site adresi pakette olmamalı');
  assert.equal(html.includes('rel="manifest"'), false);
});

test('tauri paketi uygulama çıktısını kullanır', async () => {
  const conf = JSON.parse(await read('src-tauri/tauri.conf.json'));
  assert.equal(conf.build.frontendDist, '../dist/uygulama');
  assert.match(conf.build.beforeBuildCommand, /--uygulama/);
});

test('demo yalnızca web sitesinde: statik olarak yüklenmez, tek dosyaya girmez', async () => {
  const main = await read('src/main.js');
  assert.equal(/^import[^;]*demo\.js/m.test(main), false, 'demo.js statik olarak içe aktarılmamalı');
  assert.match(main, /const DEMO_ALLOWED = !inNativeShell\(\) && !inArtifact\(\)/);
  const order = (await read('scripts/tek-dosya.mjs')).match(/const ORDER = \[([^\]]+)\]/)[1];
  assert.equal(order.includes("'demo'"), false);
});

test('sürüm numaraları her yerde aynı', async () => {
  const pkg = JSON.parse(await read('package.json')).version;
  const conf = JSON.parse(await read('src-tauri/tauri.conf.json')).version;
  const cargo = (await read('src-tauri/Cargo.toml')).match(/^version = "([^"]+)"/m)[1];
  const sw = (await read('sw.js')).match(/const VERSION = '([^']+)'/)[1];
  const app = (await read('src/main.js')).match(/const APP_VERSION = '([^']+)'/)[1];
  assert.deepEqual([conf, cargo, sw, app], [pkg, pkg, pkg, pkg]);
});
