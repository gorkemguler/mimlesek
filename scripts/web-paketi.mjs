// Web uygulamasını dist/web klasörüne toplar. Masaüstü/Android paketleri ve GitHub Pages bu klasörü kullanır.
// Google Fonts yazı tiplerini indirip pakete gömer; böylece uygulama internetsiz de aynı görünür.
// İndirme başarısız olursa bağlantılar olduğu gibi kalır ve paket yine de oluşur.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('dist/web/', ROOT);
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'src', 'styles', 'icons'];
// Google Fonts, woff2 dosyalarını yalnızca güncel bir tarayıcı kimliğine verir.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const f of FILES) await cp(new URL(f, ROOT), new URL(f, OUT), { recursive: true });

async function get(url, as) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : res.text();
}

const indexUrl = new URL('index.html', OUT);
let html = await readFile(indexUrl, 'utf8');
const sheets = [...html.matchAll(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/[^"]+)">/g)].map((m) => m[1]);

try {
  await mkdir(new URL('fonts/', OUT), { recursive: true });
  let css = '/* Google Fonts (SIL Open Font License), web-paketi.mjs tarafından yerel kopyaya çevrildi. */\n';
  let count = 0;
  for (const href of sheets) {
    // Türkçe için latin ve latin-ext yeter; diğer alfabe alt kümeleri pakete girmez.
    let sheet = (await get(href.replace(/&amp;/g, '&')))
      .match(/(\/\* [\w-]+ \*\/\s*)?@font-face\s*{[^}]*}/g)
      .filter((block) => { const m = block.match(/^\/\* ([\w-]+) \*\//); return !m || m[1] === 'latin' || m[1] === 'latin-ext'; })
      .join('\n');
    for (const [, fontUrl] of [...sheet.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)]) {
      const name = `f${++count}.woff2`;
      await writeFile(new URL(`fonts/${name}`, OUT), await get(fontUrl, 'buffer'));
      sheet = sheet.replace(fontUrl, () => `./${name}`);
    }
    css += `${sheet}\n`;
  }
  await writeFile(new URL('fonts/fonts.css', OUT), css);
  html = html
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\s*/g, '')
    .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/[^"]+">\s*/g, '')
    .replace('<link rel="stylesheet" href="styles/app.css">', () => '<link rel="stylesheet" href="fonts/fonts.css">\n<link rel="stylesheet" href="styles/app.css">');
  await writeFile(indexUrl, html);
  console.log(`dist/web hazır; ${count} yazı tipi dosyası pakete gömüldü.`);
} catch (err) {
  console.warn(`dist/web hazır; yazı tipleri indirilemedi (${err.message}), Google Fonts bağlantıları korundu.`);
}
