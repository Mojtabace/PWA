// نام و ورژن کش
const CACHE_NAME = "my-app-cache-v1";
const OFFLINE_URL = "/offline.html"; // یک صفحه آفلاین برای نمایش در حالت آفلاین

// فایل‌های کش شده
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  OFFLINE_URL
];

// نصب Service Worker و افزودن فایل‌ها به کش
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// فعال‌سازی و پاک‌سازی کش‌های قدیمی
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// پشتیبانی آفلاین
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then(cache => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

// همگام‌سازی پس‌زمینه (Background Sync)
self.addEventListener("sync", event => {
  if (event.tag === "sync-posts") {
    event.waitUntil(syncPosts());
  }
});

async function syncPosts() {
  // اینجا می‌توانید کد همگام‌سازی با سرور را قرار دهید
  console.log("Synchronizing posts in background...");
  // فرض کنید با یک API ارتباط برقرار می‌کنیم تا داده‌ها را همگام‌سازی کنیم
}

// همگام‌سازی دوره‌ای (Periodic Sync)
self.addEventListener("periodicsync", event => {
  if (event.tag === "periodic-post-sync") {
    event.waitUntil(syncPosts());
  }
});

// اعلان‌های Push Notifications
self.addEventListener("push", event => {
  let data;
  if (event.data) {
    data = event.data.json();
  } else {
    data = { title: "New Notification", body: "Default message" };
  }

  const options = {
    body: data.body,
    icon: "icon-192x192.png",
    badge: "icon-192x192.png",
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// هندل کردن کلیک روی اعلان‌ها
self.addEventListener("notificationclick", event => {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
