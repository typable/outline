/**
	Binds event handler to provide ripple effect.

	@function init
	@constructor
*/
function init() {
	let elements = document.querySelectorAll('.ripple');
	for(let item of elements) {
		item.addEventListener('pointerdown', function(event) {
			if(event.button == 0) {
				item.classList.add('ripple-active');
			}
		});
	}
	document.addEventListener('pointerup', function(event) {
		if(event.button == 0) {
			for(let item of elements) {
				item.classList.remove('ripple-active');
			}
		}
	});
}

export default { init };
