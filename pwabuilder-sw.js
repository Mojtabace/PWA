/* ===========================================================
 * docsify sw.js
 * ===========================================================
 * Copyright 2016 @huxpro
 * Licensed under Apache 2.0
 * Register service worker.
 * ========================================================== */

const RUNTIME = 'docsify';
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  'fonts.gstatic.com',
  'fonts.googleapis.com',
  'cdn.jsdelivr.net'
];
const NETWORK_TIMEOUT_MS = 500;

// The Util Function to hack URLs of intercepted requests
const getFixedUrl = (req) => {
  var now = Date.now();
  var url = new URL(req.url);

  // Fixed http URL and add cache-busting
  url.protocol = self.location.protocol;
  if (url.hostname === self.location.hostname) {
    url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;
  }
  return url.href;
};

// Activate event for Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Install event to pre-cache resources for offline support
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(RUNTIME).then(cache => {
      return cache.addAll([
        '/', // Cache the main page
        '/index.html',
        '/styles.css', // Example static resources
        '/scripts.js',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png'
      ]);
    })
  );
});

// Fetch event with stale-while-revalidate strategy
self.addEventListener('fetch', event => {
  if (HOSTNAME_WHITELIST.indexOf(new URL(event.request.url).hostname) > -1) {
    const cached = caches.match(event.request);
    const fixedUrl = getFixedUrl(event.request);
    const fetched = fetch(fixedUrl, { cache: 'no-store' });
    const fetchedCopy = fetched.then(resp => resp.clone());

    const delayCacheResponse = new Promise((resolve) => {
      setTimeout(resolve, NETWORK_TIMEOUT_MS, cached);
    });

    event.respondWith(
      Promise.race([fetched.catch(() => cached), delayCacheResponse])
        .then(resp => resp || fetched)
        .catch(() => caches.match('/offline.html'))
    );

    event.waitUntil(
      Promise.all([fetchedCopy, caches.open(RUNTIME)])
        .then(([response, cache]) => response.ok && cache.put(event.request, response))
        .catch(() => { /* eat any errors */ })
    );
  }
});

// Background Sync for retrying failed requests
self.addEventListener('sync', event => {
  if (event.tag === 'sync-failed-requests') {
    event.waitUntil(retryFailedRequests());
  }
});

// Function to retry failed requests (placeholder)
async function retryFailedRequests() {
  console.log('Retrying failed requests');
  // Here you can handle specific failed requests that need to be retried.
}

// Periodic Sync for refreshing data
self.addEventListener('periodicsync', event => {
  if (event.tag === 'refresh-content') {
    event.waitUntil(fetchAndUpdateContent());
  }
});

// Fetch and update content periodically (placeholder)
async function fetchAndUpdateContent() {
  console.log('Fetching and updating content for periodic sync');
  // Implement content fetching and cache update logic here.
}

// Push Notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'You have a new notification!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'New Notification', options)
  );
});

// Notification click event to handle notification interaction
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      const matchingClient = windowClients.find(client => client.url === '/' && 'focus' in client);
      if (matchingClient) {
        return matchingClient.focus();
      } else if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
