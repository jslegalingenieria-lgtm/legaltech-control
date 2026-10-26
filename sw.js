const CACHE_NAME = "js-legaltech-v4.9.1-kanban-gestion-control";
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
  "css/calculadora-pensiones.css?v=4.6.0",
  "css/sigde-modulos-migrados.css?v=4.7.0",
  "css/terminos-procesales.css?v=4.8.0",
  "css/legaltech-modulos-litigacion.css?v=4.7.0",
  "css/revisor-juridico.css?v=legaltech-v2.9",
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
  "manuales-practicos-html/administrativo-jalisco.html",
  "manuales-practicos-html/civil-familiar-cnpcf-ccej.html",
  "manuales-practicos-html/civil-patrimonial-jalisco.html",
  "manuales-practicos-html/corporativo-jalisco.html",
  "manuales-practicos-html/divorcio-jalisco.html",
  "manuales-practicos-html/familiar-jalisco.html",
  "manuales-practicos-html/laboral-jalisco.html",
  "manuales-practicos-html/mercantil.html",
  "manuales-practicos-html/penal-jalisco.html",
  "manuales-practicos-html/propiedad-intelectual-mexico.html",
  "manuales-practicos-html/sucesorio-jalisco.html",
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
  "js/calculadoras-juridicas.js?v=4.6.0",
  "js/pensiones-config.js?v=4.6.0",
  "js/pensiones-ley73.js?v=4.6.0",
  "js/pensiones-ley97.js?v=4.6.0",
  "js/pensiones-calculadora.js?v=4.6.0",
  "js/sigde-constructor-registry.js?v=4.7.0",
  "js/conocimiento-procesal-data.js?v=4.7.0",
  "js/supermatriz-procesal-data.js?v=4.7.0",
  "js/terminos-procesales-data.js?v=4.8.0",
  "js/terminos-procesales.js?v=4.8.0",
  "js/sigde-modulos-migrados.js?v=4.7.0",
  "js/manuales-practicos-data.js?v=4.7.0",
  "js/biblioteca-juridica-practica-data.js",
  "js/legaltech-manuales-diccionario.js?v=4.7.0",
  "js/revisor-juridico.js?v=legaltech-v2.9",
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
  "js/gestion-control.js?v=4.9.1",
  "js/dashboard-ejecutivo.js",
  "js/email.js",
  "js/entrevistas.js",
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
