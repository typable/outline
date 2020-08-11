import { uuid } from './util.js';
import { load } from './locale.js';
import { read, key_pressed } from './gamepad.js';

/* !!! JS -> PROPERTIES */
// ^'([\w.-]+)':\s'(.*)',?$
// $1=$2

window.toggle_modal = toggle_modal;
window.open_tab = open_tab;
window.close_tab = close_tab;
window.change_device = change_device;
window.change_language = change_language;
window.clear_screen = clear_screen;

let LANG;

const KEY_BINDING = {
	0: 'A',
	1: 'B',
	2: 'X',
	3: 'Y',
	4: 'L1',
	5: 'R1',
	6: 'L2',
	7: 'R2',
	8: 'Option',
	9: 'Menu',
	10: 'L3',
	11: 'R3',
	12: 'Up',
	13: 'Down',
	14: 'Left',
	15: 'Right',
	16: 'Power',
	17: 'Assist',
	18: 'Capture'
};

const COLORS = {
	0: '#FFCDD2',
	1: '#E57373',
	2: '#F44336',
	3: '#D32F2F',
	4: '#B71C1C',
	5: '#F8BBD0',
	6: '#F06292',
	7: '#E91E63',
	8: '#C2185B',
	9: '#880E4F',
	10: '#E1BEE7',
	11: '#BA68C8',
	12: '#9C27B0',
	13: '#7B1FA2',
	14: '#4A148C',
	15: '#BBDEFB',
	16: '#64B5F6',
	17: '#2196F3',
	18: '#1976D2',
	19: '#0D47A1',
	20: '#B2EBF2',
	21: '#4DD0E1',
	22: '#00BCD4',
	23: '#0097A7',
	24: '#006064',
	25: '#B2DFDB',
	26: '#4DB6AC',
	27: '#009688',
	28: '#00796B',
	29: '#004D40',
	30: '#C8E6C9',
	31: '#81C784',
	32: '#4CAF50',
	33: '#388E3C',
	34: '#1B5E20',
	35: '#FFF9C4',
	36: '#FFF176',
	37: '#FFEB3B',
	38: '#FBC02D',
	39: '#F57F17',
	40: '#FFE0B2',
	41: '#FFB74D',
	42: '#FF9800',
	43: '#F57C00',
	44: '#E65100',
	45: '#D7CCC8',
	46: '#A1887F',
	47: '#795548',
	48: '#5D4037',
	49: '#3E2723',
	50: '#F5F5F5',
	51: '#E0E0E0',
	52: '#9E9E9E',
	53: '#616161',
	54: '#141414'
};

const COLOR = {
	0: '#141414',
	1: '#F44336',
	2: '#2196F3',
	3: '#009688',
	4: '#FFEB3B',
	5: '#9C27B0'
};

const COLORS_LENGTH = Object.values(COLORS).length;
const COLOR_LENGTH = Object.values(COLOR).length;

let canvas;
let overlay;
let g;
let o;
let ad;
let hotbar;
let toolbar;
let actionbar;
let colors;
let actions;
let tools;
let modals;
let device_options;
let device_empty;
let current_modal;
let current_tab;
let modal_colors;
let colors_modal;
let capture_modal;
let clear_modal;
let scale_range;

let device;
let devices = {
	mouse: false,
	touch: false,
	pen: false,
	gamepad: false
};
let fallback_device;

let lang = 'en';
let notification_code;

let cache;
let point;
let last;
let start;
let index = 0;
let radius = 14;
let lock_x = false;
let lock_y = false;
let draw;
let erase;
let pressed = {};
let arrow_y = 0;
let arrow_x = 0;
let left_modal = false;

window.addEventListener('load', init);

function init() {
	load('../asset/lang', ['en', 'de'])
		.then(function(data) {
			LANG = data;
		});
	canvas = document.querySelector('#canvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	g = canvas.getContext('2d');
	overlay = document.querySelector('#overlay');
	overlay.width = window.innerWidth;
	overlay.height = window.innerHeight;
	o = overlay.getContext('2d');
	window.onresize = function() {
	 	cache = g.getImageData(0, 0, canvas.width, canvas.height);
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		g.putImageData(cache, 0, 0);
		cache = o.getImageData(0, 0, overlay.width, overlay.height);
		overlay.width = window.innerWidth;
		overlay.height = window.innerHeight;
		o.putImageData(cache, 0, 0);
	}
	let ripple = document.querySelectorAll('.ripple');
	for(let item of ripple) {
		item.addEventListener('pointerdown', function(event) {
			item.classList.add('ripple-active');
		});
	}
	document.addEventListener('touchmove', function(event) {
		let { target } = event;
		if(target !== scale_range) {
			event.preventDefault();
		}
	}, { passive: false });
	document.addEventListener('pointerup', function(event) {
		for(let item of ripple) {
			item.classList.remove('ripple-active');
		}
	});
	device_options = document.querySelectorAll('.settings-modal .device-tab .item[data-device]');
	device_empty = document.querySelector('.settings-modal .device-tab .item.empty');

	ad = document.querySelector('.controls .ad');
	hotbar = document.querySelector('.controls .hotbar');
	toolbar = document.querySelector('.controls .toolbar');
	actionbar = document.querySelector('.controls .actionbar');
	colors = Array.from(hotbar.querySelectorAll('.color'));
	actions = document.querySelectorAll('.actionbar .action');
	tools = document.querySelectorAll('.toolbar .tool');
	modals = document.querySelectorAll('.modal');
	modal_colors = document.querySelectorAll('.colors-modal .color');
	colors_modal = document.querySelector('.toolbar .tool[data-modal="colors"]');
	capture_modal = document.querySelector('.toolbar .tool[data-modal="capture"]');
	clear_modal = document.querySelector('.toolbar .tool[data-modal="clear"]');
	scale_range = document.querySelector('.scale-modal input[type="range"]');
	for(let i in colors) {
		if(COLOR_LENGTH > i) {
			if(i == index) {
				colors[i].classList.add('active');
			}
			colors[i].style.background = COLOR[i];
			colors[i].addEventListener('pointerdown', function(event) {
				for(let j in colors) {
					if(COLOR_LENGTH > j) {
						if(j == i) {
							index = j;
						}
						colors[j].classList[j == i ? 'add' : 'remove']('active');
					}
				}
			});
		}
	}
	for(let i in modal_colors) {
		if(COLORS_LENGTH > i) {
			modal_colors[i].style.background = COLORS[i];
		}
	}
	document.addEventListener('dragstart', function(event) {
		event.preventDefault();
	});
	document.addEventListener('contextmenu', function(event) {
		event.preventDefault();
	});
	scale_range.addEventListener('input', function(event) {
		radius = parseInt(scale_range.value);
		left_modal = false;
		point.x = parseInt(window.innerWidth / 2);
		point.y = parseInt(window.innerHeight / 2);
	});
	document.addEventListener('wheel', function(event) {
		if(device !== 'gamepad') {
			let { deltaY } = event;
			let y = deltaY < 0 ? 1 : -1;
			if(radius + y > 2 - 1 && radius + y < 50 + 1) {
				radius += y;
				scale_range.value = radius;
			}
		}
	});
	document.addEventListener('wheel', function(event) {
		if(device !== 'gamepad') {
			let { ctrlKey } = event;
			if(ctrlKey) {
				event.preventDefault();
				return;
			}
		}
	}, { passive: false });
	canvas.addEventListener('pointerdown', function(event) {
		let { layerX, layerY, buttons, pointerType, target } = event;
		if(!devices.touch && pointerType === 'touch') {
			devices.touch = true;
			if(device) {
				show_notification('notification.input-device.touch.add');
			}
		}
		if(!devices.pen && pointerType === 'pen') {
			devices.pen = true;
			show_notification('notification.input-device.pencil.add');
		}
		if(device !== 'gamepad') {
			if(!lock_x) {
				start.x = layerX;
			}
			if(!lock_y) {
				start.y = layerY;
			}
			if(current_modal && target === canvas) {
				toggle_modal(current_modal);
				left_modal = true;
			}
			else {
				left_modal = false;
			}
			if(device === pointerType) {
				if(!current_modal && !left_modal) {
					if(start.x !== null && start.y !== null) {
						if(buttons == 1) {
							draw_line(start, null, radius, COLOR[index]);
						}
						if(buttons == 2) {
							draw_line(start, null, radius, 'white');
							erase = true;
							last.x = null;
							last.y = null;
						}
					}
				}
				ad.style.pointerEvents = 'none';
				hotbar.style.pointerEvents = 'none';
				toolbar.style.pointerEvents = 'none';
				actionbar.style.pointerEvents = 'none';
				for(let modal of modals) {
					modal.style.pointerEvents = 'none';
				}
			}
		}
	});
	document.addEventListener('pointermove', function(event) {
		let { layerX, layerY, target, pointerType, buttons } = event;
		if(!devices.mouse && pointerType === 'mouse') {
			devices.mouse = true;
		}
		if(device !== 'gamepad') {
			draw = buttons == 1;
			erase = buttons == 2;
			if(buttons == 3) {
				draw = true;
				erase = true;
			}
			if(start.x !== null || start.y !== null) {
				last = start;
				start = {
					x: null,
					y: null
				};
			}
			if(device === pointerType) {
				left_modal = false;
				if(target == canvas) {
					if(!lock_x) {
						point.x = layerX;
					}
					if(!lock_y) {
						point.y = layerY;
					}
				}
				if(draw && erase) {
					last.x = null;
					last.y = null;
				}
			}
			if(!document.hasFocus()) {
				draw = false;
				erase = false;
			}
		}
	});
	document.addEventListener('pointerout', function(event) {
		if(device !== 'gamepad') {
			if(!lock_x && !lock_y) {
				point.x = null;
				point.y = null;
			}
		}
	});
	document.addEventListener('pointerup', function(event) {
		if(device !== 'gamepad') {
			let { buttons } = event;
			draw = buttons == 1;
			erase = buttons == 2;
			last.x = null;
			last.y = null;
			ad.style.pointerEvents = '';
			hotbar.style.pointerEvents = '';
			toolbar.style.pointerEvents = '';
			actionbar.style.pointerEvents = '';
			for(let modal of modals) {
				modal.style.pointerEvents = '';
			}
		}
	});
	document.addEventListener('keydown', function(event) {
		let { code, ctrlKey, shiftKey, altKey } = event;
		if(device !== 'gamepad') {
			let lock = event.getModifierState("CapsLock");
			if(!ctrlKey && !shiftKey && !altKey) {
				if(code === 'KeyX') {
					lock_y = !lock_y;
					lock_x = false;
				}
				if(code === 'KeyZ') {
					lock_x = !lock_x;
					lock_y = false;
				}
				if(!lock) {
					if(code.startsWith('Digit')) {
						let number = parseInt(code.substr(5)) - 1;
						if(number >= 0 && number < COLOR_LENGTH) {
							index = number;
							for(let i in colors) {
								if(COLOR_LENGTH > i) {
									colors[i].classList[i == index ? 'add' : 'remove']('active');
								}
							}
						}
					}
				}
			}
		}
		if(code === 'Escape') {
			if(current_tab) {
				close_tab(current_tab);
			}
			else if(current_modal) {
				toggle_modal(current_modal);
			}
		}
	});
	point = { x: null, y: null };
	last = { x: null, y: null };
	start = { x: null, y: null };
	update();
}

function update() {
	if(radius < 2) {
		radius = 2;
	}
	if(radius > 50) {
		radius = 50;
	}
	let gamepad = navigator.getGamepads()[0];
	if(gamepad) {
		if(!devices.gamepad) {
			devices.gamepad = true;
			show_notification('notification.input-device.gamepad.add');
			if(gamepad.vibrationActuator) {
				gamepad.vibrationActuator.playEffect("dual-rumble", {
					startDelay: 0,
					duration: 100,
					weakMagnitude: 1.0,
					strongMagnitude: 1.0
				});
			}
		}
		if(device === 'gamepad') {
			if(point.x == null && point.y == null) {
				point.x = parseInt(window.innerWidth / 2);
				point.y = parseInt(window.innerHeight / 2);
			}
			let input = read(gamepad);
			let speed = 4;
			draw = input.button['A'];
			erase = input.button['B'];
			if(pressed['L2'] && !pressed['R2']) {
				speed = 10;
			}
			if(pressed['R2'] && !pressed['L2']) {
				speed = 1;
			}
			// move
			if(!lock_x) {
				point.x += input.axes['Left'].x * speed;
				if(point.x < 0 ) {
					point.x = 0;
				}
				if(point.x > window.innerWidth) {
					point.x = window.innerWidth;
				}
			}
			if(!lock_y) {
				point.y += input.axes['Left'].y * speed;
				if(point.y < 0) {
					point.y = 0;
				}
				if(point.y > window.innerHeight) {
					point.y = window.innerHeight;
				}
			}
			// colors
			key_pressed('Option', input, function() {
				toggle_modal(colors_modal);
			});
			// capture
			key_pressed('Capture', input, function() {
				toggle_modal(capture_modal);
			});
			// draw
			key_pressed('A', input, function() {
				last.x = null;
				last.y = null;
				if(!current_modal) {
					left_modal = false;
				}
			});
			// erase
			key_pressed('B', input, function() {
				last.x = null;
				last.y = null;
				if(current_tab) {
					close_tab(current_tab);
					left_modal = true;
				}
				else if(current_modal) {
					toggle_modal(current_modal);
					left_modal = true;
				}
				else {
					left_modal = false;
				}
			});
			// sprint
			key_pressed('L2', input);
			// sneak
			key_pressed('R2', input);
			// clear
			key_pressed('Y', input, function() {
				toggle_modal(clear_modal);
			});
			// radius
			let y = -(input.axes['Right'].y / 2);
			if(y !== 0 && radius + y > 2 && radius + y < 50 + 1) {
				radius += y;
				scale_range.value = radius;
			}
			// lock y
			key_pressed('L3', input, function() {
				lock_y = !lock_y;
				lock_x = false;
			});
			// lock x
			key_pressed('R3', input, function() {
				lock_x = !lock_x;
				lock_y = false;
			});
			// color-wheel left
			key_pressed('L1', input, function() {
				if(index > 0) {
					index--;
					for(let i in colors) {
						if(COLOR_LENGTH > i) {
							colors[i].classList[i == index ? 'add' : 'remove']('active');
						}
					}
				}
			});
			// color-wheel right
			key_pressed('R1', input, function() {
				if(index < COLOR_LENGTH - 1) {
					index++;
					for(let i in colors) {
						if(COLOR_LENGTH > i) {
							colors[i].classList[i == index ? 'add' : 'remove']('active');
						}
					}
				}
			});
			key_pressed('Up', input, function() {
				if(arrow_y > 0) {
					arrow_y--;
				}
			});
			key_pressed('Down', input, function() {
				if(arrow_y < 10) {
					arrow_y++;
				}
			});
			key_pressed('Left', input, function() {
				if(arrow_x > 0) {
					arrow_x--;
				}
			});
			key_pressed('Right', input, function() {
				if(arrow_x < 4) {
					arrow_x++;
				}
			});
		}
	}
	else {
		if(devices.gamepad) {
			devices.gamepad = false;
			show_notification('notification.input-device.gamepad.remove');
		}
	}
	if(device !== 'gamepad') {
		let pos = arrow_y * 5 + arrow_x;
		if(modal_colors[pos].classList.contains('focus')) {
			modal_colors[pos].classList.remove('focus');
		}
	}
	// device mouse option
	let mouse_option = document.querySelector('.settings-modal .device-tab .item[data-device="mouse"]');
	if(devices.mouse && mouse_option.classList.contains('inactive')) {
		mouse_option.classList.remove('inactive');
		if(!device) {
			device = 'mouse';
			fallback_device = 'mouse';
			mouse_option.classList.add('active');
		}
	}
	// device touch option
	let touch_option = document.querySelector('.settings-modal .device-tab .item[data-device="touch"]');
	if(devices.touch && touch_option.classList.contains('inactive')) {
		touch_option.classList.remove('inactive');
		if(!device) {
			device = 'touch';
			fallback_device = 'touch';
			touch_option.classList.add('active');
		}
	}
	// device pen option
	let pen_option = document.querySelector('.settings-modal .device-tab .item[data-device="pen"]');
	if(devices.pen && pen_option.classList.contains('inactive')) {
		pen_option.classList.remove('inactive');
		if(!device) {
			device = 'pen';
			fallback_device = 'pen';
			pen_option.classList.add('active');
		}
	}
	// device gamepad option
	let gamepad_option = document.querySelector('.settings-modal .device-tab .item[data-device="gamepad"]');
	if(devices.gamepad && gamepad_option.classList.contains('inactive')) {
		gamepad_option.classList.remove('inactive');
		if(!device) {
			device = 'gamepad';
			fallback_device = 'gamepad';
			gamepad_option.classList.add('active');
		}
	}
	if(!devices.gamepad && !gamepad_option.classList.contains('inactive')) {
		gamepad_option.classList.add('inactive');
		gamepad_option.classList.remove('active');
		if(device === 'gamepad') {
			if(device !== fallback_device) {
				device = fallback_device;
				let option = document.querySelector(`.settings-modal .device-tab .item[data-device="${device}"]`);
				option.classList.add('active');
			}
			else {
				device = null;
			}
			point.x = null;
			point.y = null;
			last.x = null;
			last.y = null;
		}
	}
	// cursor visible
	canvas.style.cursor = device === 'mouse' ? 'none' : 'default';
	if(!current_modal && !left_modal) {
		// pencil
		if(draw && !erase) {
			if(point.x !== null && point.y !== null) {
				if(last.x !== null && last.y !== null) {
					draw_line(point, last, radius, COLOR[index]);
				}
			}
		}
		// eraser
		if(erase && !draw) {
			if(point.x !== null && point.y !== null) {
				if(last.x !== null && last.y !== null) {
					draw_line(point, last, radius, 'white');
				}
			}
		}
	}
	// at least one device
	let one_device = Object.values(devices).some(function(device) {
		return device;
	});
	if(one_device && !device_empty.classList.contains('hidden')) {
		device_empty.classList.add('hidden');
	}
	if(!one_device && device_empty.classList.contains('hidden')) {
		device_empty.classList.remove('hidden');
	}
	// navigate colors
	let pos = arrow_y * 5 + arrow_x;
	if(device === 'gamepad') {
		for(let [ i, item ] of Object.entries(modal_colors)) {
			item.classList[parseInt(i) == pos ? 'add' : 'remove']('focus');
		}
	}
	render();
	if(draw || erase) {
		last.x = point.x;
		last.y = point.y;
	}
	requestAnimationFrame(update);
}

function render() {
	if(radius < 2) {
		radius = 2;
	}
	o.clearRect(0, 0, window.innerWidth, window.innerHeight);
	if(point.x !== null && point.y !== null) {
		let touch_device = (device === 'touch' || device === 'pen');
		if(touch_device) {
			if(!left_modal) {
				o.fillStyle = 'white';
				o.beginPath();
				o.arc(point.x, point.y, parseInt(radius) + 2, 2 * Math.PI, 0);
				o.fill();
				o.fillStyle = COLOR[index];
				o.beginPath();
				o.arc(point.x, point.y, parseInt(radius), 2 * Math.PI, 0);
				o.fill();
			}
		}
		else {
			o.fillStyle = 'white';
			o.beginPath();
			o.arc(point.x, point.y, parseInt(radius) + 2, 2 * Math.PI, 0);
			o.fill();
			o.fillStyle = COLOR[index];
			o.beginPath();
			o.arc(point.x, point.y, parseInt(radius), 2 * Math.PI, 0);
			o.fill();
		}
	}
	if(!left_modal) {
		if(erase && !draw) {
			o.beginPath();
			o.lineWidth = 2;
			o.strokeStyle = 'white';
			o.moveTo(point.x, point.y - parseInt(radius) * 0.5);
			o.lineTo(point.x, point.y + parseInt(radius) * 0.5);
			o.moveTo(point.x - parseInt(radius) * 0.5, point.y);
			o.lineTo(point.x + parseInt(radius) * 0.5, point.y);
			o.stroke();
		}
	}
	if(lock_x || lock_y) {
		o.beginPath();
		o.lineWidth = 2;
		o.strokeStyle = 'white';
		if(lock_x) {
			o.moveTo(point.x, point.y - parseInt(radius));
			o.lineTo(point.x, point.y + parseInt(radius));
		}
		if(lock_y) {
			o.moveTo(point.x - parseInt(radius), point.y);
			o.lineTo(point.x + parseInt(radius), point.y);
		}
		o.stroke();
	}
}

function draw_line(point, last, radius, color) {
	if(last) {
		g.lineCap = 'round';
		g.strokeStyle = color;
		g.lineWidth = 2 * parseInt(radius);
		g.beginPath();
		g.moveTo(last.x + 0.5, last.y + 0.5);
		g.lineTo(point.x + 0.5, point.y + 0.5);
		g.stroke();
	}
	else {
		g.fillStyle = color;
		g.beginPath();
		g.arc(point.x, point.y, parseInt(radius), 2 * Math.PI, 0);
		g.fill();
	}
}

function change_device(element) {
	let value = element.dataset.device;
	if(devices[value]) {
		device = value;
		for(let item of device_options) {
			item.classList[element === item ? 'add' : 'remove']('active');
		}
		if(device !== 'gamepad') {
			point.x = null;
			point.y = null;
			last.x = null;
			last.y = null;
		}
	}
}

function change_language(element) {
	let code = element.dataset.code;
	lang = code;
	let items = document.querySelectorAll('[data-lang]');
	for(let item of items) {
		let prime = item.dataset.prime === 'true';
		let beta = item.dataset.beta === 'true';
		let type = item.dataset.type;
		let text = LANG[code][item.dataset.lang];
		let prime_content;
		let beta_content;
		if(prime) {
			 prime_content = item.querySelector('b.prime-badge').textContent;
		}
		if(beta) {
			beta_content = item.querySelector('b.beta-badge').textContent;
		}
		if(text) {
			if(type === 'tooltip') {
				item.dataset.title = text;
			}
			else {
				item.textContent = text;
			}
			if(prime && type !== 'tooltip') {
				item.innerHTML += `<b class="prime-badge">${prime_content}</b>`;
			}
			if(beta && type !== 'tooltip') {
				item.innerHTML += `<b class="beta-badge">${beta_content}</b>`;
			}
		}
	}
	let options = document.querySelectorAll('.language-tab .item');
	for(let option of options) {
		option.classList[option === element ? 'add' : 'remove']('active');
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
			for(let item of modals) {
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
				if(device === 'gamepad') {
					modal_colors[0].classList.add('focus');
					arrow_x = 0;
					arrow_y = 0;
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
	content.textContent = LANG[lang][message];
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
	g.clearRect(0, 0, canvas.width, canvas.height);
	show_notification('notification.clear');
	toggle_modal(clear_modal);
}
