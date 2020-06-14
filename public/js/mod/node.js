function define(args) {
	let node = {};
	if(typeof args === 'object') {
		for(let entry of Object.entries(args)) {
			let [ key, value ] = entry;
			if(typeof value === 'string') {
				node[key] = document.querySelector(value);
			}
			if(typeof value === 'object') {
				let { query, all = false, parent = document } = value;
				if(typeof query === 'string') {
					if(typeof parent === 'string') {
						parent = document.querySelector(parent);
					}
					node[key] = all ?
						Array.from(parent.querySelectorAll(query))
						: parent.querySelector(query);
				}
			}
		}
		return node;
	}
}

function html(func) {
	return {
		build: function(args) {
			let template = document.createElement('template');
			template.innerHTML = func(args);
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

export { define, html };
