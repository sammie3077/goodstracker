// GoodsTracker Service Worker
// Version: 2.1.0

const CACHE_NAME = 'goodstracker-v2.1.0';
const APP_VERSION = '2.1.0';

// 需要快取的核心文件
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker version:', APP_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core assets');
      return cache.addAll(CORE_ASSETS);
    })
  );

  // 立即接管頁面，不等待
  self.skipWaiting();
});

// 啟用 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker version:', APP_VERSION);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 刪除舊版本的快取
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // 立即接管所有頁面
  return self.clients.claim();
});

// 網路請求攔截策略：Network First（網路優先）
self.addEventListener('fetch', (event) => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳過非同源請求（如 CDN）
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 網路請求成功，更新快取
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 網路失敗，嘗試從快取讀取
        return caches.match(event.request);
      })
  );
});

// 監聽來自客戶端的消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
});
