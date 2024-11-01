// نام کش برای ذخیره فایل‌ها
const CACHE_NAME = 'my-pwa-cache-v1';
// لیست فایل‌هایی که باید کش شوند
const CACHE_ASSETS = [
  '/index.html',
  '/offline.html',
  '/weather-widget.html', // فایل ویجت برای دسترسی آفلاین
  '/styles.css', // فایل‌های CSS اصلی
  '/app.js',     // فایل اصلی جاوااسکریپت
  '/icon-192x192.png',
  '/icon-512x512.png'
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
