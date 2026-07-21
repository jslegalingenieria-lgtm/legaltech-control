const CACHE_NAME = "js-legaltech-light-v1.3.4";
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

  const url = new URL(event.request.url);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200) {
          return response;
        }

        const copia = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, copia))
          .catch(error => {
            console.warn("No se pudo guardar en caché:", error);
          });

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
