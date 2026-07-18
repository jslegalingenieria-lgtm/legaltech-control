const CACHE_NAME = 'legaltech-v1-pdf-ejecutivo-v13';
const ASSETS = [
  // Agregamos las rutas de Firebase para que la app cargue rápido en el cel
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js',
  
  // Tus archivos locales de siempre
  'index.html',
  'dashboard.html',
  'css/estilos.css', 
  'js/agenda.js',
  'js/clientes.js',
  'js/email.js',
  'js/notificaciones.js',
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