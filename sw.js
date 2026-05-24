// Service worker — network-first for app code (so updates show immediately),
// cache-first for fonts and icons (slow, rarely change).
const CACHE = 'gre-study-v3';

const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './data/vocab.js',
  './data/clusters.js',
  './data/quant.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  // Pre-cache so the app works offline on first load
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE_ASSETS).catch(() => {}))
  );
  // Activate immediately — don't wait for old SW to release control
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // Wipe every old cache version (gre-study-v1, gre-study-v2, etc.)
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    // Take control of all open tabs immediately
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Network-first for same-origin (HTML/JS/JSON). When online, always serve
  // fresh code; when offline, fall back to cache.
  if (url.origin === self.location.origin) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Cache-first for cross-origin (Google Fonts) — rarely change, slow to fetch
  e.respondWith(cacheFirst(e.request));
});

async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200) {
      const cache = await caches.open(CACHE);
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const indexCached = await caches.match('./index.html');
      if (indexCached) return indexCached;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200 && fresh.type !== 'opaque') {
      const cache = await caches.open(CACHE);
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    return cached || Response.error();
  }
}

// Page can ask SW to skip waiting (used by the update-check in index.html)
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
