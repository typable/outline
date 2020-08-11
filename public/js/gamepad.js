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

// Stores the pressed buttons
let pressed = {};

/**
	Converts controller input into readable input.

	@function read
	@param {Object} gamepad - The gamepad object.
	@return {Object} The formatted input object.
*/

function read(gamepad) {
	let result = {
		button: {},
		axes: {}
	};
	for(let [ id, key ] of Object.entries(CONTROLLER_PATTERN)) {
		if(gamepad.buttons[id]) {
			result.button[key] = gamepad.buttons[id].pressed;
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

/**
	The callback gets called if a gamepad button was pressed.

	@function key_pressed
	@param {string} key - The input key.
	@param {Object} input - The formatted input object.
	@callback callback
*/
function key_pressed(key, input, callback) {
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
}

export { read, key_pressed };
