/**
 * Atlas AI service worker.
 *
 * Strategy:
 *  - Navigations & static assets (JS/CSS/fonts/icons): stale-while-revalidate,
 *    so the app shell loads instantly from cache and updates in the
 *    background. Falls back to a small offline page if nothing is cached yet
 *    and the network is unavailable.
 *  - /api/* requests: network-only. Chat requires a live connection to the
 *    backend (and, through it, Ollama) — there is no meaningful offline
 *    fallback for generating a response, so we don't pretend there is one.
 *
 * This gives "offline support where practical": you can open Atlas AI, see
 * your conversation history that was already rendered, and the UI itself
 * loads with no network — but sending a new message still requires the
 * backend to be reachable.
 */

const CACHE_NAME = 'atlas-ai-shell-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = ['/', '/manifest.json', '/offline.html', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return; // Let cross-origin and non-GET requests (including all mutations) pass through untouched.
  }

  // Never cache API traffic — always hit the network.
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const network = await networkFetch;
  if (network) return network;

  if (request.mode === 'navigate') {
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
  }

  return new Response('Offline and no cached content is available.', {
    status: 503,
    statusText: 'Offline',
  });
}
