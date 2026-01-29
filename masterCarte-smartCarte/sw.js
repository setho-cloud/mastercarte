/******************************************************************************
 * 🛡️ MASTERCARTE — SERVICE WORKER SULTAN (V4.0)
 * --------------------------------------------------------------------------
 * @version : Production Finale - PROTECTION TOTALE DES FICHIERS
 ******************************************************************************/

const CACHE_NAME = 'mastercarte-sultan-v4';

const ASSETS_TO_CACHE = [
  'gerant_edit.html',
  'gerant_edit.js',
  'gerant_edit.css',
  'smartcarte.html',
  'smartcarte.js',
  'smartcarte.css',
  'catalogue.html',
  'catalogue.js',
  'catalogue.css',
  'admin_dashboard.html',
  'admin_dashboard.js',
  'etab_dashboard.html',
  'etab_dashboard.js',
  'smartcarte_edit.html',
  'smartcarte_edit.js',
  'login.html',
  'auth.js',
  'style.css',
  'admin.css',
  'ghost.css',      // ✅ Ajouté
  'qrcode.css',     // ✅ Ajouté
  'images/placeholder.png' // ✅ Chemin corrigé
];

// 1. INSTALLATION : Mise en cage des fichiers
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🛡️ Sultan Cache : Archivage de TOUS les fichiers (V4)');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVATION : Nettoyage pour ne garder que la V4
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 Nettoyage ancien cache :', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. INTERCEPTION (FETCH) : Mode Hors-ligne Réel
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Priorité au cache pour garantir le fonctionnement sans réseau
      return response || fetch(event.request);
    })
  );
});