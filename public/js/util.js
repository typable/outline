/**
	Creates a unique identifier based on the current date.

	@function uuid
	@return {number} The unique identifier.
*/
function uuid() {
	return new Date().valueOf();
}

/**
	Creates a template Object to create HTMLElements.

	@function html
	@callback callback
	@return {Object} The template object.
*/
function html(callback) {
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

/**
	Creates an object which contains the queried HTMLElements.

	@function query
	@param args - The query object.
	@return {Object} The object containing node elements.
*/
function query(args) {
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

export { uuid, html, query };
