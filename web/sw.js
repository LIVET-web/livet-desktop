// LIVET Work: siempre trae la última versión de la red; si no hay conexión, muestra la última guardada.
const CACHE = "livet-v1";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok && r.mode === "navigate") { const c = res.clone(); caches.open(CACHE).then(x => x.put("/", c)); } return res; })
    .catch(() => caches.match(r.mode === "navigate" ? "/" : r).then(m => m || Response.error())));
});
