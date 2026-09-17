const CACHE = 'hasans-space-v6';
const SCOPE = new URL(self.registration.scope);
const SCOPE_PATH = SCOPE.pathname.endsWith('/') ? SCOPE.pathname : `${SCOPE.pathname}/`;

function isNavigation(request) {
  return request.mode === 'navigate'
    || request.destination === 'document'
    || request.headers.get('accept')?.includes('text/html');
}

function isCachedAsset(request) {
  const url = new URL(request.url);
  if (url.origin !== SCOPE.origin) return false;
  if (url.pathname.startsWith(`${SCOPE_PATH}_next/static/`)) return true;
  return [
    `${SCOPE_PATH}manifest.json`,
    `${SCOPE_PATH}icon.svg`,
    `${SCOPE_PATH}icon-192.png`,
    `${SCOPE_PATH}icon-512.png`,
  ].includes(url.pathname);
}

function cacheResponse(request, response) {
  if (response.ok || response.type === 'opaque') {
    return caches.open(CACHE).then(cache => cache.put(request, response));
  }
  return Promise.resolve();
}

function networkFirst(request) {
  return fetch(request).then(response => {
    void cacheResponse(request, response.clone());
    return response;
  }).catch(() => caches.match(request).then(cached => cached || caches.match(SCOPE.href)));
}

function cacheFirst(request) {
  return caches.match(request).then(cached => cached || fetch(request).then(response => {
    void cacheResponse(request, response.clone());
    return response;
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll([
        self.registration.scope,
        new URL('manifest.json', self.registration.scope).toString(),
        new URL('icon.svg', self.registration.scope).toString(),
      ]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (isNavigation(event.request)) {
    event.respondWith(networkFirst(event.request));
  } else if (isCachedAsset(event.request)) {
    event.respondWith(cacheFirst(event.request));
  }
});
