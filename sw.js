// Il file non va modificato a mano: scripts/build.mjs sostituisce i segnaposto
// con il nome della cache della build (SHA del commit) e con la sua famiglia.
const CACHE = "__CACHE_NAME__";
const CACHE_FAMILY = "__CACHE_FAMILY__";

// Precache minimo per l'avvio offline. Il resto viene messo in cache alla prima richiesta.
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
  "./pwa-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Elimina solo le cache della stessa famiglia: produzione e anteprima condividono l'origin.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE && k.startsWith(CACHE_FAMILY)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pagina e codice: rete prima, così un deploy si vede subito.
  const isAppShell =
    req.mode === "navigate" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith(".html") ||
    url.pathname.includes("/js/");

  event.respondWith(isAppShell ? networkFirst(req) : cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (await cache.match("./index.html"));
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return cache.match("./index.html");
  }
}
