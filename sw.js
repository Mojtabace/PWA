// نام کش برای ذخیره فایل‌ها
const CACHE_NAME = 'my-pwa-cache-v1';
// لیست فایل‌هایی که باید کش شوند
const CACHE_ASSETS = [
  'index.html',
  'offline.html',
  'weather-widget.html', // فایل ویجت برای دسترسی آفلاین
  'styles.css', // فایل‌های CSS اصلی
  'app.js',     // فایل اصلی جاوااسکریپت
  'icon-192x192.png',
  'icon-512x512.png'
];

// رویداد نصب برای اضافه کردن فایل‌ها به کش
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .catch((err) => console.error('Error caching assets:', err))
  );
});

// رویداد فعال‌سازی برای حذف کش‌های قدیمی
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// رویداد دریافت برای پاسخ‌دهی از کش و هندل کردن حالت آفلاین
self.addEventListener('fetch', (event) => {
  console.log('Fetch event for:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // اگر در کش موجود است، پاسخ از کش
        if (response) {
          return response;
        }
        // اگر در کش موجود نیست، درخواست از شبکه
        return fetch(event.request)
          .catch(() => caches.match('/offline.html')); // نمایش صفحه آفلاین در صورت عدم دسترسی به شبکه
      })
  );
});
// Listener for Push Notifications
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'Default body',
    icon: 'icon-192x192.png', // آیکونی که می‌خواهید نمایش دهید
    badge: 'badge-icon.png' // آیکون کوچک (اختیاری)
  };

  event.waitUntil(
    self.registration.showNotification('Push Notification Title', options)
  );
});

// Listener for Background Sync
self.addEventListener('sync', function(event) {
  if (event.tag === 'my-background-sync') {
    event.waitUntil(
      fetch('/sync-endpoint') // آدرسی که اطلاعات را همگام‌سازی می‌کند
        .then(response => response.json())
        .then(data => console.log('Background sync completed', data))
        .catch(err => console.error('Background sync failed', err))
    );
  }
});

// Listener for Periodic Sync
self.addEventListener('periodicsync', function(event) {
  if (event.tag === 'my-periodic-sync') {
    event.waitUntil(
      fetch('/periodic-sync-endpoint') // آدرس درخواست برای دوره‌ای همگام‌سازی
        .then(response => response.json())
        .then(data => console.log('Periodic sync completed', data))
        .catch(err => console.error('Periodic sync failed', err))
    );
  }
});
