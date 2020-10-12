import { FIREBASE, COLORS, PRIORITY_MODAL, LOCALES } from './constant.js';
import { uuid, query, prevent } from './util.js';

import locale from './mod/locale.js';
import canvas from './mod/canvas.js';
import cookie from './mod/cookie.js';

let node;
let state = {
	color: 54,
	color_list: [54, 2, 17, 27, 37, 12],
	radius: 14,
	region: [],
	crop: false,
	index: 0,
	device: null,
	device_fallback: null,
	device_list: {
		mouse: false,
		touch: false,
		pen: false,
		gamepad: false
	},
	pencil_list: [
		'pen',
		'marker',
		'eraser'
	],
	pencil: 'pen',
	timestamp: null,
	modal: null,
	tab: null,
	caption: null,
	option: {
		view_mode: false,
		crop_mode: false,
		dark_mode: false
	},
	history: [],
	redo_history: [],
	key: {}
};

export async function init() {

	locale.init();
	await locale.load('./asset/lang', LOCALES);
	canvas.init();

	node = query({
		wrapper: '.wrapper',
		controls: '.controls',
		modal_list: { query: '.modal', all: true },
		tab_list: { query: '.tab', all: true },
		header: '.header-list',
		hotbar: '.hotbar',
		hotbar_list: { query: '.hotbar .color', all: true },
		modal_color_list: { query: '.colors-modal .color', all: true },
		language_list: { query: '.more-modal .language-tab .item[data-event="change.language"]', all: true },
		device_list: { query: '.more-modal .device-tab .item[data-event="change.device"]', all: true },
		pencil_list: { query: '.pencil-modal .item[data-event="change.pencil"]', all: true },
		modal_event_list: { query: '[data-event*=".modal"]', all: true },
		tab_event_list: { query: '[data-event*=".tab"]', all: true },
		capture_event_list: { query: '[data-event*=".capture"]', all: true },
		tool_list: { query: '.tool', all: true },
		action_list: { query: '.action', all: true },
		notification: '.notification',
		scale_input: 'input.scale[type="range"]',
		clear: 'button.btn-apply[data-event="clear"]',
		pencil_tool: '.tool-item[data-code="pencil"]',
		option_event_fullscreen: '[data-event="toggle.fullscreen"]',
		option_event_view_mode: '[data-event="toggle.view-mode"]',
		option_event_dark_mode: '[data-event="toggle.dark-mode"]',
		undo_tool: '[data-lang="action.undo"]',
		redo_tool: '[data-lang="action.redo"]',
		colors_modal: '.colors-modal',
		mainbar: '.mainbar',
		sidebar: '.sidebar',
		edit_mode: '[data-event="close.view-mode"]',
		content: '.modal .content',
		caption_list: { query: '[data-event="open.content"]' , all: true },
		content_list: { query: '.content-item' , all: true },
		download: '#download',
		cookie: '.cookie',
		accept: '.button.accept'
	});

	update_language_list();

	fill_hotbar_list();
	fill_modal_color_list();

	bind_events(locale);

	node.wrapper.animate([
		{ opacity: 1 },
		{ opacity: 0, pointerEvents: 'none' }
	], {
		delay: 100,
		duration: 500,
		fill: 'both'
	});
	node.hotbar.animate([
		{ opacity: 0, bottom: '-10px' },
		{ opacity: 1 }
	], {
		delay: 600,
		easing: 'ease-out',
		duration: 250,
		fill: 'both'
	});

	if(!cookie.hasAccepted()) {
		node.cookie.classList.remove('hidden');
		cookie.requestPermission(node.accept)
			.then(function() {
				node.cookie.classList.add('hidden');
				load_resources();
			});
	}
	else {
		load_resources();
	}
}

function load_resources() {
	let dark_mode = localStorage.getItem('outline.custom.dark-mode');
	if(dark_mode && dark_mode === 'true') {
		document.body.classList.add('theme-dark');
		state.option.dark_mode = true;
		update_dark_mode_option({ passive: true });
	}
	let lang = localStorage.getItem('outline.custom.lang');
	if(lang && LOCALES.includes(lang)) {
		locale.change(lang);
		update_language_list();
	}
	try {
		firebase.initializeApp(FIREBASE);
		firebase.analytics();
	}
	catch(error) {
		console.warn('Unable to load Google Analytics!');
	}
}

function bind_events(locale) {
	document.addEventListener('dragstart', prevent);
	document.addEventListener('contextmenu', prevent);
	document.addEventListener('pointerdown', on_pointerdown);
	document.addEventListener('pointermove', on_pointermove);
	document.addEventListener('pointerup', on_pointerup);
	document.addEventListener('pointerout', on_pointerout);
	document.addEventListener('keydown', on_keydown);
	document.addEventListener('keyup', on_keyup);
	document.addEventListener('wheel', on_wheel);
	document.addEventListener('wheel', function(event) {
		if(event.ctrlKey) {
			prevent(event);
		}
	}, { passive: false });
	document.addEventListener('touchmove', function(event) {
		if(event.target !== node.scale_input && event.target !== node.colors_modal && !node.modal_color_list.includes(event.target) && event.target !== node.content) {
			event.preventDefault();
		}
	}, { passive: false });

	for(let item of node.language_list) {
		item.addEventListener('click', function() {
			let code = item.dataset.code;
			locale.change(code);
			update_language_list();
		});
	}
	for(let item of node.device_list) {
		item.addEventListener('click', function() {
			let code = item.dataset.code;
			if(state.device_list[code]) {
				state.device = code;
				update_device_list();
			}
		});
	}
	for(let item of node.pencil_list) {
		item.addEventListener('click', function() {
			state.pencil = item.dataset.code;
			update_pencil_list();
			state.modal = null;
			update_modal_list();
		});
	}
	for(let item of node.modal_event_list) {
		item.addEventListener('click', function() {
			let code = item.dataset.code;
			let match = /^(toggle|open|close).modal$/.exec(item.dataset.event);
			if(match) {
				if(!item.classList.contains('inactive')) {
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
			}
		});
	}
	for(let item of node.tab_event_list) {
		item.addEventListener('click', function() {
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
	for(let item of node.capture_event_list) {
		item.addEventListener('click', function() {
			let code = item.dataset.code;
			if(code === 'download') {
				if(state.option.crop_mode) {
					state.option.crop_mode = false;
					canvas.draw_crop(state);
					canvas.get_canvas().style.cursor = 'default';
				}
				let data = canvas.create_capture(0, 0, window.innerWidth, window.innerHeight, 60);
				if(data) {
					node.download.download = `outline-${uuid()}.png`;
					node.download.href = data;
					node.download.click();
				}
				else {
					console.warn('Unable to create capture from current state!');
				}
			}
			if(code === 'crop') {
				state.option.crop_mode = true;
				state.region = [];
				canvas.draw_crop(state);
				canvas.get_canvas().style.cursor = 'crosshair';
			}
			state.modal = null;
			state.tab = null;
			update_modal_list();
		})
	}
	node.scale_input.addEventListener('input', function() {
		state.radius = parseInt(node.scale_input.value);
		state.point = {
			x: parseInt(window.innerWidth / 2),
			y: parseInt(window.innerHeight / 2)
		};
		canvas.draw_cursor(state);
	});
	node.clear.addEventListener('click', function() {
		canvas.clear(state);
		update_undo_and_redo();
		show_notification('notification.clear');
		state.modal = null;
		update_modal_list();
	});
	node.option_event_fullscreen.addEventListener('click', function() {
		if(!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		}
		else if(document.exitFullscreen) {
			document.exitFullscreen();
		}
	});
	window.addEventListener('fullscreenchange', on_fullscreenchange);
	node.option_event_view_mode.addEventListener('click', function() {
		state.option.view_mode = !state.option.view_mode;
		update_view_mode_option();
	});
	node.option_event_dark_mode.addEventListener('click', function() {
		state.option.dark_mode = !state.option.dark_mode;
		update_dark_mode_option();
	});
	node.undo_tool.addEventListener('click', function() {
		canvas.undo(state);
		update_undo_and_redo();
	});
	node.redo_tool.addEventListener('click', function() {
		canvas.redo(state);
		update_undo_and_redo();
	});
	node.edit_mode.addEventListener('click', function() {
		state.option.view_mode = false;
		update_view_mode_option();
	});
	for(let item of node.caption_list) {
		item.addEventListener('click', function() {
			state.caption = item.dataset.code;
			update_caption_list();
		});
	}

	window.addEventListener('beforeunload', function() {
		// ...
	});
}

function update_language_list() {
	let lang = locale.get_current();
	for(let item of node.language_list) {
		let code = item.dataset.code;
		item.classList[code === lang ? 'add' : 'remove']('active');
	}
	if(cookie.hasAccepted()) {
		localStorage.setItem('outline.custom.lang', lang);
	}
}

function update_device_list() {
	if(!state.option.view_mode && !state.option.crop_mode) {
		canvas.get_canvas().style.cursor = state.device === 'mouse' ? 'none' : '';
	}
	for(let item of node.device_list) {
		let code = item.dataset.code;
		item.classList[code === state.device ? 'add' : 'remove']('active');
		item.classList[state.device_list[code] ? 'remove' : 'add']('inactive');
	}
}

function update_pencil_list() {
	for(let item of node.pencil_list) {
		let code = item.dataset.code;
		item.classList[code === state.pencil ? 'add' : 'remove']('active');
		if(code === state.pencil) {
			node.pencil_tool.querySelector('i.ico').innerHTML = item.querySelector('i.ico').innerHTML;
		}
	}
}

function update_hotbar() {
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
	for(let item of node.modal_event_list) {
		item.classList.remove('active');
	}
	state.tab = null;
	update_tab_list();
	state.caption = 'controls';
	update_caption_list();
	if(state.modal) {
		canvas.on_release(event, state, true);
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

function update_fullscreen_option() {
	let fullscreen = document.fullscreenElement;
	node.option_event_fullscreen.classList[fullscreen ? 'add' : 'remove']('active');
	node.option_event_fullscreen.querySelector('.ico').textContent = fullscreen ? 'toggle_on' : 'toggle_off';
}

function update_view_mode_option() {
	let view_mode = state.option.view_mode;
	show_notification(`notification.view-mode.${view_mode ? 'on' : 'off'}`);
	node.option_event_view_mode.classList[view_mode ? 'add' : 'remove']('active');
	node.option_event_view_mode.querySelector('.ico').textContent = view_mode ? 'toggle_on' : 'toggle_off';
	state.modal = null;
	state.tab = null;
	update_modal_list();
	if(view_mode) {
		canvas.on_release(null, state);
		canvas.clear_cursor();
		canvas.get_canvas().style.cursor = 'default';
		node.hotbar.classList.add('inactive');
		node.header.classList.add('inactive');
		node.hotbar.animate([
			{ opacity: 1 },
			{ opacity: 0, bottom: '-10px', pointerEvents: 'none' }
		], {
			easing: 'ease-out',
			duration: 250,
			fill: 'both'
		});
		node.mainbar.animate([
			{ opacity: 1, marginTop: 0 },
			{ opacity: 0, marginTop: '-60px' }
		], {
			easing: 'ease-out',
			duration: 250,
			fill: 'both'
		});
		node.sidebar.classList.remove('hidden');
		node.sidebar.animate([
			{ opacity: 0 },
			{ opacity: 1 }
		], {
			delay: 250,
			easing: 'ease-out',
			duration: 250,
			fill: 'both'
		});
	}
	else {
		state.option.crop_mode = false;
		canvas.draw_crop(state);
		canvas.on_release(null, state, true);
		canvas.get_canvas().style.cursor = 'none';
		node.hotbar.classList.remove('inactive');
		node.header.classList.remove('inactive');
		node.hotbar.animate([
			{ opacity: 0, bottom: '-10px' },
			{ opacity: 1, bottom: '30px' }
		], {
			easing: 'ease-out',
			duration: 250,
			fill: 'both'
		});
		node.mainbar.animate([
			{ opacity: 0, marginTop: '-60px' },
			{ opacity: 1, marginTop: 0 }
		], {
			easing: 'ease-out',
			duration: 250,
			fill: 'both'
		});
		node.sidebar.classList.add('hidden');
	}
}

function update_dark_mode_option(args) {
	let { passive = false } = args || {};
	let dark_mode = state.option.dark_mode;
	if(!passive) {
		show_notification(`notification.dark-mode.${dark_mode ? 'on' : 'off'}`);
	}
	node.option_event_dark_mode.classList[dark_mode ? 'add' : 'remove']('active');
	node.option_event_dark_mode.querySelector('.ico').textContent = dark_mode ? 'toggle_on' : 'toggle_off';
	document.body.classList[dark_mode ? 'add' : 'remove']('theme-dark');
	if(cookie.hasAccepted()) {
		localStorage.setItem('outline.custom.dark-mode', dark_mode);
	}
}

function update_undo_and_redo() {
	node.undo_tool.classList[state.history.length > 0 ? 'remove' : 'add']('inactive');
	node.redo_tool.classList[state.redo_history.length > 0 ? 'remove' : 'add']('inactive');
}

function update_caption_list() {
	for(let item of node.caption_list) {
		let code = item.dataset.code;
		item.classList[code === state.caption ? 'add' : 'remove']('active');
	}
	for(let item of node.content_list) {
		let code = item.dataset.code;
		item.classList[code === state.caption ? 'remove' : 'add']('hidden');
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
	if(event.button == 0) {
		if(!state.option.view_mode && state.device === event.pointerType) {
			if(event.target === canvas.get_canvas()) {
				if(!PRIORITY_MODAL.includes(state.modal)) {
					update_focus(false);
					canvas.on_press(event, state);
					update_undo_and_redo();
					state.point = {
						x: event.layerX,
						y: event.layerY
					};
					canvas.draw_cursor(state);
				}
			}
		}
		if(state.option.view_mode && state.option.crop_mode) {
			if(event.target === canvas.get_canvas()) {
				state.crop = true;
				state.region = [];
				state.region[0] = { x: event.layerX, y: event.layerY };
				canvas.draw_crop(state);
			}
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
	if(!state.option.view_mode && state.device === event.pointerType) {
		if(event.target === canvas.get_canvas()) {
			if(!PRIORITY_MODAL.includes(state.modal)) {
				canvas.on_move(event, state);
			}
			state.point = {
				x: event.layerX,
				y: event.layerY
			};
		}
		canvas.draw_cursor(state);
	}
	if(state.option.view_mode && state.option.crop_mode) {
		if(state.crop && event.target === canvas.get_canvas()) {
			state.region[1] = { x: event.layerX, y: event.layerY };
			canvas.draw_crop(state);
		}
	}
}

function on_pointerup(event) {
	if(event.button == 0) {
		if(!state.option.view_mode && state.device === event.pointerType) {
			canvas.on_release(event, state);
			update_undo_and_redo();
			update_focus(true);
		}
		if(state.option.view_mode && state.option.crop_mode) {
			if(state.crop && event.target === canvas.get_canvas()) {
				state.crop = false;
				state.region[1] = { x: event.layerX, y: event.layerY };
				canvas.draw_crop(state);
				let [ begin, end ] = state.region;
				let delta = {
					x: end.x - begin.x,
					y: end.y - begin.y
				};
				let x = begin.x < end.x ? begin.x : end.x;
				let y = begin.y < end.y ? begin.y : end.y;
				if(delta.x < 0) {
					delta.x *= -1;
				}
				if(delta.y < 0) {
					delta.y *= -1;
				}
				if(delta.x != 0 && delta.y != 0) {
					let data = canvas.create_capture(x, y, delta.x, delta.y);
					if(data) {
						node.download.download = `outline-${uuid()}.png`;
						node.download.href = data;
						node.download.click();
						state.option.crop_mode = false;
						canvas.draw_crop(state);
						canvas.get_canvas().style.cursor = 'default';
					}
					else {
						console.warn('Unable to create capture from current state!');
					}
				}
			}
		}
	}
}

function on_pointerout(event) {
	if(!state.option.view_mode && state.device === event.pointerType) {
		canvas.on_release(event, state);
		update_undo_and_redo();
		state.point = null;
		canvas.draw_cursor(state);
	}
	if(state.option.view_mode && state.option.crop_mode) {
		if(state.crop && event.target === canvas.get_canvas()) {
			state.crop = false;
			state.region = [];
			canvas.draw_crop(state);
		}
	}
}

function on_keydown(event) {
	if(!state.key[event.code]) {
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
			if(state.option.view_mode && state.option.crop_mode) {
				state.option.crop_mode = false;
				canvas.draw_crop(state);
				canvas.get_canvas().style.cursor = 'default';
			}
		}
		if(!event.ctrlKey && !event.shiftKey && !event.altKey) {
			if(!state.option.view_mode) {
				if(event.code.startsWith('Digit')) {
					let i = parseInt(event.code.substr(5)) - 1;
					if(state.index !== i) {
						if(i >= 0 && i < state.color_list.length) {
							canvas.on_release(event, state);
							state.color = state.color_list[i];
							state.index = i;
							canvas.draw_cursor(state);
							update_hotbar();
						}
					}
				}
				if(event.code === 'KeyZ') {
					state.modal = state.modal !== 'colors' ? 'colors' : null;
					update_modal_list();
				}
				if(event.code === 'KeyX') {
					state.modal = state.modal !== 'scale' ? 'scale' : null;
					update_modal_list();
				}
				if(event.code === 'KeyC') {
					state.modal = state.modal !== 'pencil' ? 'pencil' : null;
					update_modal_list();
				}
				if(event.code === 'KeyV') {
					state.modal = state.modal !== 'clear' ? 'clear' : null;
					update_modal_list();
				}
				/*
				if(event.code === 'KeyB') {
					state.modal = state.modal !== 'multiplayer' ? 'multiplayer' : null;
					update_modal_list();
				}
				if(event.code === 'KeyN') {
					state.modal = state.modal !== 'account' ? 'account' : null;
					update_modal_list();
				}
				*/
				if(event.code === 'KeyM') {
					state.modal = state.modal !== 'more' ? 'more' : null;
					update_modal_list();
				}
				if(event.code === 'KeyQ') {
					canvas.on_release(event, state);
					state.pencil = state.pencil_list[0];
					canvas.draw_cursor(state);
					update_pencil_list();
				}
				if(event.code === 'KeyW') {
					canvas.on_release(event, state);
					state.pencil = state.pencil_list[1];
					canvas.draw_cursor(state);
					update_pencil_list();
				}
				if(event.code === 'KeyE') {
					canvas.on_release(event, state);
					state.pencil = state.pencil_list[2];
					canvas.draw_cursor(state);
					update_pencil_list();
				}
				if(event.code === 'KeyF') {
					if(!document.fullscreenElement) {
						document.documentElement.requestFullscreen();
					}
					else if(document.exitFullscreen) {
						document.exitFullscreen();
					}
				}
			}
			if(state.option.view_mode && !state.option.crop_mode) {
				if(event.code === 'KeyZ') {
					state.modal = state.modal !== 'capture' ? 'capture' : null;
					update_modal_list();
				}
			}
			if(event.code === 'Space') {
				state.option.view_mode = !state.option.view_mode;
				update_view_mode_option();
			}
		}
		if(event.ctrlKey && !event.shiftKey && !event.altKey) {
			if(event.code === 'KeyY') {
				canvas.undo(state);
				update_undo_and_redo();
			}
			if(event.code === 'KeyZ') {
				canvas.redo(state);
				update_undo_and_redo();
			}
		}
		if(event.code === 'Enter') {
			if(state.modal === 'clear') {
				node.clear.click();
			}
		}
		state.key[event.code] = true;
	}
}

function on_keyup(event) {
	state.key[event.code] = false;
}

function on_wheel(event) {
	if(!state.option.view_mode && state.device === 'mouse') {
		if(event.target === canvas.get_canvas()) {
			let y = event.deltaY < 0 ? 1 : -1;
			if(state.radius + y > 2 - 1 && state.radius + y < 50 + 1) {
				canvas.on_release(event, state);
				state.radius += y;
				node.scale_input.value = state.radius;
				canvas.draw_cursor(state);
			}
		}
	}
}

function on_fullscreenchange() {
	update_fullscreen_option();
}

function fill_hotbar_list() {
	for(let [ i, item ] of Object.entries(node.hotbar_list)) {
		if(state.color_list.length > i) {
			item.style.background = COLORS[state.color_list[i]];
			item.addEventListener('click', function(event) {
				canvas.on_release(event, state);
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
			item.addEventListener('click', function(event) {
				canvas.on_release(event, state);
				state.color = i;
				state.modal = null;
				update_modal_list();
				canvas.draw_cursor(state);
				state.index = null;
				update_hotbar();
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
	}, 1000);
}
