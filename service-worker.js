// Nome della cache - Cambia 'v4' ogni volta che fai modifiche sostanziali all'HTML
const CACHE_NAME = 'cnc-manager-v4';

// Elenco delle risorse da salvare per l'utilizzo OFFLINE
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',  // Assicurati che il nome file sia identico a quello nella tua cartella
    './icon-512.png',  // Assicurati che il nome file sia identico a quello nella tua cartella
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
];

// 1. INSTALLAZIONE: Scarica e salva i file nella cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Cache aperta e risorse in fase di archiviazione');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Forza il Service Worker a diventare attivo immediatamente
    self.skipWaiting();
});

// 2. ATTIVAZIONE: Elimina le vecchie cache per evitare conflitti
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('SW: Rimozione vecchia cache:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// 3. GESTIONE RICHIESTE (FETCH)
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // REGOLA SPECIALE PER FIREBASE: 
    // Non intercettiamo le chiamate a Firebase/Firestore/Google Auth.
    // Firebase gestisce la sua persistenza offline internamente (IndexedDB).
    if (url.includes('firestore.googleapis.com') || 
        url.includes('identitytoolkit') || 
        url.includes('firebase')) {
        return; 
    }

    // STRATEGIA: Cache First, poi Network
    // Se il file è in cache (come le icone o l'HTML), lo carica istantaneamente.
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).catch(() => {
                // Se non c'è rete e la risorsa non è in cache (es. un'immagine nuova)
                console.log('SW: Risorsa non trovata offline:', url);
            });
        })
    );
});
