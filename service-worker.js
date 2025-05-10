```javascript
const CACHE_NAME = 'pos-system-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/script.js',
    'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
    'https://code.jquery.com/jquery-3.5.1.slim.min.js',
    'https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.3/dist/umd/popper.min.js',
    'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/shopping-cart.svg',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/tag.svg',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/menu.svg',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/x-circle.svg',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/check-circle.svg',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/shopping-bag.svg',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/credit-card.svg',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/coins.svg',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/check.svg',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/home.svg',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/printer.svg',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/arrow-left.svg'
    // Add other static assets (CSS, JS, images) as needed
];

// Install the service worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => {
                console.error("Error during install:", err);
            })
    );
});

// Serve assets from the cache
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
             .catch(err => {
                console.error("Error during fetch:", err);
            })
    );
});

// Activate the service worker and remove old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
```