import { COLORS } from './constant.js';
import { uuid, query, prevent } from './util.js';

// addons
import canvas from './addon/canvas.js';
import locale from './addon/locale.js';
import gamepad from './addon/gamepad.js';
import ripple from './addon/ripple.js';

let state = {
	color: 54,
	color_list: [54, 2, 17, 27, 37, 12],
	radius: 14,
	index: 0,
	device: null,
	device_fallback: null,
	device_list: {
		mouse: false,
		touch: false,
		pen: false,
		gamepad: false
	}
};

let node;

// state variables
let notification_code;
let left_modal = false;
let current_modal;
let current_tab;

// node elements
let ad;
let hotbar;
let toolbar;
let actionbar;
let actions;
let tools;
let device_empty;
let colors_modal;
let capture_modal;
let clear_modal;
let scale_range;

window.toggle_modal = toggle_modal;
window.open_tab = open_tab;
window.close_tab = close_tab;
window.clear_screen = clear_screen;

window.addEventListener('load', init);

function init() {
	canvas.init();
	locale.init('en');
	locale.load('../asset/lang', ['en', 'de']);
	gamepad.init();
	ripple.init();
	// detect gamepad
	gamepad.on_connect(function(gamepad) {
		state.device_list.gamepad = true;
		show_notification('notification.input-device.gamepad.add');
		if(!state.device) {
			state.device = 'gamepad';
			state.device_fallback = 'gamepad';
		}
		update_device_list();
	});
	// gamepad removed
	gamepad.on_disconnect(function(gamepad) {
		state.device_list.gamepad = false;
		show_notification('notification.input-device.gamepad.remove');
		if(state.device === 'gamepad') {
			if(state.device !== state.device_fallback) {
				state.device = state.device_fallback;
			}
			else {
				state.device = null;
			}
			// point = { x: null, y: null };
			// last = { x: null, y: null };
		}
		update_device_list();
	});
	init_custom();

	node = query({
		modal_list: { query: '.modal', all: true },
		hotbar_color_list: { query: '.hotbar .color', all: true },
		modal_color_list: { query: '.colors-modal .color', all: true },
		device_list: { query: '.settings-modal .device-tab .item[data-event="change.device"]', all: true }
	});

	document.addEventListener('touchmove', function(event) {
		let { target } = event;
		if(target !== scale_range) {
			event.preventDefault();
		}
	}, { passive: false });

	device_empty = document.querySelector('.settings-modal .device-tab .item.empty');
	ad = document.querySelector('.controls .ad');
	hotbar = document.querySelector('.controls .hotbar');
	toolbar = document.querySelector('.controls .toolbar');
	actionbar = document.querySelector('.controls .actionbar');
	actions = document.querySelectorAll('.actionbar .action');
	tools = document.querySelectorAll('.toolbar .tool');
	colors_modal = document.querySelector('.toolbar .tool[data-modal="colors"]');
	capture_modal = document.querySelector('.toolbar .tool[data-modal="capture"]');
	clear_modal = document.querySelector('.toolbar .tool[data-modal="clear"]');
	scale_range = document.querySelector('.scale-modal input[type="range"]');
	for(let i in node.hotbar_color_list) {
		if(Object.keys(state.color_list).length > i) {
			if(i == state.index) {
				node.hotbar_color_list[i].classList.add('active');
			}
			node.hotbar_color_list[i].style.background = COLORS[state.color_list[i]];
			node.hotbar_color_list[i].addEventListener('pointerdown', function(event) {
				state.color = state.color_list[i];
				for(let j in node.hotbar_color_list) {
					if(Object.keys(state.color_list).length > j) {
						if(j == i) {
							state.index = j;
						}
						node.hotbar_color_list[j].classList[j == i ? 'add' : 'remove']('active');
					}
				}
			});
		}
	}
	for(let i in node.modal_color_list) {
		if(Object.keys(COLORS).length > i) {
			node.modal_color_list[i].style.background = COLORS[i];
			node.modal_color_list[i].addEventListener('pointerdown', function(event) {
				state.color = i;
			});
		}
	}
	document.addEventListener('dragstart', prevent);
	document.addEventListener('contextmenu', prevent);
	scale_range.addEventListener('input', function(event) {
		state.radius = parseInt(scale_range.value);
		left_modal = false;
		// point.x = parseInt(window.innerWidth / 2);
		// point.y = parseInt(window.innerHeight / 2);
	});
	document.addEventListener('wheel', function(event) {
		if(state.device === 'mouse') {
			let y = event.deltaY < 0 ? 1 : -1;
			if(state.radius + y > 2 - 1 && state.radius + y < 50 + 1) {
				state.radius += y;
				scale_range.value = state.radius;
			}
		}
	});
	document.addEventListener('wheel', function(event) {
		if(state.device === 'mouse') {
			if(event.ctrlKey) {
				event.preventDefault();
				return;
			}
		}
	}, { passive: false });

	document.addEventListener('pointerdown', function(event) {
		if(state.device !== 'gamepad') {
			if(state.device === event.pointerType) {
				if(event.target === canvas.get_canvas()) {
					canvas.on_press(event);

					ad.style.pointerEvents = 'none';
					hotbar.style.pointerEvents = 'none';
					toolbar.style.pointerEvents = 'none';
					actionbar.style.pointerEvents = 'none';
					for(let modal of node.modal_list) {
						modal.style.pointerEvents = 'none';
					}
				}
			}
		}
	});
	document.addEventListener('pointermove', function(event) {
		if(state.device !== 'gamepad') {
			if(state.device === event.pointerType) {
				if(event.target === canvas.get_canvas()) {
					canvas.on_move(event, state);
				}
			}
		}
	});
	document.addEventListener('pointerup', function(event) {
		if(state.device !== 'gamepad') {
			if(state.device === event.pointerType) {
				canvas.on_release(event);

				ad.style.pointerEvents = '';
				hotbar.style.pointerEvents = '';
				toolbar.style.pointerEvents = '';
				actionbar.style.pointerEvents = '';
				for(let modal of node.modal_list) {
					modal.style.pointerEvents = '';
				}
			}
		}
	});
	document.addEventListener('pointerout', function(event) {
		if(state.device !== 'gamepad') {
			if(state.device === event.pointerType) {
				canvas.on_release(event);
			}
		}
	});

	document.addEventListener('keydown', function(event) {
		if(state.device !== 'gamepad') {
			let lock = event.getModifierState("CapsLock");
			if(!event.ctrlKey && !event.shiftKey && !event.altKey) {
				if(!lock) {
					if(event.code.startsWith('Digit')) {
						let digit = parseInt(event.code.substr(5)) - 1;
						if(digit >= 0 && digit < state.color_list.length) {
							state.color = state.color_list[digit];
							state.index = digit;
							for(let i in node.hotbar_color_list) {
								if(state.color_list.length > i) {
									node.hotbar_color_list[i].classList[i == state.index ? 'add' : 'remove']('active');
								}
							}
						}
					}
				}
			}
		}
		if(event.code === 'Escape') {
			if(current_tab) {
				close_tab(current_tab);
			}
			else if(current_modal) {
				toggle_modal(current_modal);
			}
		}
	});
	// point = { x: null, y: null };
	// last = { x: null, y: null };
	// start = { x: null, y: null };
}

/*
function render() {
	if(state.radius < 2) {
		state.radius = 2;
	}
	o.clearRect(0, 0, window.innerWidth, window.innerHeight);
	if(point.x !== null && point.y !== null) {
		let touch_device = (state.device === 'touch' || state.device === 'pen');
		if(touch_device) {
			if(!left_modal) {
				o.fillStyle = 'white';
				o.beginPath();
				o.arc(point.x, point.y, parseInt(state.radius) + 2, 2 * Math.PI, 0);
				o.fill();
				o.fillStyle = COLOR[state.index];
				o.beginPath();
				o.arc(point.x, point.y, parseInt(state.radius), 2 * Math.PI, 0);
				o.fill();
			}
		}
		else {
			o.fillStyle = 'white';
			o.beginPath();
			o.arc(point.x, point.y, parseInt(state.radius) + 2, 2 * Math.PI, 0);
			o.fill();
			o.fillStyle = COLOR[state.index];
			o.beginPath();
			o.arc(point.x, point.y, parseInt(state.radius), 2 * Math.PI, 0);
			o.fill();
		}
	}
	if(!left_modal) {
		if(erase && !draw) {
			o.beginPath();
			o.lineWidth = 2;
			o.strokeStyle = 'white';
			o.moveTo(point.x, point.y - parseInt(state.radius) * 0.5);
			o.lineTo(point.x, point.y + parseInt(state.radius) * 0.5);
			o.moveTo(point.x - parseInt(state.radius) * 0.5, point.y);
			o.lineTo(point.x + parseInt(state.radius) * 0.5, point.y);
			o.stroke();
		}
	}
	if(lock_x || lock_y) {
		o.beginPath();
		o.lineWidth = 2;
		o.strokeStyle = 'white';
		if(lock_x) {
			o.moveTo(point.x, point.y - parseInt(state.radius));
			o.lineTo(point.x, point.y + parseInt(state.radius));
		}
		if(lock_y) {
			o.moveTo(point.x - parseInt(state.radius), point.y);
			o.lineTo(point.x + parseInt(state.radius), point.y);
		}
		o.stroke();
	}
}
*/

function init_custom() {
	// language
	let language_elements = document.querySelectorAll('[data-event="change.language"]');
	for(let item of language_elements) {
		item.addEventListener('click', function(event) {
			let code = item.dataset.code;
			locale.change(code);
			for(let sub_item of language_elements) {
				sub_item.classList[item === sub_item ? 'add' : 'remove']('active');
			}
		});
	}
	document.addEventListener('pointerdown', function(event) {
		// detect touch
		if(!state.device_list.touch && event.pointerType === 'touch') {
			state.device_list.touch = true;
			if(state.device) {
				show_notification('notification.input-device.touch.add');
			}
			else {
				state.device = 'touch';
				state.device_fallback = 'touch';
			}
			update_device_list();
		}
		// detect pen
		if(!state.device_list.pen && event.pointerType === 'pen') {
			state.device_list.pen = true;
			show_notification('notification.input-device.pencil.add');
			if(!state.device) {
				state.device = 'pen';
				state.device_fallback = 'pen';
			}
			update_device_list();
		}
	});
	document.addEventListener('pointermove', function(event) {
		// detect mouse
		if(!state.device_list.mouse && event.pointerType === 'mouse') {
			state.device_list.mouse = true;
			if(state.device) {
				show_notification('notification.input-device.mouse.add');
			}
			else {
				state.device = 'mouse';
				state.device_fallback = 'mouse';
			}
			update_device_list();
		}
	});
	// device
	let device_elements = document.querySelectorAll('[data-event="change.device"]');
	for(let item of device_elements) {
		item.addEventListener('click', function(event) {
			let code = item.dataset.code;
			if(state.device_list[code]) {
				state.device = code;
				if(state.device !== 'gamepad') {
					// point = { x: null, y: null };
					// last = { x: null, y: null };
				}
				for(let sub_item of device_elements) {
					sub_item.classList[item === sub_item ? 'add' : 'remove']('active');
				}
				update_device_list();
			}
		});
	}
}

function update_device_list() {
	for(let item of node.device_list) {
		let code = item.dataset.code;
		item.classList[code === state.device ? 'add' : 'remove']('active');
		item.classList[state.device_list[code] ? 'remove' : 'add']('inactive');
	}
}

function toggle_modal(element) {
	let code = element.dataset.modal;
	let modal = document.querySelector(`.${code}-modal`);
	if(modal) {
		let open = modal.classList.contains('hidden');
		if(open) {
			current_modal = element;
			for(let item of actions) {
				if(item !== element) {
					item.classList.remove('active');
				}
			}
			for(let item of tools) {
				if(item !== element) {
					item.classList.remove('active');
				}
			}
			for(let item of node.modal_list) {
				if(item !== modal) {
					item.classList.add('hidden');
				}
				let main = item.querySelector('.main');
				if(main) {
					main.classList.remove('hidden');
					main.style.marginLeft = '0';
				}
				let tab_list = item.querySelector('.tab-list');
				if(tab_list) {
					let tabs = tab_list.querySelectorAll('.tab');
					for(let tab of tabs) {
						tab.classList.add('hidden');
					}
				}
			}
			if(code === 'colors') {
				if(state.device === 'gamepad') {
					node.modal_color_list[0].classList.add('focus');
				}
			}
		}
		else {
			current_modal = null;
		}
		element.classList[open ? 'add' : 'remove']('active');
		modal.classList[open ? 'remove' : 'add']('hidden');
		modal.animate([
			{ opacity: 0, marginTop: '-6px' },
			{ opacity: 1, marginTop: '0' }
		], {
			duration: 100,
			fill: 'both'
		});
	}
}

function open_tab(element) {
	let code = element.dataset.tab;
	let main = element.parentNode.parentNode
	let tab = document.querySelector(`.${code}-tab`);
	if(tab) {
		main.style.marginLeft = '-100%';
		current_tab = tab.querySelector('.back');
		tab.classList.remove('hidden');
		main.classList.add('hidden');
	}
}

function close_tab(element) {
	let modal = element.parentNode.parentNode.parentNode.parentNode;
	let main = modal.querySelector('.main');
	let tab_list = modal.querySelector('.tab-list');
	let tabs = tab_list.querySelectorAll('.tab');
	for(let tab of tabs) {
		tab.classList.add('hidden');
	}
	main.classList.remove('hidden');
	main.style.marginLeft = '0';
	current_tab = null;
}

function show_notification(message) {
	let code = uuid();
	notification_code = code;
	let element = document.querySelector('.notification');
	let content = element.querySelector('.content');
	content.textContent = locale.get()[message];
	element.animate([
		{ opacity: 0 },
		{ opacity: 1}
	], {
		duration: 200,
		fill: 'both'
	});
	setTimeout(function() {
		if(notification_code === code) {
			element.animate([
				{ opacity: 1 },
				{ opacity: 0}
			], {
				duration: 200,
				fill: 'both'
			});
		}
	}, 2000);
}

function clear_screen() {
	canvas.clear();
	show_notification('notification.clear');
	toggle_modal(clear_modal);
}
