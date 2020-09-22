import { FIREBASE, LOCALES } from './constant.js';
import { uuid, query } from './util.js';

import locale from './mod/locale.js';
import cookie from './mod/cookie.js';

let node;
let state = {
	deferredPrompt: null
};

export function init() {

	locale.init();
	locale.load('./asset/lang', LOCALES);

	node = query({
		notification: '.notification',
		cookie: '.cookie',
		accept: '.button.accept'
	});

	let elements = document.querySelectorAll('[data-event]');
	for(let element of elements) {
		let value = element.dataset.event;

		if(value === 'play') {
			element.addEventListener('click', function() {
				window.location.href = '/app';
			});
		}

		if(value === 'install') {
			element.addEventListener('click', function() {
				if(state.deferredPrompt) {
					state.deferredPrompt.prompt();
					state.deferredPrompt.userChoice.then(function(result) {
						// let installed = result.outcome === 'accepted';
					});
				}
				else {
					show_notification('main.upcoming');
				}
			});
		}
	}

	let header = document.querySelector('header');
	header.classList.remove('transparent');
	header.animate([
		{ opacity: 0 },
		{ opacity: 1 }
	], {
		duration: 400,
		fill: 'both',
		easing: 'ease-in'
	});

	let brand_logo = document.querySelector('.brand-logo');
	brand_logo.classList.remove('transparent');
	brand_logo.animate([
		{ opacity: 0 },
		{ opacity: 1 }
	], {
		duration: 200,
		fill: 'both',
		easing: 'ease-in',
		delay: 400
	});

	let logo = document.querySelector('.logo');
	logo.classList.remove('transparent');
	logo.animate([
		{ opacity: 0, marginTop: '50px' },
		{ opacity: 1, marginTop: 0 }
	], {
		duration: 400,
		fill: 'both',
		easing: 'ease-out',
		delay: 600
	});

	let info = document.querySelector('.header-info');
	info.classList.remove('transparent');
	info.animate([
		{ opacity: 0, marginTop: '50px' },
		{ opacity: 1, marginTop: 0 }
	], {
		duration: 400,
		fill: 'both',
		easing: 'ease-out',
		delay: 600
	});

	window.addEventListener('beforeinstallprompt', function(event) {
		event.preventDefault();
		state.deferredPrompt = event;
	});

	if(!cookie.hasAccepted()) {
		node.cookie.classList.remove('hidden');
		cookie.requestPermission(node.accept)
			.then(function() {
				node.cookie.classList.add('hidden');
				try {
					firebase.initializeApp(FIREBASE);
					firebase.analytics();
				}
				catch(error) {
					console.warn('Unable to load Google Analytics!');
				}
			});
	}
}

function show_notification(message) {
	let code = uuid();
	state.timestamp = code;
	let content = node.notification.querySelector('.content');
	content.textContent = locale.get()[message];
	node.notification.animate([
		{ opacity: 0 },
		{ opacity: 1 }
	], {
		duration: 200,
		fill: 'both'
	});
	setTimeout(function() {
		if(state.timestamp === code) {
			node.notification.animate([
				{ opacity: 1 },
				{ opacity: 0 }
			], {
				duration: 200,
				fill: 'both'
			});
		}
	}, 5000);
}
