let env = {
	drag: false,
	last: null,
	color: 'black',
	radius: 3,
	bucket: [
		{ name: 'Black', code: '#000000', active: true },
		{ name: 'White', code: '#FFFFFF' },
		{ name: 'Red', code: '#FF0000' },
		{ name: 'Blue', code: '#0000FF' },
		{ name: 'Green', code: '#00FF00' },
		{ name: 'Yellow', code: '#FFFF00' },
		{ name: 'Brown', code: '#A52A2A' },
		{ name: 'Grey', code: '#808080' },
		{ name: 'Purple', code: '#800080' },
		{ name: 'Bisque', code: '#FFE4C4' }
	],
	socket: null,
	cursor: { x: 0, y: 0 },
	client: {},
	uuid: window.location.search.substr(6)
};

let canvas;
let overlay
let g;
let o;

window.addEventListener('load', function(event) {

	console.log(env.uuid);

	canvas = document.querySelector('.canvas');
	canvas.draggable = true;
	overlay = document.querySelector('.overlay');

	g = canvas.getContext('2d');
	o = overlay.getContext('2d');

	env.bucket.forEach(function(item) {
		let template = document.createElement('template');
		template.innerHTML = `<div class="bucket tooltip up${item.active ? ' focused' : ''}" data-title="${item.name}" style="background: ${item.code}"></div>`;
		document.querySelector('.toolbar').append(template.content.cloneNode(true));
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
			draw(pos, env.last, env.radius, env.color);
			env.last = pos;
		}
	});
	canvas.addEventListener('mousedown', function(event) {
		env.drag = true;
		let pos = { x: event.layerX, y: event.layerY };
		send({ pos: pos, last: env.last });
		draw(pos, env.last, env.radius, env.color);
		env.last = pos;
	});

	document.addEventListener('mouseup', function(event) {
		env.drag = false;
		env.last = null;
	});
	document.addEventListener('wheel', function(event) {
		if(event.deltaY < 0) {
			env.radius += env.radius < 30 ? 0.5 : 0;
		}
		else {
			env.radius -= env.radius > 0.5 ? 0.5 : 0;
		}
		sendCursor();
		update();
	});
	document.addEventListener('keydown', function(event) {
		if(event.keyCode >= 48 && event.keyCode <= 57) {
			let index = event.keyCode - 49;
			if(index == -1) {
				index = 9;
			}
			Array.from(document.querySelectorAll('.bucket'))
				.forEach(function(item, i) {
					if(index == i) {
						env.color = item.style.background;
						item.classList.add('focused');
					}
					else {
						item.classList.remove('focused');
					}
				});
		}
		sendCursor();
		update();
	});
	document.addEventListener('mousemove', function(event) {
		env.cursor = event.target === canvas ? { x: event.layerX, y: event.layerY } : null;
		sendCursor();
		update();
	});
	document.addEventListener('mouseout', function(event) {
		env.cursor = null;
		sendCursor();
		update();
	});

	window.addEventListener('resize', resize);

	Array.from(document.querySelectorAll('div.bucket'))
		.forEach(function(item) {
			item.addEventListener('click', function(event) {
				env.color = item.style.background;
				Array.from(document.querySelectorAll('.bucket'))
					.forEach(function(_item) {
						if(_item != item) {
							_item.classList.remove('focused');
						}
					});
				item.classList.add('focused');
			});
		});

	document.querySelector('button.action-clear')
		.addEventListener('click', function(event) {
			env.socket.emit('clear');
			g.clearRect(0, 0, window.innerWidth, window.innerHeight);
		});

	document.querySelector('button.action-background')
		.addEventListener('click', function(event) {
			env.socket.emit('background', env.color);
			g.fillStyle = env.color;
			g.fillRect(0, 0, window.innerWidth, window.innerHeight);
			g.fillStyle = 'black';
		});

	resize();
	connect();
	sendCursor();
});

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	overlay.width = window.innerWidth;
	overlay.height = window.innerHeight;
}

function connect() {
	env.socket = io('http://' + window.location.host, {
		path: '/pipe'
	});
	env.socket.on('data', function(data) {
		draw(data.pos, data.last, data.radius, data.color);
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

function draw(pos, last, radius, color) {
	if(last) {
		let diff = {
			x: last.x - pos.x,
			y: last.y - pos.y
		};
		let dist = Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2), 2);
		let length = dist / (radius / 2);
		for(let i = 0; i < length; i++) {
			let x = pos.x + (diff.x / length * i);
			let y = pos.y + (diff.y / length * i);
			g.fillStyle = color;
			g.beginPath();
			g.arc(x, y, 2 * radius, 0, 2 * Math.PI);
			g.fill();
			g.fillStyle = 'black';
		}
	}
	else {
		g.fillStyle = color;
		g.beginPath();
		g.arc(pos.x, pos.y, 2 * radius, 0, 2 * Math.PI);
		g.fill();
		g.fillStyle = 'black';
	}
}

function sendCursor() {
	if(env.socket) {
		env.socket.emit('cursor', {
			cursor: env.cursor,
			color: env.color,
			radius: env.radius,
			uuid: env.uuid
		});
	}
}

function update() {
	o.clearRect(0, 0, window.innerWidth, window.innerHeight);
	if(env.cursor) {
		o.fillStyle = env.color;
		o.lineWidth = 4;
		o.beginPath();
		o.arc(env.cursor.x, env.cursor.y, 2 * env.radius, 0, 2 * Math.PI);
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
			o.stroke();
			o.beginPath();
			o.arc(client.cursor.x, client.cursor.y, 2 * client.radius, 0, 2 * Math.PI);
			o.fill();
			o.fillStyle = 'black';
			o.font = '14px Roboto';
			o.textBaseline = 'top';
			o.textAlign = 'left';
			let text = o.measureText(client.uuid);
			o.fillRect(client.cursor.x, client.cursor.y, text.width + 12, 24);
			o.fillStyle = 'white';
			o.fillText(client.uuid, client.cursor.x + 6, client.cursor.y + 5);
		}
	}
}

function dark(color) {
	let rgb = parseInt(color.substring(1));
	let r = (rgb >> 16) & 0xff;
	let g = (rgb >> 8) & 0xff;
	let b = (rgb >> 9) & 0xff;
	let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	return luma < 40;
}
