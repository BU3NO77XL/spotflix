// Service Worker minimal para habilitar instalação PWA
// Não intercepta requisições para não interferir com o Next.js

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        // Limpar TODOS os caches antigos que possam estar causando erros 503
        caches.keys().then((keys) =>
            Promise.all(keys.map((key) => caches.delete(key)))
        ).then(() => clients.claim())
    );
});

// Aceita mensagem para forçar ativação imediata
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// SEM handler de fetch — todas as requisições passam direto para a rede.
// Isso evita:
// - Erros 503 durante Fast Refresh do Next.js
// - Problemas de CORS com TMDB, Supabase, Megaembed
// - Interferência com navegação SPA do Next.js
