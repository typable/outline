// define
let canvas;
let g;
let drag;
let last;
let radius = 3;
let socket;
let color = 'black';
let ip = location.host; // '127.0.0.1';

const Player = {
	name: null,
	ip: null
};

const Channel = {
	name: null
};

let buckets = [
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
];

// onload
window.onload = e => {
	// init
	canvas = document.querySelector('#canvas');
	canvas.draggable = true;
	g = canvas.getContext('2d');
	// events
	canvas.ondragstart = e => false;
	canvas.oncontextmenu = e => false;
	canvas.onmousedown = e => {
		drag = true;
		let pos = { x: e.layerX, y: e.layerY };
		send({ pos: pos, last: last });
		draw(pos, last, radius, color);
		last = pos;
	};
	document.onmouseup = e => {
		drag = false;
		last = null;
	};
	canvas.onmousemove = e => {
		if(drag) {
			let pos = { x: e.layerX, y: e.layerY };
			send({ pos: pos, last: last });
			draw(pos, last, radius, color);
			last = pos;
		}
	};
	document.onwheel = e => {
		if(e.deltaY < 0) {
			radius += radius < 30 ? 0.5 : 0;
		}
		else {
			radius -= radius > 0.5 ? 0.5 : 0;
		}
	};
	document.onkeydown = e => {
		if(e.keyCode == 9) {
			// HUD fade in
		}
		if(e.keyCode >= 48 && e.keyCode <= 57) {
			let index = e.keyCode - 49;
			if(index == -1) {
				index = 9;
			}
			Array.from(document.querySelectorAll('.bucket')).forEach((bucket, i) => {
				if(index == i) {
					color = bucket.style.background;
					Array.from(document.querySelectorAll('.bucket')).forEach(b => {
						if(b != bucket) {
							b.classList.remove('focused');
						}
					});
					bucket.classList.add('focused');
				}
			});
		}
	};
	document.onkeyup = e => {
		if(e.keyCode == 9) {
			// HUD fade out
		}
	};
	window.onresize = e => resize();
	// ready
	resize();
	connect();

	buckets.forEach(bucket => {
		let tag = document.createElement('div');
		tag.classList.add('bucket');
		tag.classList.add('tooltip');
		tag.classList.add('up');
		tag.setAttribute('data-title', bucket.name);
		tag.style.background = bucket.code;
		if(bucket.active) {
			tag.classList.add('focused');
		}
		tag.addEventListener('click', e => {
			color = tag.style.background;
			Array.from(document.querySelectorAll('.bucket')).forEach(b => {
				if(b != bucket) {
					b.classList.remove('focused');
				}
			});
			tag.classList.add('focused');
		});
		document.querySelector('.toolbar').append(tag);
	});

	document.querySelector('#clear').addEventListener('click', e => {
		socket.emit('clear');
		g.clearRect(0, 0, window.innerWidth, window.innerHeight);
	});

	document.querySelector('#background').addEventListener('click', e => {
		socket.emit('background', color);
		g.fillStyle = color;
		g.fillRect(0, 0, window.innerWidth, window.innerHeight);
		g.fillStyle = 'black';
	});
};

// functions
let resize = () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
};
let connect = () => {
	socket = io('http://' + ip, {
		path: '/pipe'
	});
	socket.on('data', snap => {
		draw(snap.pos, snap.last, snap.rad, snap.clr);
	});
	socket.on('clear', snap => {
		g.clearRect(0, 0, window.innerWidth, window.innerHeight);
	});
	socket.on('background', snap => {
		g.fillStyle = snap;
		g.fillRect(0, 0, window.innerWidth, window.innerHeight);
		g.fillStyle = 'black';
	});
};
let send = ({ pos, last }) => {
	if(socket) {
		socket.emit('data', {
			pos: pos,
			last: last,
			rad: radius,
			clr: color
		});
	}
};
let draw = (pos, last, rad, clr) => {
	if(last) {
		let diff = {
			x: last.x - pos.x,
			y: last.y - pos.y
		};
		let dist = Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2), 2);
		let length = dist / (rad / 2);
		for(let i = 0; i < length; i++) {
			let x = pos.x + (diff.x / length * i);
			let y = pos.y + (diff.y / length * i);
			g.fillStyle = clr;
			g.beginPath();
			g.arc(x, y, 2 * rad, 0, 2 * Math.PI);
			g.fill();
			g.fillStyle = 'black';
		}
	}
	else {
		g.fillStyle = clr;
		g.beginPath();
		g.arc(pos.x, pos.y, 2 * rad, 0, 2 * Math.PI);
		g.fill();
		g.fillStyle = 'black';
	}
};
