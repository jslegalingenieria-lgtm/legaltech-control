const CACHE_NAME = "js-legaltech-v4.4.9-clean";
const ASSETS = [
  "404.html",
  "css/biblioteca-juridica.css",
  "css/buscador-juridico.css",
  "css/calendario.css",
  "css/centro-conocimiento.css",
  "css/components.css",
  "css/comunicacion.css",
  "css/conocimiento-juridico.css",
  "css/constructor-documentos.css",
  "css/dashboard-ejecutivo.css",
  "css/entrevistas.css",
  "css/estilos.css",
  "css/expedientes.css",
  "css/forms.css",
  "css/layout.css",
  "css/responsive.css",
  "css/tables.css",
  "css/variables.css",
  "dashboard.html",
  "img/LexGear1.png",
  "img/LexGear2.png",
  "img/favicon2.png",
  "img/favicon3.png",
  "img/lexgear-light.png",
  "img/lexgear-primary.png",
  "img/logo-js-legal.png",
  "img/logo-js-legal1.png",
  "img/logo-js-legal2.png",
  "img/logo.png",
  "index.html",
  "js/acceso-clientes.js",
  "js/agenda.js",
  "js/alertas-terminos.js",
  "js/app.js",
  "js/asuntos.js",
  "js/auth.js",
  "js/biblioteca-juridica.js",
  "js/buscador-juridico.js",
  "js/calculadoras-juridicas.js?v=4.4.9",
  "js/calendario.js",
  "js/centro-conocimiento-data.js",
  "js/centro-conocimiento.js",
  "js/clientes.js",
  "js/comunicacion.js",
  "js/configuracion.js",
  "js/conocimiento-juridico-data.js",
  "js/conocimiento-juridico.js",
  "js/consecutivos.js",
  "js/constructor-documentos.js",
  "js/cotizaciones.js",
  "js/dashboard-ejecutivo.js",
  "js/email.js",
  "js/entrevistas.js",
  "js/estrategia-procesal.js",
  "js/expedientes.js",
  "js/exportar-excel.js",
  "js/firebase.js",
  "js/mantenimiento.js",
  "js/notificaciones.js",
  "js/pdf.js",
  "js/personal.js",
  "js/plantillas-base.js",
  "js/portal.js",
  "js/reportes-profesionales.js?v=4.4.9",
  "js/roles.js",
  "js/storage.js",
  "manifest.json"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200) return response;
        const copia = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
