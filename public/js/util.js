/**
	Creates a unique identifier based on the current date.

	@function uuid
	@return {number} The unique identifier.
*/
function uuid() {
	return new Date().valueOf();
}

export { uuid };
