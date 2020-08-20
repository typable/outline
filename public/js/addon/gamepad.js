const CONTROLLER_PATTERN = {
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

let gamepad;
let on_connect_callback;
let on_disconnect_callback;

/**
	Binds gamepad event handler.

	@function init
	@contructor
*/
function init() {
	window.addEventListener('gamepadconnected', function(event) {
		gamepad = event.gamepad;
		if(gamepad.vibrationActuator) {
			gamepad.vibrationActuator.playEffect('dual-rumble', {
				startDelay: 0,
				duration: 100,
				weakMagnitude: 1.0,
				strongMagnitude: 1.0
			});
		}
		if(on_connect_callback) {
			on_connect_callback(gamepad);
		}
	});
	window.addEventListener('gamepaddisconnected', function() {
		gamepad = null;
		if(on_disconnect_callback) {
			on_disconnect_callback(gamepad);
		}
	});
}

/**
	Return controller formatted input.

	@function get
	@return {Object} The formatted input object.
*/
function get() {
	let result = {
		button: {},
		axes: {}
	};
	for(let [ id, key ] of Object.entries(CONTROLLER_PATTERN)) {
		if(gamepad.buttons[id]) {
			result.button[key] = gamepad.buttons[id];
		}
	}
	result.axes['Left'] = {
		x: gamepad.axes[0],
		y: gamepad.axes[1]
	};
	result.axes['Right'] = {
		x: gamepad.axes[2],
		y: gamepad.axes[3]
	};
	return result;
}

function on_connect(callback) {
	on_connect_callback = callback;
}

function on_disconnect(callback) {
	on_disconnect_callback = callback;
}

/**
	The callback gets called if a gamepad button was pressed.

	@function on_pressed
	@param {string} key - The input key.
	@callback callback
*/
function on_pressed(key, callback) {
	/*
	if(input.button[key]) {
		if(!pressed[key]) {
			pressed[key] = true;
			if(callback) {
				callback();
			}
		}
	}
	else {
		pressed[key] = false;
	}
	*/
}

export default {
	init,
	get,
	on_connect,
	on_disconnect,
	on_pressed
};

// !!! TODO !!!
/*
gamepad.init();
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
*/

// !!! TODO !!!
/*
// cursor visible
canvas.style.cursor = device === 'mouse' ? 'none' : 'default';
if(device !== 'gamepad') {
	let pos = arrow_y * 5 + arrow_x;
	if(modal_colors[pos].classList.contains('focus')) {
		modal_colors[pos].classList.remove('focus');
	}
}
// navigate colors
if(device === 'gamepad') {
	let pos = arrow_y * 5 + arrow_x;
	for(let [ i, item ] of Object.entries(modal_colors)) {
		item.classList[parseInt(i) == pos ? 'add' : 'remove']('focus');
	}
}
*/

// !!! TODO !!!
/*
let gamepad = navigator.getGamepads()[0];
if(gamepad) {
	if(device === 'gamepad') {
		if(point.x == null && point.y == null) {
			point.x = parseInt(window.innerWidth / 2);
			point.y = parseInt(window.innerHeight / 2);
		}
		let speed = 4;
		if(pressed['L2'] && !pressed['R2']) {
			speed = 10;
		}
		if(pressed['R2'] && !pressed['L2']) {
			speed = 1;
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
*/
