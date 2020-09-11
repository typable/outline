const LINE_BREAK_PATTERN = /\r\n|\r|\n/;
const PROPERTY_PATTERN = /^([\w+.-]+)=([^=]*)$/;

let lang = {};
let default_lang;
let current_lang;

/**
	Sets the default and current language.

	@function init
	@constructor
	@param {string} code - The locale code;
*/
function init(code) {
	default_lang = code;
	current_lang = code;
}

/**
	Reads all properties files in the given directory and specified locale code.

	@async
	@function load
	@param {string} path - The path to the locale files.
	@param {string[]} locales - The list containing all locales.
	@return {Object} The locale object.
*/
async function load(path, locales, callback) {
	for(let code of locales) {
		let text = await fetch(`${path}/${code}.properties`)
			.then(function(response) {
				if(!response.ok) {
					throw new Error('(404) Not Found');
				}
				return response.text();
			})
			.catch(function(error) {
				console.error(`No properties file found for locale '${code}'!`, error);
			});
		if(text) {
			lang[code] = parse(text);
		}
	}
	if(callback) {
		callback();
	}
}

/**
	Converts properties text to a locale object.

	@function parse
	@param {string} text - Raw properties text data.
	@return {Object} The locale object.
*/
function parse(text) {
	let result = {};
	for(let line of text.split(LINE_BREAK_PATTERN)) {
		let match = PROPERTY_PATTERN.exec(line);
		if(match) {
			result[match[1]] = match[2];
		}
	}
	return result;
}

/**
	Returns the current locale.

	@function get_current
	@return {string} The current locale.
*/
function get_current() {
	return current_lang;
}

/**
	Returns the locale object by the given locale code.

	@function change
	@return {Object} The locale object.
*/
function get() {
	return lang[current_lang];
}

/**
	Changes language text from all HTMLElements with the specified datatag.

	@function change
	@param {string} code - The local code.
*/
function change(code) {
	if(lang[code]) {
		current_lang = code;
		let elements = document.querySelectorAll('[data-lang]');
		for(let item of elements) {
			let content = lang[code][item.dataset.lang];
			if(content) {
				let type = item.dataset.type || 'content';
				let badge;
				if(item.dataset.badge === 'true') {
					badge = item.querySelector('.badge');
				}
				switch(type) {
					case 'content':
						item.textContent = content;
						if(badge) {
							item.append(badge);
						}
						break;
					case 'tooltip':
						item.dataset.title = content;
						break;
					default:
						break;
				}
			}
		}
	}
}

export default {
	init,
	load,
	parse,
	get_current,
	get,
	change
};
