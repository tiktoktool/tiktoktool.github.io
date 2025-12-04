// Seller Chat Assistant Pro - Service Worker
const CACHE_NAME = 'seller-chat-assistant-v1.0';
const urlsToCache = [
  'https://tiktoktool.github.io/',
  'https://tiktoktool.github.io/index.html',
  'https://tiktoktool.github.io/style.css',
  'https://tiktoktool.github.io/script.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
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
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Cache First, then Network
self.addEventListener('fetch', event => {
  // Skip non-GET requests and external URLs that shouldn't be cached
  if (event.request.method !== 'GET' || 
      event.request.url.includes('chrome-extension') ||
      event.request.url.includes('google-analytics') ||
      event.request.url.includes('googletagmanager')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the new response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Fetch failed; returning offline page:', error);
            
            // For HTML requests, return cached homepage
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('https://tiktoktool.github.io/index.html');
            }
            
            return new Response('Offline mode', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
