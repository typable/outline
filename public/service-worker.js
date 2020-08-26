const FILES_TO_CACHE = [
	'./',
	'./index.html',
	'./manifest.json',
	'./asset/img/favicon.png',
	'./asset/img/app/icon-192x192.png',
	'./asset/lang/en.properties',
	'./asset/lang/de.properties',
	'./asset/font/material-icons.woff2',
	'./asset/font/roboto-thin.ttf',
	'./asset/font/roboto-light.ttf',
	'./asset/font/roboto-regular.ttf',
	'./asset/font/roboto-medium.ttf',
	'./asset/font/roboto-bold.ttf',
	'./asset/font/roboto-black.ttf',
	'./css/style.css',
	'./js/index.js',
	'./js/constant.js',
	'./js/util.js',
	'./js/addon/canvas.js',
	'./js/addon/locale.js',
	'./js/addon/ripple.js',
	'./js/addon/gamepad.js'
];

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
