const CACHE_NAME = 'today-five-sentences-v2';
const APP_SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// HTML(앱 화면)은 항상 네트워크에서 최신 버전을 먼저 시도하고,
// 오프라인일 때만 저장해둔 캐시로 대체한다. (개발 중 자주 바뀌므로 이게 안전함)
// 아이콘/매니페스트처럼 거의 안 바뀌는 파일만 캐시 우선으로 둔다.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin || event.request.method !== 'GET') return;

  const isHtml = event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isHtml) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return res;
      }).catch(() => cached);
    })
  );
});
