// Bump this version whenever you deploy changes, to force clients to refresh cached assets.
const CACHE = "sottosoglia-v2";

// Minimal precache for offline-first startup.
// (Other files are cached on first fetch.)
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/styles.css",
  "./js/app.js",
  "./js/ui.js",
  "./js/db.js",
  "./js/utils.js",
  "./js/csv.js",
  "./js/pwa.js",
  "./favicon.ico",
  "./pwa-192.png",
  "./pwa-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
