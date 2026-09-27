// Uygulama dosyalarını paketlemek için toplar. İki çıktı var:
//   node scripts/web-paketi.mjs            → dist/web       GitHub Pages sitesi (demo defteri ve PWA dahil)
//   node scripts/web-paketi.mjs --uygulama → dist/uygulama  masaüstü ve Android paketi (demo, PWA ve site etiketleri yok)
// Yazı tipleri dahil her şey repoda durur; derleme de uygulama da internete ihtiyaç duymaz.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const APP = process.argv.includes('--uygulama');
const ROOT = new URL('..', import.meta.url);
const OUT = new URL(APP ? 'dist/uygulama/' : 'dist/web/', ROOT);
const FILES = APP
  ? ['index.html', 'src', 'styles', 'fonts']
  : ['index.html', 'manifest.webmanifest', 'sw.js', 'src', 'styles', 'fonts', 'icons'];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const f of FILES) await cp(new URL(f, ROOT), new URL(f, OUT), { recursive: true });

if (APP) {
  // Kurulu uygulamada demo defteri yok; site etiketleri (manifest, paylaşım görseli) de gereksiz.
  // Yazı tipi lisansları (fonts/lisanslar) pakette kalır: OFL, yazı tipiyle birlikte dağıtılmasını şart koşar.
  await rm(new URL('src/demo.js', OUT));
  const indexUrl = new URL('index.html', OUT);
  const html = (await readFile(indexUrl, 'utf8')).replace(/<!--tek-dosya:sil-->[\s\S]*?<!--\/tek-dosya:sil-->\s*/g, () => '');
  await writeFile(indexUrl, html);
}
console.log(`${APP ? 'dist/uygulama' : 'dist/web'} hazır.`);
