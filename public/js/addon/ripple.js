/**
	Binds event handler to provide ripple effect.

	@function init
	@constructor
*/
function init() {
	let elements = document.querySelectorAll('.ripple');
	for(let item of elements) {
		item.addEventListener('pointerdown', function(event) {
			item.classList.add('ripple-active');
		});
	}
	document.addEventListener('pointerup', function(event) {
		for(let item of elements) {
			item.classList.remove('ripple-active');
		}
	});
}

export default { init };
