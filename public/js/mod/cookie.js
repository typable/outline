const CONFIG_COOKIE_PROPERTY = 'outline.custom.accepted';

function requestPermission(element) {
	return new Promise(function(resolve, reject) {
		element.onclick = function() {
			localStorage.setItem(CONFIG_COOKIE_PROPERTY, true);
			resolve();
		}
	});
}

function hasAccepted() {
	return localStorage.getItem(CONFIG_COOKIE_PROPERTY) === 'true';
}

function reset() {
	localStorage.removeItem(CONFIG_COOKIE_PROPERTY);
}

export default {
	requestPermission,
	hasAccepted,
	reset
}
