import { COLORS } from '../constant.js';

let active;
let point_list = [];

let canvas;
let overlay;
let memory;

function init() {
	canvas = document.querySelector('#canvas');
	overlay = document.querySelector('#overlay');
	memory = document.createElement('canvas');
	fit(canvas);
	fit(overlay);
	fit(memory);
	window.addEventListener('resize', function(event) {
		resize(canvas);
		resize(overlay);
		resize(memory);
	});
}

function fit(canvas) {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

function get(canvas) {
	return canvas.getContext('2d');
}

function get_canvas() {
	return canvas;
}

function resize(canvas) {
	let g = get(canvas);
	let image_data = g.getImageData(0, 0, canvas.width, canvas.height);
	fit(canvas);
	g.putImageData(image_data, 0, 0);
}

function clear() {
	get(canvas).clearRect(0, 0, canvas.width, canvas.height);
	get(memory).clearRect(0, 0, memory.width, memory.height);
}

function on_press(event) {
	active = true;
	point_list.push({
		x: event.layerX,
		y: event.layerY
	});
}

function on_move(event, state) {
	if(active) {
		get(canvas).clearRect(0, 0, canvas.width, canvas.height);
		get(canvas).drawImage(memory, 0, 0);
		point_list.push({
			x: event.layerX,
			y: event.layerY
		});
		draw_curve(state);
	}
}

function on_release(event) {
	if(active) {
		if(event.type === 'pointerup') {
			active = false;
		}
		get(memory).clearRect(0, 0, memory.width, memory.height);
		get(memory).drawImage(canvas, 0, 0);
		point_list = [];
	}
}

function draw_curve(state) {
	let g = get(canvas);
	g.lineJoin = 'round';
	g.lineCap = 'round';
	g.lineWidth = 2 * state.radius;
	g.strokeStyle = COLORS[state.color] + 'BB';
	if(point_list.length < 3) {
		return;
	}
	if(point_list.length < 3) {
		g.beginPath();
		g.arc(point_list[0].x + 0.5, point_list[0].y + 0.5, g.lineWidth / 2, 0, Math.PI * 2, !0);
		g.closePath();
		g.fill();
		return;
	}
	g.beginPath();
	g.moveTo(point_list[0].x + 0.5, point_list[0].y + 0.5);
	let i;
	for(i = 1; i < point_list.length - 2; i++) {
		let dx = (point_list[i].x + point_list[i + 1].x);
		let dy = (point_list[i].y + point_list[i + 1].y);
		g.quadraticCurveTo(point_list[i].x + 0.5, point_list[i].y + 0.5, (dx / 2) + 0.5, (dy / 2) + 0.5);
	}
	g.quadraticCurveTo(point_list[i].x + 0.5, point_list[i].y + 0.5, point_list[i + 1].x + 0.5, point_list[i + 1].y + 0.5);
	g.stroke();
}

export default {
	init,
	fit,
	get,
	get_canvas,
	resize,
	clear,
	on_press,
	on_move,
	on_release,
	draw_curve
};
