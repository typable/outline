import { isApp } from './util.js';

import ripple from './mod/ripple.js';

const path = isApp() ? './app.js' : './home.js';

window.addEventListener('load', init);

async function init() {
	console.log('%cOutline', 'font-size: 24px; font-weight: 600;');
	console.log('%cDraw with friends together.\n', 'font-size: 14px;');
	console.log('Found a bug? Tell us:', 'https://github.com/typable/outline/issues/new/choose');

	const index = await import(path);
	index.init();
	ripple.init();
}
