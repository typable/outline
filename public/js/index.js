let env = {
	drag: false,
	last: null,
	color: 'black',
	radius: 3,
	bucket: [
		{ name: 'Black', code: 'black', active: true },
		{ name: 'White', code: 'white' },
		{ name: 'Red', code: 'red' },
		{ name: 'Blue', code: 'blue' },
		{ name: 'Green', code: 'green' },
		{ name: 'Yellow', code: 'yellow' },
		{ name: 'Brown', code: 'brown' },
		{ name: 'Grey', code: 'grey' },
		{ name: 'Purple', code: 'purple' },
		{ name: 'Bisque', code: 'bisque' }
	],
	socket: null
};

let canvas;
let g;

window.addEventListener('load', function(event) {

	canvas = document.querySelector('.canvas');
	canvas.draggable = true;

	g = canvas.getContext('2d');

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
});

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
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
