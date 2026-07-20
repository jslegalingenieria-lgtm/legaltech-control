const CACHE_NAME = "js-legaltech-light-v0.9.3";
const ASSETS = [
  // Agregamos las rutas de Firebase para que la app cargue rápido en el cel
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js',
  
  // Tus archivos locales de siempre
  'index.html',
  'dashboard.html',
  'css/estilos.css',
  'css/calendario.css', 
  'js/agenda.js',
  'js/calendario.js',
  'js/consecutivos.js',
  'js/clientes.js',
  'js/email.js',
  'js/acceso-clientes.js',
  'js/auth.js',
  'js/firebase.js',
  'js/notificaciones.js',
  'js/alertas-terminos.js',
  'js/asuntos.js',
  'js/pdf.js'
];

// El resto de tu archivo sw.js (install, activate, fetch) se queda EXACTAMENTE IGUAL
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => console.log("Error cargando caché inicial:", err));
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});