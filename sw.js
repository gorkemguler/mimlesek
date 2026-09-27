// Çevrimdışı çalışma: ilk ziyarette uygulamanın tamamı (yazı tipleri dahil) önbelleğe alınır.
// Sonrasında dosyalar önce ağdan istenir; ağ yoksa önbellekten gelir.

const VERSION = '2.2.0';
const APP_CACHE = `mimlesek-${VERSION}`;
const SHELL = [
  './',
  './index.html',
  './styles/app.css',
  './fonts/fonts.css',
  './src/main.js',
  './src/util.js',
  './src/model.js',
  './src/store.js',
  './src/kasa.js',
  './src/demo.js',
  './src/charts.js',
  './src/views.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-64.png',
];

async function precache() {
  const cache = await caches.open(APP_CACHE);
  await cache.addAll(SHELL);
  // Yazı tipi dosyalarının listesi fonts.css'ten okunur; böylece liste elle güncellenmez.
  const css = await (await cache.match('./fonts/fonts.css')).text();
  const fonts = [...new Set([...css.matchAll(/url\(\.\/([^)]+)\)/g)].map((m) => `./fonts/${m[1]}`))];
  await cache.addAll(fonts);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== APP_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(APP_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))),
  );
});
