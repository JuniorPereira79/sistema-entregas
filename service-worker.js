const CACHE_NAME = "sistema-entregas-v4";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/logo.png",
  "./pages/login.html",
  "./pages/dashboard.html",
  "./pages/entregas.html",
  "./pages/nova-entrega.html",
  "./pages/entregadores.html",
  "./pages/transferencias.html",
  "./pages/relatorios.html",
  "./pages/minhas-entregas.html",
  "./pages/mapa.html",
  "./css/login.css",
  "./css/dashboard.css",
  "./css/entregas.css",
  "./css/nova-entrega.css",
  "./css/entregadores.css",
  "./css/transferencias.css",
  "./css/relatorios.css",
  "./css/minhas-entregas.css",
  "./css/mapa.css",
  "./js/pwa.js",
  "./js/auth.js",
  "./js/login.js",
  "./js/dashboard.js",
  "./js/entregas.js",
  "./js/nova-entrega.js",
  "./js/entregadores.js",
  "./js/transferencias.js",
  "./js/relatorios.js",
  "./js/minhas-entregas.js",
  "./js/mapa.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then(response => {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });

          return response;
        })
        .catch(() => caches.match("./pages/login.html"));
    })
  );
});
