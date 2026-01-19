const CACHE_NAME = 'cnc-manager-v3'; // Versione aggiornata
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
    'https://cdn-icons-png.flaticon.com/512/2092/2092141.png'
];

// INSTALLAZIONE: Scarica risorse statiche
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// ATTIVAZIONE: Pulisci vecchie cache
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// GESTIONE RICHIESTE: Network First per dati, Cache per risorse statiche
self.addEventListener('fetch', (event) => {
    
    // 1. Ignora richieste Firebase (Auth/Firestore) per evitare conflitti cache
    if (event.request.url.includes('firestore.googleapis.com') || 
        event.request.url.includes('identitytoolkit') || 
        event.request.url.includes('firebase')) {
        return; 
    }

    // 2. Strategia: Cache First, poi Network (per velocità interfaccia)
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
