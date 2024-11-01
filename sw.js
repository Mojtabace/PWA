// کش کردن فایل‌ها برای استفاده آفلاین
const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
  '/',
  'index.html',
  'styles.css',
  'script.js',
  'icon-192x192.png',
  'icon-512x512.png'
];

// نصب سرویس‌کار و کش کردن فایل‌ها
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// فعال‌سازی و حذف کش‌های قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Old cache removed:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// واکشی منابع از کش و شبکه
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// نمایش نوتیفیکیشن در هنگام دریافت پیام پوش
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'You have a new notification!',
    icon: 'icon-192x192.png',
    badge: 'icon-96x96.png'
  };
  
  event.waitUntil(
    self.registration.showNotification('Push Notification Title', options)
  );
});

// همگام‌سازی پس‌زمینه
self.addEventListener('sync', (event) => {
  if (event.tag === 'my-background-sync') {
    event.waitUntil(
      fetch('/sync-endpoint')
        .then(response => response.json())
        .then(data => console.log('Background sync completed:', data))
        .catch(error => console.error('Background sync failed:', error))
    );
  }
});

// همگام‌سازی دوره‌ای
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'my-periodic-sync') {
    event.waitUntil(
      fetch('/periodic-sync-endpoint')
        .then(response => response.json())
        .then(data => console.log('Periodic sync completed:', data))
        .catch(error => console.error('Periodic sync failed:', error))
    );
  }
});

// هندل کردن بسته شدن نوتیفیکیشن‌ها
self.addEventListener('notificationclose', (event) => {
  console.log('Notification was closed', event.notification);
});

// هندل کردن کلیک روی نوتیفیکیشن‌ها
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
