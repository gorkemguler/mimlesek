// Tüm uygulamayı tek bir HTML dosyasına paketler; yazı tipleri de içine gömülür.
//   dist/mimlesek.html → tam belge; çift tıkla aç, internetsiz çalışır.
//   dist/parca.html    → <html>/<head>/<body> etiketleri olmadan gövde; claude.ai Artifact olarak yayınlamak için.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const ORDER = ['util', 'model', 'demo', 'store', 'kasa', 'charts', 'views', 'main'];
const read = (p) => readFile(new URL(p, ROOT), 'utf8');

// Modüller aynı kapsamda birleşir: import satırları ve export anahtar kelimeleri çıkarılır.
const strip = (src) => src
  .replace(/^import\s[^;]+;\s*$/gm, '')
  .replace(/^export (?=(async\s+)?function\b|const\b|let\b|class\b)/gm, '');

const html = await read('index.html');
// Yazı tiplerini base64 data: adresleri olarak CSS'e göm.
let fontCss = await read('fonts/fonts.css');
for (const [ref, file] of [...fontCss.matchAll(/url\(\.\/([^)]+\.woff2)\)/g)].map((m) => [m[0], m[1]])) {
  const data = (await readFile(new URL(`fonts/${file}`, ROOT))).toString('base64');
  fontCss = fontCss.replace(ref, () => `url(data:font/woff2;base64,${data})`);
}
const css = await read('styles/app.css');
const js = (await Promise.all(ORDER.map(async (n) => `// ---- src/${n}.js ----\n${strip(await read(`src/${n}.js`))}`))).join('\n');

const full = html
  .replace(/<!--tek-dosya:sil-->[\s\S]*?<!--\/tek-dosya:sil-->\s*/g, () => '')
  .replace('<link rel="stylesheet" href="fonts/fonts.css">', () => `<style>\n${fontCss}</style>`)
  .replace('<link rel="stylesheet" href="styles/app.css">', () => `<style>\n${css}</style>`)
  .replace('<script type="module" src="src/main.js"></script>', () => `<script type="module">\n${js}</script>`);

if (full.includes('src="src/main.js"') || full.includes('href="styles/app.css"') || full.includes('href="fonts/fonts.css"')) throw new Error('Satır içine alma başarısız oldu.');

const head = full.match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<meta charset[^>]*>\s*/, '')
  .replace(/<meta name="viewport"[^>]*>\s*/, '');
const body = full.match(/<body>([\s\S]*?)<\/body>/)[1];

await mkdir(new URL('dist/', ROOT), { recursive: true });
await writeFile(new URL('dist/mimlesek.html', ROOT), full);
await writeFile(new URL('dist/parca.html', ROOT), `${head.trim()}\n${body.trim()}\n`);
console.log(`dist/mimlesek.html (${(full.length / 1024).toFixed(0)} KB) ve dist/parca.html hazır.`);
