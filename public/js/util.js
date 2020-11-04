export function uuid() {
	return new Date().valueOf();
}

export function html(callback) {
	return {
		build: function(args) {
			let template = document.createElement('template');
			template.innerHTML = callback(args);
			let fragment = template.content.cloneNode(true);
			return {
				element: fragment.firstElementChild,
				render: function(parent) {
					parent.appendChild(fragment);
				}
			};
		}
	};
}

export function query(args) {
	let result = {};
	if(typeof args === 'object') {
		for(let entry of Object.entries(args)) {
			let [ key, value ] = entry;
			if(typeof value === 'string') {
				result[key] = document.querySelector(value);
			}
			if(typeof value === 'object') {
				let { query, all = false, parent = document } = value;
				if(typeof query === 'string') {
					if(typeof parent === 'string') {
						parent = document.querySelector(parent);
					}
					result[key] = all
						? Array.from(parent.querySelectorAll(query))
						: parent.querySelector(query);
				}
			}
		}
		return result;
	}
}

export function prevent(event) {
	event.preventDefault();
}

export function support(object) {
	return typeof object !== 'undefined';
}

export function isApp() {
	return window.location.pathname === '/app';
}

export function isStandalone() {
	return ['fullscreen', 'standalone', 'minimal-ui'].some(function(display) {
		return window.matchMedia('(display-mode: ' + display + ')').matches;
	});
}
