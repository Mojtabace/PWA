importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
    console.log("Workbox با موفقیت بارگذاری شد.");

    // کش کردن فایل‌های CSS و JavaScript
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'script' || request.destination === 'style',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'static-resources',
        })
    );

    // کش کردن تصاویر
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'image',
        new workbox.strategies.CacheFirst({
            cacheName: 'images-cache',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50, // حداکثر تعداد تصاویر در کش
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 روز
                }),
            ],
        })
    );

    // کش کردن درخواست‌های API
    workbox.routing.registerRoute(
        ({ url }) => url.origin === 'https://mim-movie.ir',
        new workbox.strategies.NetworkFirst({
            cacheName: 'api-cache',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 30,
                    maxAgeSeconds: 24 * 60 * 60, // 1 روز
                }),
            ],
        })
    );
} else {
    console.log("خطا در بارگذاری Workbox");
}
