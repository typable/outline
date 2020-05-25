import util from './mod/util.js';
import modal from './mod/modal.js';

let env = {
	drag: false,
	last: null,
	color: '#000000',
	radius: 3,
	bucket: [
		{ name: 'Black', code: '#000000', active: true },
		{ name: 'White', code: '#FFFFFF' },
		{ name: 'Grey', code: '#808080' },
		{ name: 'Red', code: '#FF0000' },
		{ name: 'Blue', code: '#0000FF' },
		{ name: 'Green', code: '#00FF00' },
		{ name: 'Yellow', code: '#FFFF00' }
	],
	colorlist: [
		{ name: 'Salmon', code: '#FA8072' },
		{ name: 'Crimson', code: '#DC143C' },
		{ name: 'Firebrick', code: '#B22222' },
		{ name: 'Pink', code: '#FFC0CB' },
		{ name: 'Hotpink', code: '#FF69B4' },
		{ name: 'Coral', code: '#FF7F50' },
		{ name: 'Tomato', code: '#FF6347' },
		{ name: 'Orange', code: '#FFA500' },
		{ name: 'Gold', code: '#FFD700' },
		{ name: 'Khaki', code: '#F0E68C' },
		{ name: 'Lavender', code: '#E6E6FA' },
		{ name: 'Plum', code: '#DDA0DD' },
		{ name: 'Violet', code: '#EE82EE' },
		{ name: 'Magenta', code: '#FF00FF' },
		{ name: 'Purple', code: '#800080' },
		{ name: 'Indigo', code: '#4B0082' },
		{ name: 'Lime', code: '#00FF00' },
		{ name: 'Olive', code: '#808000' },
		{ name: 'Teal', code: '#008080' },
		{ name: 'Cyan', code: '#00FFFF' },
		{ name: 'Aquamarine', code: '#7FFFD4' },
		{ name: 'Turquoise', code: '#40E0D0' },
		{ name: 'Navy', code: '#000080' },
		{ name: 'Bisque', code: '#FFE4C4' },
		{ name: 'Tan', code: '#D2B48C' },
		{ name: 'Peru', code: '#CD853F' },
		{ name: 'Chocolate', code: '#D2691E' },
		{ name: 'Sienna', code: '#A0522D' },
		{ name: 'Brown', code: '#A52A2A' },
		{ name: 'Silver', code: '#C0C0C0' }
	],
	socket: null,
	cursor: { x: 0, y: 0 },
	client: {},
	uuid: null,
	name: null
};

let canvas;
let overlay
let g;
let o;
let delay;

window.addEventListener('load', function(event) {

	canvas = document.querySelector('.canvas');
	canvas.draggable = true;
	overlay = document.querySelector('.overlay');

	g = canvas.getContext('2d');
	o = overlay.getContext('2d');

	paint.init(g);
	modal.init();

	modal.open('join');
	modal.get('join').action.uuid.element.focus();

	document.querySelector('.action-uuid').addEventListener('keydown', function(event) {
		if(event.keyCode === 13) {
			env.name = document.querySelector('.action-uuid').value.replace(/\s+/g, '');
			if(env.name.length >= 3 && env.name.length <= 20) {
				env.uuid = env.name + '-' + util.uuid();
				modal.close();
				connect();
				sendCursor();
			}
		}
	});

	env.bucket.forEach(function(item) {
		let template = document.createElement('template');
		template.innerHTML = `<div class="bucket tooltip up${item.active ? ' focused' : ''}" data-title="${item.name}" data-color="${item.code}" style="background: ${item.code}"></div>`;
		document.querySelector('.toolbar').append(template.content.cloneNode(true));
	});

	env.colorlist.forEach(function(item) {
		let template = document.createElement('template');
		template.innerHTML = `<li class="bucket tooltip" data-title="${item.name}" data-color="${item.code}" style="background: ${item.code}"></li>`;
		document.querySelector('.modal.modal-color ul.bucket-list').append(template.content.cloneNode(true));
	});

	canvas.addEventListener('dragstart', function(event) {
		event.preventDefault();
	});
	canvas.addEventListener('contextmenu', function(event) {
		event.preventDefault();
	});
	canvas.addEventListener('mousemove', function(event) {
		if(env.drag) {
			let pos = { x: event.layerX, y: event.layerY };
			send({ pos: pos, last: env.last });
			paint.draw(Object.assign({ pos: pos }, env));
			env.last = pos;
		}
	});
	canvas.addEventListener('touchmove', function(event) {
		if(env.drag) {
			let pos = { x: event.touches[0].pageX, y: event.touches[0].pageY };
			send({ pos: pos, last: env.last });
			paint.draw(Object.assign({ pos: pos }, env));
			env.last = pos;
			event.preventDefault();
		}
	});
	canvas.addEventListener('mousedown', function(event) {
		env.drag = true;
		let pos = { x: event.layerX, y: event.layerY };
		send({ pos: pos, last: env.last });
		paint.draw(Object.assign({ pos: pos }, env));
		env.last = pos;
		document.querySelector('.toolbar').style.pointerEvents = 'none';
		sendCursor();
		update();
	});
	canvas.addEventListener('touchstart', function(event) {
		env.drag = true;
		let pos = { x: event.layerX, y: event.layerY };
		send({ pos: pos, last: env.last });
		paint.draw(Object.assign({ pos: pos }, env));
		env.last = pos;
		document.querySelector('.toolbar').style.pointerEvents = 'none';
		sendCursor();
		update();
	});

	document.querySelector('.action-join').addEventListener('click', function(event) {
		env.name = document.querySelector('.action-uuid').value.replace(/\s+/g, '');
		if(env.name.length >= 3 && env.name.length <= 20) {
			env.uuid = env.name + '-' + util.uuid();
			modal.close();
			connect();
			sendCursor();
		}
	});

	document.addEventListener('mouseup', function(event) {
		env.drag = false;
		env.last = null;
		document.querySelector('.toolbar').style.pointerEvents = '';
	});
	document.addEventListener('touchend', function(event) {
		document.querySelector('.toolbar').style.pointerEvents = '';
		env.drag = false;
		env.last = null;
	});
	document.addEventListener('wheel', function(event) {
		if(document.querySelector('.wrapper').style.display === 'none') {
			if(event.deltaY < 0) {
				env.radius += env.radius < 15 ? 1 : 0;
			}
			else {
				env.radius -= env.radius > 1 ? 1 : 0;
			}
			sendCursor();
			update();
		}
	});
	document.addEventListener('keydown', function(event) {
		if(!modal.opened) {
			if(event.keyCode >= 48 && event.keyCode <= 55) {
				let index = event.keyCode - 49;
				if(index == -1) {
					index = 9;
				}
				Array.from(document.querySelectorAll('.bucket'))
					.forEach(function(item, i) {
						if(index == i) {
							env.color = item.dataset.color;
							item.classList.add('focused');
						}
						else {
							item.classList.remove('focused');
						}
					});
			}
			sendCursor();
			update();
		}
	});
	document.addEventListener('mousemove', function(event) {
		env.cursor = event.target === canvas ? { x: event.layerX, y: event.layerY } : null;
		sendCursor();
		update();
	});
	document.addEventListener('touchmove', function(event) {
		env.cursor = event.target === canvas ? { x: event.layerX, y: event.layerY } : null;
		sendCursor();
		update();
	});
	document.addEventListener('mouseout', function(event) {
		env.cursor = null;
		sendCursor();
		update();
	});

	window.addEventListener('resize', function(event) {
		clearTimeout(delay);
  		delay = setTimeout(resize, 100);
	});

	Array.from(document.querySelectorAll('div.bucket'))
		.forEach(function(item) {
			item.addEventListener('mousedown', function(event) {
				env.color = item.dataset.color;
				Array.from(document.querySelectorAll('.bucket'))
					.forEach(function(_item) {
						if(_item != item) {
							_item.classList.remove('focused');
						}
					});
				item.classList.add('focused');
			});
		});

	document.querySelector('.actions button.action-clear')
		.addEventListener('click', function(event) {
			modal.open('clear');
		});

	document.querySelector('.actions button.action-background')
		.addEventListener('click', function(event) {
			modal.open('background');
		});

	document.querySelector('.actions button.action-save')
		.addEventListener('click', function(event) {
			document.querySelector('input.action-file').value = `outline-image-${util.uuid()}`;
			modal.open('save');
		});

	document.querySelector('.actions button.action-scaling')
		.addEventListener('click', function(event) {
			document.querySelector('.modal input.action-range').value = env.radius;
			let circle = document.querySelector('.modal .circle');
			circle.style.width = env.radius * 4 + 'px';
			circle.style.height = env.radius * 4 + 'px';
			modal.open('scaling');
		});

	document.querySelector('.actions button.action-color')
		.addEventListener('click', function(event) {
			Array.from(document.querySelectorAll('.modal ul.bucket-list li.bucket'))
				.forEach(function(item) {
					if(item.dataset.color === env.color) {
						item.classList.add('focused');
					}
				});
			modal.open('color');
		});

	document.querySelector('.modal button.action-clear')
		.addEventListener('click', function(event) {
			env.socket.emit('clear');
			g.clearRect(0, 0, window.innerWidth, window.innerHeight);
			modal.close();
		});

	document.querySelector('.modal button.action-background')
		.addEventListener('click', function(event) {
			env.socket.emit('background', env.color);
			g.fillStyle = env.color;
			g.fillRect(0, 0, window.innerWidth, window.innerHeight);
			g.fillStyle = 'black';
			modal.close();
		});

	document.querySelector('.modal button.action-save')
		.addEventListener('click', function(event) {
			let file = document.querySelector('.modal input.action-file').value.replace(/\s+/g, '');
			if(file.length >= 3 && file.length <= 40) {
				let link = document.createElement('a');
				link.style.display = 'none';
				link.download = file;
				link.href = canvas.toDataURL('image/jpg');
				document.body.appendChild(link);
				link.click();
				modal.close();
			}
		});

	document.querySelector('.modal input.action-range')
		.addEventListener('input', function(event) {
			setTimeout(function() {
				let circle = document.querySelector('.modal .circle');
				circle.style.width = event.target.value * 4 + 'px';
				circle.style.height = event.target.value * 4 + 'px';
			}, 10);
		});

	document.querySelector('.modal button.action-scaling')
		.addEventListener('click', function(event) {
			env.radius = parseInt(document.querySelector('.modal input.action-range').value);
			sendCursor();
			update();
			modal.close();
		});

	Array.from(document.querySelectorAll('.modal ul.bucket-list li.bucket'))
		.forEach(function(item) {
			item.addEventListener('click', function(event) {
				Array.from(document.querySelectorAll('.modal ul.bucket-list li.bucket'))
					.forEach(function(_item) {
						if(_item != item) {
							_item.classList.remove('focused');
						}
					});
				item.classList.add('focused');
				env.color = item.dataset.color;
				Array.from(document.querySelectorAll('.bucket'))
					.forEach(function(item) {
						item.classList.remove('focused');
					});
				modal.close();
			});
		});

	resize();
	g.fillStyle = 'white';
	g.fillRect(0, 0, canvas.width, canvas.height);
});

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	let temp = o.getImageData(0, 0, overlay.width, overlay.height);
	overlay.width = window.innerWidth;
	overlay.height = window.innerHeight;
	o.putImageData(temp, 0, 0);
	if(env.socket) {
		env.socket.emit('request', {
			x: 0,
			y: 0,
			width: canvas.width,
			height: canvas.height
		});
	}
}

function connect() {
	env.socket = io('http://' + window.location.host, {
		path: '/pipe'
	});
	env.socket.emit('request', {
		x: 0,
		y: 0,
		width: canvas.width,
		height: canvas.height
	});
	env.socket.on('load', function(data) {
		let buffer = new Uint8Array(data);
		let image = g.getImageData(0, 0, canvas.width, canvas.height);
		let array = image.data;
		for(let i = 0; i < buffer.length; i++) {
			array[i] = buffer[i];
		}
		g.putImageData(image, 0, 0);
	});
	env.socket.on('data', function(data) {
		paint.draw(data.pos, data.last, data.radius, data.color);
	});
	env.socket.on('clear', function(data) {
		g.clearRect(0, 0, window.innerWidth, window.innerHeight);
	});
	env.socket.on('background', function(data) {
		g.fillStyle = data;
		g.fillRect(0, 0, window.innerWidth, window.innerHeight);
		g.fillStyle = 'black';
	});
	env.socket.on('cursor', function(data) {
		if(data.quit) {
			delete env.client[data.uuid];
		}
		else {
			env.client[data.uuid] = data;
			setTimeout(function() {
				if(env.client[data.uuid]) {
					let last = env.client[data.uuid];
					if(last.cursor && data.cursor) {
						if(last.cursor.x === data.cursor.x && last.cursor.y === data.cursor.y) {
							delete env.client[data.uuid];
							update();
						}
					}
				}
			}, 10 * 1000);
		}
		update();
	});
}

function send({ pos, last }) {
	if(env.socket) {
		env.socket.emit('data', {
			pos: pos,
			last: last,
			radius: env.radius,
			color: env.color
		});
	}
}

function sendCursor() {
	if(env.socket) {
		env.socket.emit('cursor', {
			cursor: env.cursor,
			color: env.color,
			radius: env.radius,
			name: env.name
		});
	}
}

function update() {
	if(env.radius < 1) {
		env.radius = 1;
	}
	if(env.radius > 15) {
		env.radius = 15;
	}
	o.clearRect(0, 0, window.innerWidth, window.innerHeight);
	if(env.cursor) {
		o.fillStyle = env.color;
		o.lineWidth = 4;
		o.beginPath();
		o.arc(env.cursor.x, env.cursor.y, 2 * env.radius, 0, 2 * Math.PI);
		o.strokeStyle = util.luma(env.color) ? 'black' : 'white';
		o.stroke();
		o.beginPath();
		o.arc(env.cursor.x, env.cursor.y, 2 * env.radius, 0, 2 * Math.PI);
		o.fill();
	}
	for(let key of Object.keys(env.client)) {
		let client = env.client[key];
		if(client.cursor) {
			o.fillStyle = client.color;
			o.lineWidth = 4;
			o.beginPath();
			o.arc(client.cursor.x, client.cursor.y, 2 * client.radius, 0, 2 * Math.PI);
			o.strokeStyle = util.luma(client.color) ? 'black' : 'white';
			o.stroke();
			o.beginPath();
			o.arc(client.cursor.x, client.cursor.y, 2 * client.radius, 0, 2 * Math.PI);
			o.fill();
			o.fillStyle = '#212121';
			o.font = '14px Roboto';
			o.textBaseline = 'top';
			o.textAlign = 'left';
			let text = o.measureText(client.name);
			paint.roundRect(client.cursor.x, client.cursor.y, text.width + 12, 22, 4);
			o.fill();
			o.fillStyle = 'white';
			o.fillText(client.name, client.cursor.x + 6, client.cursor.y + 5);
		}
	}
}
