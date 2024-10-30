importScripts('localforage-1.10.0.min.js');

const BACKGROUND_SEARCH_QUERY_TAG = 'background-search-query';
const NEXT_LAUNCH_QUERY_RESULTS_TAG = 'next-launch-query-results';
const BACKGROUND_MOVIE_DETAILS_TAG = 'background-movie-details';
const NEXT_LAUNCH_MOVIE_DETAILS_TAG = 'next-launch-movie-details';

const CACHE_NAME = 'my-movie-list-v3';
const INITIAL_CACHED_RESOURCES = [
    '/',
    '/index.html',
    '/style.css',
    '/favicon.svg',
    '/missing-image.jpg',
    '/script.js',
    '/localforage-1.10.0.min.js',
    '/offline-request-response.json',
];

// نصب سرویس ورکر و کش کردن منابع اولیه
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(INITIAL_CACHED_RESOURCES);
    })());
});

// فعال کردن سرویس ورکر و مدیریت کش‌های قدیمی
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    })());
    self.clients.claim();
});

// درخواست‌های جستجو و جزییات فیلم در حالت آفلاین
async function searchForMovies(query, dontTryLater) {
    let error = false;
    let response = null;
    try {
        response = await fetch(`https://neighborly-airy-agate.glitch.me/api/movies/${query}`);
        if (response.status !== 200) error = true;
    } catch (e) {
        error = true;
    }
    if (error && !dontTryLater) {
        requestBackgroundSyncForSearchQuery(query);
        const cache = await caches.open(CACHE_NAME);
        response = await cache.match('/offline-request-response.json');
    }
    return response;
}

async function getMovieDetails(id, dontTryLater) {
    let error = false;
    let response = null;
    try {
        response = await fetch(`https://neighborly-airy-agate.glitch.me/api/movie/${id}`);
        if (response.status !== 200) error = true;
    } catch (e) {
        error = true;
    }
    if (error && !dontTryLater) {
        requestBackgroundSyncForMovieDetails(id);
        const cache = await caches.open(CACHE_NAME);
        response = await cache.match('/offline-request-response.json');
    }
    return response;
}

// ثبت همگام‌سازی پس‌زمینه برای درخواست‌های آفلاین
function requestBackgroundSyncForSearchQuery(query) {
    if (!self.registration.sync) return;
    self.registration.sync.register(BACKGROUND_SEARCH_QUERY_TAG);
    localforage.setItem(BACKGROUND_SEARCH_QUERY_TAG, query);
}

function requestBackgroundSyncForMovieDetails(id) {
    if (!self.registration.sync) return;
    self.registration.sync.register(BACKGROUND_MOVIE_DETAILS_TAG);
    localforage.setItem(BACKGROUND_MOVIE_DETAILS_TAG, id);
}

// رویداد fetch برای مدیریت درخواست‌ها
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    const query = url.searchParams.get('s');
    const id = url.searchParams.get('i');
    if (url.pathname === '/search' && query) event.respondWith(searchForMovies(query));
    if (url.pathname === '/details' && id) event.respondWith(getMovieDetails(id));
});

// مدیریت همگام‌سازی در پس‌زمینه
self.addEventListener('sync', event => {
    if (event.tag === BACKGROUND_SEARCH_QUERY_TAG) {
        event.waitUntil(handleBackgroundSearchQuery());
    } else if (event.tag === BACKGROUND_MOVIE_DETAILS_TAG) {
        event.waitUntil(handleBackgroundMovieDetails());
    }
});

// هندل کردن جستجو در پس‌زمینه
async function handleBackgroundSearchQuery() {
    const query = await localforage.getItem(BACKGROUND_SEARCH_QUERY_TAG);
    if (!query) return;
    await localforage.removeItem(BACKGROUND_SEARCH_QUERY_TAG);
    const response = await searchForMovies(query, true);
    const data = await response.json();
    await localforage.setItem(NEXT_LAUNCH_QUERY_RESULTS_TAG, data.Search);
    self.registration.showNotification(`Your search for "${query}" is ready`, {
        icon: '/favicon.svg',
        body: 'You can access the list of movies in the app',
        actions: [{ action: 'view-results', title: 'Open app' }]
    });
}

// هندل کردن جزییات فیلم در پس‌زمینه
async function handleBackgroundMovieDetails() {
    const id = await localforage.getItem(BACKGROUND_MOVIE_DETAILS_TAG);
    if (!id) return;
    await localforage.removeItem(BACKGROUND_MOVIE_DETAILS_TAG);
    const response = await getMovieDetails(id, true);
    const data = await response.json();
    await localforage.setItem(NEXT_LAUNCH_MOVIE_DETAILS_TAG, data);
    self.registration.showNotification(`Movie details are ready`, {
        icon: "/favicon.svg",
        body: "You can access the details in the app",
        actions: [{ action: 'view-details', title: 'Open app' }]
    });
}

// مدیریت نوتیفیکیشن‌ها
self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'view-results') {
        clients.openWindow('/');
    } else if (event.action === 'view-details') {
        clients.openWindow('/details');
    }
});

// مدیریت Periodic Sync برای بروزرسانی‌ها
self.addEventListener('periodicsync', event => {
    if (event.tag === 'content-sync') {
        event.waitUntil(updateContent());
    }
});

// متد آپدیت دوره‌ای محتوا
async function updateContent() {
    // کدی برای بروزرسانی محتوا
}
