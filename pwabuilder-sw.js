self.importScripts('localforage-1.10.0.min.js');

const VERSION = 'v12';
const CACHE_NAME = `myapp-cache-${VERSION}`;

// بررسی پشتیبانی از به‌روزرسانی دوره‌ای
const PERIODIC_UPDATE_SUPPORTED = ('periodicSync' in registration);

// منابع اولیه که در حالت آفلاین کش می‌شوند
const INITIAL_CACHED_RESOURCES = [
  '/',
  '/offline/',
  '/assets/style.css',
  '/assets/dialog-lightbox.js',
  '/assets/logo-small.png',
  '/pagefind/pagefind-ui.js',
  'https://unpkg.com/prismjs@1.20.0/themes/prism-okaidia.css',
  '/assets/localforage-1.10.0.min.js'
];

// منابعی که نیازی به به‌روزرسانی دوره‌ای ندارند
const DONT_UPDATE_RESOURCES = [
  '/offline/',
  'prismjs',
  'localforage'
];

// حذف کش‌های قدیمی هنگام فعال‌سازی
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => {
      if (name !== CACHE_NAME) {
        return caches.delete(name);
      }
    }));
  })());
});

// نصب اولیه و کش کردن منابع
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    cache.addAll(INITIAL_CACHED_RESOURCES);
  })());
});

// استراتژی دریافت داده با اولویت شبکه
self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const fetchResponse = await fetch(event.request);
      if (!event.request.url.includes('pixel.php') && !event.request.url.includes('browser-sync')) {
        cache.put(event.request, fetchResponse.clone());
      }
      return fetchResponse;
    } catch (e) {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      } else if (event.request.mode === 'navigate') {
        await rememberRequestedTip(event.request.url);
        const errorResponse = await cache.match('/offline/');
        return errorResponse;
      }
    }
  })());
});

// ذخیره‌ی درخواست‌های آفلاین
async function rememberRequestedTip(url) {
  let tips = await localforage.getItem('bg-tips');
  if (!tips) {
    tips = [];
  }
  tips.push(url);
  await localforage.setItem('bg-tips', tips);
}

// بارگذاری درخواست‌های آفلاین هنگام اتصال به شبکه
self.addEventListener('sync', event => {
  if (event.tag === 'bg-load-tip') {
    event.waitUntil(backgroundSyncLoadTips());
  }
});

// بارگذاری داده‌های آفلاین و کش کردن آن‌ها
async function backgroundSyncLoadTips() {
  const tips = await localforage.getItem('bg-tips');
  if (!tips || !tips.length) {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(tips);

  registration.showNotification(`${tips.length} نکات در پس‌زمینه بارگذاری شدند`, {
    icon: "/assets/logo-192.png",
    body: "نکات جدید آماده مشاهده هستند",
    data: tips[0]
  });

  await localforage.removeItem('bg-tips');
}

// باز کردن صفحه درخواست شده هنگام کلیک روی نوتیفیکیشن
self.addEventListener('notificationclick', event => {
  event.notification.close();
  clients.openWindow(event.notification.data);
});

// به‌روزرسانی دوره‌ای منابع کش‌شده
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-cached-content') {
    event.waitUntil(updateCachedContent());
  }
});

// یافتن منابع برای به‌روزرسانی دوره‌ای
async function updateCachedContent() {
  const requests = await findCacheEntriesToBeRefreshed();
  const cache = await caches.open(CACHE_NAME);

  for (const request of requests) {
    try {
      const fetchResponse = await fetch(request);
      await cache.put(request, fetchResponse.clone());
    } catch (e) {
      // در صورت خطا، سکوت کرده و از نسخه‌ی موجود استفاده می‌کنیم
    }
  }
}

// فیلتر کردن منابعی که باید به‌روزرسانی شوند
async function findCacheEntriesToBeRefreshed() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  return requests.filter(request => {
    return !DONT_UPDATE_RESOURCES.some(pattern => request.url.includes(pattern));
  });
}
