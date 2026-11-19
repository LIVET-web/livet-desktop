// LIVET Work: siempre trae la última versión de la red; si no hay conexión, muestra la última guardada.
const CACHE = "livet-v2";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok && r.mode === "navigate") { const c = res.clone(); caches.open(CACHE).then(x => x.put("/", c)); } return res; })
    .catch(() => caches.match(r.mode === "navigate" ? "/" : r).then(m => m || Response.error())));
});

// Notificaciones al celular (Web Push): llegan aunque la app esté cerrada.
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { title: "LIVET", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "LIVET", {
    body: d.body || "", icon: "/icon-192.png", badge: "/icon-192.png", tag: d.id || undefined, renotify: true, data: { url: d.url || "/" },
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) if (new URL(c.url).origin === self.location.origin) { c.postMessage({ type: "open-notif", url }); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
