const FILES_TO_CACHE = [];

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open('test').then((cache) => {
			return cache.addAll(FILES_TO_CACHE);
		})
	);
});

self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.match(event.request).then(function(response) {
			return response || fetch(event.request);
		})
	);
});
