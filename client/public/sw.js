/**
 * FINANÇAS - Service Worker
 * Estratégias:
 * - App Shell (assets estáticos): Cache First
 * - API tRPC GET (queries): Network First com fallback para cache
 * - API tRPC POST (mutations): Enfileirar offline via Background Sync
 * - Navegação: Network First com fallback para index.html (SPA)
 */

const CACHE_VERSION = 'financas-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const SYNC_TAG = 'financas-sync';

// Assets do App Shell que devem ser cacheados imediatamente
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_URLS).catch((err) => {
        console.warn('[SW] Failed to cache some shell URLs:', err);
      });
    }).then(() => {
      console.log('[SW] Installed');
      return self.skipWaiting();
    })
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('financas-') && key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('[SW] Activated');
      return self.clients.claim();
    })
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests não-HTTP (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Ignorar requests de outros domínios (OAuth, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // API tRPC — estratégia Network First com cache de respostas GET
  if (url.pathname.startsWith('/api/trpc')) {
    if (request.method === 'GET') {
      event.respondWith(networkFirstWithCache(request, API_CACHE));
    } else {
      // POST mutations: tenta rede, se falhar retorna erro estruturado
      event.respondWith(networkOnlyWithOfflineFallback(request));
    }
    return;
  }

  // Navegação SPA — Network First com fallback para index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html').then((cached) => {
          return cached || new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Assets estáticos (JS, CSS, fontes, imagens) — Cache First
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webp)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
    return;
  }

  // Demais requests — Network First
  event.respondWith(networkFirstWithCache(request, STATIC_CACHE));
});

// ─── Background Sync ─────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    console.log('[SW] Background sync triggered');
    event.waitUntil(processSyncQueue());
  }
});

// ─── Message Handler ─────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'TRIGGER_SYNC') {
    processSyncQueue().then(() => {
      event.ports[0]?.postMessage({ type: 'SYNC_COMPLETE' });
    });
  }
  if (event.data?.type === 'CACHE_API_RESPONSE') {
    const { url, data } = event.data;
    caches.open(API_CACHE).then((cache) => {
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'X-SW-Cached': 'true', 'X-SW-CachedAt': Date.now().toString() },
      });
      cache.put(url, response);
    });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request.clone());
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Clone antes de guardar no cache
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving from cache:', request.url);
      return cached;
    }
    return new Response(JSON.stringify({ error: 'offline', message: 'Sem conexão' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request.clone());
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('Asset not available offline', { status: 503 });
  }
}

async function networkOnlyWithOfflineFallback(request) {
  try {
    return await fetch(request);
  } catch {
    // Retorna resposta de erro estruturada para o tRPC client
    return new Response(
      JSON.stringify({ error: { message: 'OFFLINE', code: -32000 } }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function processSyncQueue() {
  // Notifica todos os clients para processar a fila
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => {
    client.postMessage({ type: 'PROCESS_SYNC_QUEUE' });
  });
}
