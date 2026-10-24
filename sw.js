// Rete prima, cache solo per l'uso offline.
// Produzione e anteprima condividono l'origin: ognuna ha la cache del proprio scope.
const CACHE = "sottosoglia:" + self.registration.scope;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Elimina le cache con i nomi usati dalle versioni precedenti.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith("sottosoglia:")).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req, { cache: "no-cache" });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (await cache.match("./index.html")) || Response.error();
  }
}
