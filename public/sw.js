// Minimal Service Worker for PWA installation
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Basic fetch handler (required for PWA)
    event.respondWith(fetch(event.request));
});
