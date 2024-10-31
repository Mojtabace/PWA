const CACHE_NAME = 'my-pwa-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// نصب سرویس ورکر و اضافه کردن فایل‌ها به حافظه
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// فعال کردن سرویس ورکر و پاک کردن کش‌های قدیمی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// هندل کردن درخواست‌ها و پشتیبانی آفلاین
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// سینک بک‌گراند
self.addEventListener('sync', event => {
  if (event.tag === 'my-background-sync') {
    event.waitUntil(
      // عملکردی که در زمان سینک نیاز است انجام شود
      fetch('/sync-endpoint').then(response => {
        return response.json();
      }).then(data => {
        console.log('Background sync data:', data);
      }).catch(error => {
        console.error('Background sync failed:', error);
      })
    );
  }
});

// سینک دوره‌ای
if ('periodicSync' in self.registration) {
  self.registration.periodicSync.register({
    tag: 'my-periodic-sync',
    minInterval: 24 * 60 * 60 * 1000 // هر 24 ساعت
  });
}

// نوتیفیکیشن پوش
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
