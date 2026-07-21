const CACHE_NAME = "js-legaltech-light-v1.3.2";
const ASSETS = [
  "index.html", "dashboard.html", "css/estilos.css", "css/calendario.css",
  "js/firebase.js", "js/storage.js", "js/auth.js", "js/app.js", "js/portal.js",
  "js/exportar-excel.js", "css/dashboard-ejecutivo.css"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copia = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
