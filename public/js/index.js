import { COLORS } from './constant.js';
import { uuid, query, prevent } from './util.js';

// addons
import canvas from './addon/canvas.js';
import locale from './addon/locale.js';
import ripple from './addon/ripple.js';
// import gamepad from './addon/gamepad.js';

let node;
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
	},
	timestamp: null,
	modal: null,
	tab: null
};

window.addEventListener('load', init);

function init() {

	canvas.init();
	locale.init('en');
	locale.load('../asset/lang', ['en', 'de']);
	ripple.init();

	node = query({
		modal_list: { query: '.modal', all: true },
		tab_list: { query: '.tab', all: true },
		hotbar_list: { query: '.hotbar .color', all: true },
		modal_color_list: { query: '.colors-modal .color', all: true },
		language_list: { query: '.settings-modal .language-tab .item[data-event="change.language"]', all: true },
		device_list: { query: '.settings-modal .device-tab .item[data-event="change.device"]', all: true },
		modal_event_list: { query: '[data-event*=".modal"]', all: true },
		tab_event_list: { query: '[data-event*=".tab"]', all: true },
		tool_list: { query: '.tool', all: true },
		action_list: { query: '.action', all: true },
		notification: '.notification',
		scale_input: 'input.scale[type="range"]',
		clear: 'button.btn-apply[data-event="clear"]'
	});

	fill_hotbar_list();
	fill_modal_color_list();

	bind_events();
}

function bind_events() {
	document.addEventListener('dragstart', prevent);
	document.addEventListener('contextmenu', prevent);
	document.addEventListener('pointerdown', on_pointerdown);
	document.addEventListener('pointermove', on_pointermove);
	document.addEventListener('pointerup', on_pointerup);
	document.addEventListener('pointerout', on_pointerout);
	document.addEventListener('keydown', on_keydown);
	document.addEventListener('wheel', on_wheel);
	document.addEventListener('wheel', function(event) {
		if(event.ctrlKey) {
			prevent(event);
		}
	}, { passive: false });
	document.addEventListener('touchmove', function(event) {
		if(event.target !== node.scale_input) {
			event.preventDefault();
		}
	}, { passive: false });

	for(let item of node.language_list) {
		item.addEventListener('click', function(event) {
			let code = item.dataset.code;
			locale.change(code);
			update_language_list();
		});
	}
	for(let item of node.device_list) {
		item.addEventListener('click', function(event) {
			let code = item.dataset.code;
			if(state.device_list[code]) {
				state.device = code;
				update_device_list();
			}
		});
	}
	for(let item of node.modal_event_list) {
		item.addEventListener('click', function(event) {
			let code = item.dataset.code;
			let match = /^(toggle|open|close).modal$/.exec(item.dataset.event);
			if(match) {
				switch(match[1]) {
					case 'toggle':
						if(code) {
							state.modal = state.modal !== code ? code : null;
							update_modal_list();
						}
						break;
					case 'open':
						if(code && state.modal !== code) {
							state.modal = code;
							update_modal_list();
						}
						break;
					case 'close':
						if(state.modal !== null) {
							state.modal = null;
							update_modal_list();
						}
						break;
					default:
						break;
				}
			}
		});
	}
	for(let item of node.tab_event_list) {
		item.addEventListener('click', function(event) {
			let code = item.dataset.code;
			let match = /^(open|close).tab/.exec(item.dataset.event);
			if(match) {
				switch(match[1]) {
					case 'open':
						if(code && state.tab !== code) {
							state.tab = code;
							update_tab_list();
						}
						break;
					case 'close':
						if(state.tab !== null) {
							state.tab = null;
							update_tab_list();
						}
						break;
					default:
						break;
				}
			}
		});
	}
	node.scale_input.addEventListener('input', function(event) {
		state.radius = parseInt(node.scale_input.value);
		state.point = {
			x: parseInt(window.innerWidth / 2),
			y: parseInt(window.innerHeight / 2)
		};
		canvas.draw_cursor(state);
	});
	node.clear.addEventListener('click', function(event) {
		canvas.clear();
		show_notification('notification.clear');
		state.modal = null;
		update_modal_list();
	});
}

function update_language_list() {
	let lang = locale.get_current();
	for(let item of node.language_list) {
		let code = item.dataset.code;
		item.classList[code === lang ? 'add' : 'remove']('active');
	}
}

function update_device_list() {
	canvas.get_canvas().style.cursor = state.device === 'mouse' ? 'none' : '';
	for(let item of node.device_list) {
		let code = item.dataset.code;
		item.classList[code === state.device ? 'add' : 'remove']('active');
		item.classList[state.device_list[code] ? 'remove' : 'add']('inactive');
	}
}

function update_hotbar() {
	canvas.on_release(event);
	for(let item of node.hotbar_list) {
		item.classList[node.hotbar_list[state.index] === item ? 'add' : 'remove']('active');
	}
}

function update_focus(bool) {
	for(let item of node.hotbar_list) {
		item.style.pointerEvents = bool ? '' : 'none';
	}
	for(let item of node.tool_list) {
		item.style.pointerEvents = bool ? '' : 'none';
	}
	for(let item of node.action_list) {
		item.style.pointerEvents = bool ? '' : 'none';
	}
}

function update_modal_list() {
	for(let item of node.modal_list) {
		item.classList.add('hidden');
	}
	for(let item of node.tool_list) {
		item.classList.remove('active');
	}
	for(let item of node.action_list) {
		item.classList.remove('active');
	}
	state.tab = null;
	update_tab_list();
	if(state.modal) {
		let modal = document.querySelector(`.modal.${state.modal}-modal`);
		let button = document.querySelector(`[data-event*=".modal"][data-code="${state.modal}"]`);
		if(modal) {
			modal.classList.remove('hidden');
			modal.animate([
				{ opacity: 0, marginTop: '-6px' },
				{ opacity: 1, marginTop: '0' }
			], {
				duration: 100,
				fill: 'both'
			});
		}
		if(button) {
			button.classList.add('active');
		}
	}
}

function update_tab_list() {
	for(let item of node.modal_list) {
		let main = item.querySelector('.main');
		if(main) {
			main.classList.remove('hidden');
			main.style.marginLeft = '0';
		}
	}
	for(let item of node.tab_list) {
		item.classList.add('hidden');
	}
	if(state.modal && state.tab) {
		let modal = document.querySelector(`.modal.${state.modal}-modal`);
		let tab = document.querySelector(`.${state.tab}-tab`);
		let main = modal.querySelector('.main');
		if(modal && tab && main) {
			tab.classList.remove('hidden');
			main.style.marginLeft = '-100%';
			main.classList.add('hidden');
		}
	}
}

function on_pointerdown(event) {
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
	// drawing
	if(state.device === event.pointerType) {
		if(event.target === canvas.get_canvas()) {
			update_focus(false);
			canvas.on_press(event, state);
			state.point = {
				x: event.layerX,
				y: event.layerY
			};
			canvas.draw_cursor(state);
		}
	}
}

function on_pointermove(event) {
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
	// drawing
	if(state.device === event.pointerType) {
		if(event.target === canvas.get_canvas()) {
			canvas.on_move(event, state);
			state.point = {
				x: event.layerX,
				y: event.layerY
			};
			canvas.draw_cursor(state);
		}
	}
}

function on_pointerup(event) {
	if(state.device === event.pointerType) {
		canvas.on_release(event);
		canvas.draw_cursor(state);
		update_focus(true);
	}
}

function on_pointerout(event) {
	if(state.device === event.pointerType) {
		canvas.on_release(event);
		state.point = null;
		canvas.draw_cursor(state);
	}
}

function on_keydown(event) {
	let lock = event.getModifierState("CapsLock");
	if(!event.ctrlKey && !event.shiftKey && !event.altKey) {
		if(!lock) {
			if(event.code.startsWith('Digit')) {
				let i = parseInt(event.code.substr(5)) - 1;
				if(state.index !== i) {
					if(i >= 0 && i < state.color_list.length) {
						state.color = state.color_list[i];
						state.index = i;
						canvas.draw_cursor(state);
						update_hotbar();
					}
				}
			}
		}
	}
	if(event.code === 'Escape') {
		if(state.tab) {
			state.tab = null;
			update_tab_list();
			return;
		}
		if(state.modal) {
			state.modal = null;
			update_modal_list();
			return;
		}
	}
}

function on_wheel(event) {
	if(state.device === 'mouse') {
		let y = event.deltaY < 0 ? 1 : -1;
		if(state.radius + y > 2 - 1 && state.radius + y < 50 + 1) {
			state.radius += y;
			node.scale_input.value = state.radius;
			canvas.draw_cursor(state);
		}
	}
}

function fill_hotbar_list() {
	for(let [ i, item ] of Object.entries(node.hotbar_list)) {
		if(state.color_list.length > i) {
			item.style.background = COLORS[state.color_list[i]];
			item.addEventListener('pointerdown', function(event) {
				state.color = state.color_list[i];
				state.index = i;
				canvas.draw_cursor(state);
				update_hotbar();
			});
			if(state.index == i) {
				item.classList.add('active');
			}
		}
	}
}

function fill_modal_color_list() {
	for(let [ i, item ] of Object.entries(node.modal_color_list)) {
		if(COLORS.length > i) {
			item.style.background = COLORS[i];
			item.addEventListener('pointerdown', function(event) {
				state.color = i;
				state.modal = null;
				update_modal_list();
				canvas.draw_cursor(state);
			});
		}
	}
}

function show_notification(message) {
	let code = uuid();
	state.timestamp = code;
	let content = node.notification.querySelector('.content');
	content.textContent = locale.get()[message];
	node.notification.animate([
		{ opacity: 0 },
		{ opacity: 1 }
	], {
		duration: 200,
		fill: 'both'
	});
	setTimeout(function() {
		if(state.timestamp === code) {
			node.notification.animate([
				{ opacity: 1 },
				{ opacity: 0 }
			], {
				duration: 200,
				fill: 'both'
			});
		}
	}, 2000);
}
