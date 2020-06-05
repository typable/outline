export default {
	define: function(args) {
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
	},
	template: function(func) {
		return function(args) {
			let template = document.createElement('template');
			template.innerHTML = func(args);
			let element = template.content.cloneNode(true);
			let render = function(parent) {
				parent.append(element);
			};
			Object.defineProperty(render, 'element', {
				value: element.firstElementChild,
				writable: false,
				enumerable: false,
				configurable: false
			});
			return render;
		};
	}
};
