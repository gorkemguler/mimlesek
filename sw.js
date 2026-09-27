// Çevrimdışı çalışma: uygulama dosyaları önce ağdan, ağ yoksa önbellekten gelir.
// Yazı tipleri ilk yüklemeden sonra önbellekten verilir.

const VERSION = '2.0.0';
const APP_CACHE = `mimlesek-${VERSION}`;
const FONT_CACHE = 'mimlesek-fonts';
const SHELL = [
  './',
  './index.html',
  './styles/app.css',
  './src/main.js',
  './src/util.js',
  './src/model.js',
  './src/store.js',
  './src/demo.js',
  './src/charts.js',
  './src/views.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-64.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== APP_CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
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
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(FONT_CACHE).then((c) => c.put(req, copy));
        return res;
      })),
    );
  }
});
