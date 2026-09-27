// Web uygulamasını dist/web klasörüne toplar. Masaüstü/Android paketleri ve GitHub Pages bu klasörü kullanır.
// Yazı tipleri dahil her şey repoda durur; derleme de uygulama da internete ihtiyaç duymaz.
import { cp, mkdir, rm } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('dist/web/', ROOT);
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'src', 'styles', 'fonts', 'icons'];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const f of FILES) await cp(new URL(f, ROOT), new URL(f, OUT), { recursive: true });
console.log('dist/web hazır.');
