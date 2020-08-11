const LINE_BREAK_PATTERN = /\r\n|\r|\n/;
const PROPERTY_PATTERN = /^([\w+.-]+)=([^=]*)$/;

/**
	Reads all properties files in the given directory and specified locale code.

	@async
	@function load
	@param {string} path - The path to the locale files.
	@param {string[]} locales - The list containing all locales.
	@return {Object} The locale object.
*/
async function load(path, locales) {
	let result = {};
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
			result[code] = parse(text);
		}
	}
	return result;
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

export { load, parse };
