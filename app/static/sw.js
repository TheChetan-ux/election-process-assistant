const CACHE_NAME = 'election-edu-v2';
const urlsToCache = [
  '/',
  '/static/css/style.css',
  '/static/js/main.js',
  '/static/js/worker.js',
  '/manifest.json'
];

const offlineFacts = [
  "India's 2019 General Election was the largest democratic exercise in history, with over 900 million eligible voters.",
  "The Model Code of Conduct (MCC) comes into effect immediately after the Election Commission announces the election schedule.",
  "Electronic Voting Machines (EVMs) do not require electricity from the grid to function; they run on ordinary batteries."
];

const offlineHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - VoteWise</title>
    <style>
        body { font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8f9fa; color: #212529; text-align: center; padding: 20px; margin: 0; }
        .voty-avatar { width: 80px; height: 80px; margin-bottom: 20px; }
        .card { background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; }
        h1 { font-size: 1.5rem; margin-bottom: 15px; color: #0d6efd; }
        ul { text-align: left; margin-top: 20px; padding-left: 20px; }
        li { margin-bottom: 10px; }
        .btn-retry { margin-top: 20px; padding: 10px 20px; background: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
    </style>
</head>
<body>
    <div class="card">
        <svg class="voty-avatar" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#0d6efd" />
            <rect x="25" y="40" width="50" height="40" rx="4" fill="#ffffff" />
            <rect x="20" y="35" width="60" height="5" rx="2" fill="#e9ecef" />
            <path d="M40 55 L48 63 L65 45" stroke="#0d6efd" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </svg>
        <h1>You are Offline!</h1>
        <p>I am VOTY. It seems you've lost connection, but democracy never stops. Here are some quick facts while we wait for the network:</p>
        <ul>
            \${offlineFacts.map(fact => '<li>' + fact + '</li>').join('')}
        </ul>
        <button class="btn-retry" onclick="window.location.reload()">Try Reconnecting</button>
    </div>
</body>
</html>
`;

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request).catch(() => {
        return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            // If it's a navigation request, show the offline UI
            if (event.request.mode === 'navigate') {
                return new Response(offlineHTML, {
                    headers: { 'Content-Type': 'text/html' }
                });
            }
            return new Response('', { status: 404, statusText: 'Not Found' });
        });
    })
  );
});
