// Yazı tiplerini Google Fonts'tan bir kez indirip repodaki fonts/ klasörüne koyar.
// Uygulama çalışırken ya da derlenirken internete hiç ihtiyaç duymasın diye dosyalar repoda tutulur.
// Yalnızca yazı tipi listesi değişince çalıştır: `node scripts/yazi-tipleri.mjs`
import { mkdir, rm, writeFile } from 'node:fs/promises';

const ROOT = new URL('..', import.meta.url);
const OUT = new URL('fonts/', ROOT);
const SHEETS = [
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
  // Arapça mim harfi: yalnızca "م" karakterini içeren küçük bir alt küme.
  'https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@700&text=%D9%85&display=swap',
];
const LICENSES = { 'Bricolage Grotesque': 'bricolagegrotesque', Figtree: 'figtree', 'IBM Plex Mono': 'ibmplexmono', 'Reem Kufi': 'reemkufi' };
const KEEP = new Set(['latin', 'latin-ext']); // Türkçe için yeterli
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

async function get(url, as) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : res.text();
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

await rm(OUT, { recursive: true, force: true });
await mkdir(new URL('lisanslar/', OUT), { recursive: true });

const files = new Map(); // uzak adres → yerel ad
const blocks = [];
for (const sheet of SHEETS) {
  for (const block of (await get(sheet)).match(/(\/\* [\w-]+ \*\/\s*)?@font-face\s*{[^}]*}/g)) {
    const subset = (block.match(/^\/\* ([\w-]+) \*\//) || [])[1] || 'mim';
    if (subset !== 'mim' && !KEEP.has(subset)) continue;
    const family = block.match(/font-family:\s*'([^']+)'/)[1];
    const remote = block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)[1];
    if (!files.has(remote)) {
      // Değişken yazı tiplerinde tüm ağırlıklar tek dosyadadır; ayrı dosya varsa adına ağırlık eklenir.
      const base = `${slug(family)}-${subset}`;
      const weight = block.match(/font-weight:\s*(\d+)/)[1];
      const name = [...files.values()].includes(`${base}.woff2`) ? `${base}-${weight}.woff2` : `${base}.woff2`;
      files.set(remote, name);
      await writeFile(new URL(name, OUT), await get(remote, 'buffer'));
    }
    // Değişken yazı tipinde aynı dosya birden çok ağırlık için gelir: tek tanımda ağırlık aralığına birleştir.
    const weight = Number(block.match(/font-weight:\s*(\d+)/)[1]);
    const same = blocks.find((x) => x.remote === remote);
    if (same) { same.min = Math.min(same.min, weight); same.max = Math.max(same.max, weight); continue; }
    blocks.push({ remote, min: weight, max: weight, text: block.replace(remote, () => `./${files.get(remote)}`) });
  }
}
const css = blocks.map((b) => b.text.replace(/font-weight:\s*\d+;/, `font-weight: ${b.min === b.max ? b.min : `${b.min} ${b.max}`};`));

await writeFile(new URL('fonts.css', OUT),
  `/* Yazı tipleri: Bricolage Grotesque, Figtree, IBM Plex Mono, Reem Kufi. Lisans: SIL Open Font License 1.1 (lisanslar/). */\n`
  + `/* scripts/yazi-tipleri.mjs tarafından üretildi; elle düzenleme. */\n${css.join('\n')}\n`);

for (const [family, dir] of Object.entries(LICENSES)) {
  await writeFile(new URL(`lisanslar/${slug(family)}-OFL.txt`, OUT), await get(`https://raw.githubusercontent.com/google/fonts/main/ofl/${dir}/OFL.txt`));
}
console.log(`fonts/ hazır: ${files.size} yazı tipi dosyası, ${blocks.length} @font-face tanımı, ${Object.keys(LICENSES).length} lisans.`);
