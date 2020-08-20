const DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1;

import { COLORS } from '../constant.js';

let active;
let point_list = [];
let width;
let height;
let size;
let ratio;
let backing_store_ratio;

let canvas;
let overlay;
let memory;
let g;
let o;
let m;

function init() {
	width = window.innerWidth;
	height = window.innerHeight;
	canvas = document.querySelector('#canvas');
	overlay = document.querySelector('#overlay');
	memory = document.createElement('canvas');
	g = canvas.getContext('2d');
	o = overlay.getContext('2d');
	m = memory.getContext('2d');
	resize();
	window.addEventListener('resize', resize);
}

function get_canvas() {
	return canvas;
}

function resize() {
	width = window.innerWidth;
	height = window.innerHeight;
	let max = width > height ? width : height;
	if(!size || max > size) {
		size = max;
	}
	backing_store_ratio = (
		g.webkitBackingStorePixelRatio ||
		g.mozBackingStorePixelRatio ||
		g.msBackingStorePixelRatio ||
		g.oBackingStorePixelRatio ||
		g.backingStorePixelRatio || 1
	)
	ratio = DEVICE_PIXEL_RATIO / backing_store_ratio;
	let buffer = document.createElement('canvas');
	let b = buffer.getContext('2d');
	scale_canvas(buffer, b);
	b.imageSmoothingEnabled = false;
	b.drawImage(canvas, 0, 0, size, size);
	scale_canvas(canvas, g);
	g.imageSmoothingEnabled = false;
	g.drawImage(buffer, 0, 0, size, size);
	scale_canvas(overlay, o);
	o.imageSmoothingEnabled = false;
	scale_canvas(memory, m);
	m.imageSmoothingEnabled = false;
	m.drawImage(canvas, 0, 0, size, size);
}

function scale_canvas(canvas, g) {
	if(DEVICE_PIXEL_RATIO !== backing_store_ratio) {
		canvas.width = size * ratio;
		canvas.height = size * ratio;
		canvas.style.width = size + 'px';
		canvas.style.height = size + 'px';
	}
	else {
		canvas.width = size;
		canvas.height = size;
		canvas.style.width = '';
		canvas.style.height = '';
	}
	g.scale(ratio, ratio);
}

function clear() {
	g.clearRect(0, 0, size, size);
	m.clearRect(0, 0, size, size);
}

function on_press(event, state) {
	point_list.push({
		x: event.layerX,
		y: event.layerY
	});
	active = true;
}

function on_move(event, state) {
	if(active) {
		g.clearRect(0, 0, size, size);
		g.drawImage(memory, 0, 0, size, size);
		point_list.push({
			x: event.layerX,
			y: event.layerY
		});
		draw_curve(state);
	}
}

function on_release(event) {
	if(active) {
		if(event && event.type === 'pointerup') {
			active = false;
		}
		m.clearRect(0, 0, size, size);
		m.drawImage(canvas, 0, 0, size, size);
		point_list = [];
	}
}

function draw_curve(state) {
	if(state.pencil === 'pen') {
		g.strokeStyle = COLORS[state.color];
	}
	if(state.pencil === 'marker') {
		g.strokeStyle = COLORS[state.color] + '88';
	}
	if(state.pencil === 'eraser') {
		g.strokeStyle = 'white';
	}
	g.lineCap = 'round';
	g.lineJoin = 'round';
	g.lineWidth = 2 * state.radius;
	if(point_list.length < 3) {
		g.fillStyle = COLORS[state.color];
		g.beginPath();
		g.arc(point_list[0].x, point_list[0].y, g.lineWidth / 2, 0, Math.PI * 2, !0);
		g.closePath();
		g.fill();
		return;
	}
	g.beginPath();
	g.moveTo(point_list[0].x, point_list[0].y);
	let i;
	for(i = 1; i < point_list.length - 2; i++) {
		let dx = (point_list[i].x + point_list[i + 1].x);
		let dy = (point_list[i].y + point_list[i + 1].y);
		g.quadraticCurveTo(point_list[i].x, point_list[i].y, parseInt(dx / 2), parseInt(dy / 2));
	}
	g.quadraticCurveTo(point_list[i].x, point_list[i].y, point_list[i + 1].x, point_list[i + 1].y);
	g.stroke();
}

function draw_cursor(state) {
	o.clearRect(0, 0, size, size);
	o.lineWidth = 2;
	if(state.point) {
		if(state.pencil === 'pen') {
			o.fillStyle = COLORS[state.color];
		}
		if(state.pencil === 'marker') {
			o.fillStyle = COLORS[state.color] + '88';
		}
		if(state.pencil === 'eraser') {
			o.fillStyle = COLORS[state.color] + '55';
		}
		o.beginPath();
		o.arc(state.point.x, state.point.y, 2 * state.radius / 2, 0, Math.PI * 2, !0);
		o.closePath();
		o.fill();
		o.strokeStyle = 'white';
		o.beginPath();
		o.arc(state.point.x, state.point.y, 2 * state.radius / 2, 0, Math.PI * 2, !0);
		o.closePath();
		o.stroke();
		if(state.pencil === 'eraser') {
			o.strokeStyle = 'white';
			o.beginPath();
			o.moveTo(state.point.x - state.radius * 0.5, state.point.y);
			o.lineTo(state.point.x + state.radius * 0.5, state.point.y);
			o.stroke();
			o.beginPath();
			o.moveTo(state.point.x, state.point.y - state.radius * 0.5);
			o.lineTo(state.point.x, state.point.y + state.radius * 0.5);
			o.stroke();
		}
	}
}

function clear_cursor() {
	o.clearRect(0, 0, size, size);
}

export default {
	init,
	get_canvas,
	resize,
	scale_canvas,
	clear,
	on_press,
	on_move,
	on_release,
	draw_curve,
	draw_cursor,
	clear_cursor
};
