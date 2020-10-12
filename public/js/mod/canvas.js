const DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1;
const MAX_HISTORY_STEP = 10;

import { COLORS } from '../constant.js';

let active;
let point_list = [];
let width;
let height;
let size;
let last;
let ratio;
let backing_store_ratio;

let canvas;
let overlay;
let memory;
let temporary;
let g;
let o;
let m;
let t;

function init() {
	width = window.innerWidth;
	height = window.innerHeight;
	canvas = document.querySelector('#canvas');
	overlay = document.querySelector('#overlay');
	memory = document.createElement('canvas');
	temporary = document.createElement('canvas');
	g = canvas.getContext('2d');
	o = overlay.getContext('2d');
	m = memory.getContext('2d');
	t = temporary.getContext('2d');
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
		last = size;
		size = max;
	}
	else {
		last = null;
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
	scale_canvas(buffer, b, last || size);
	b.imageSmoothingEnabled = false;
	b.clearRect(0, 0, size, size);
	b.drawImage(canvas, 0, 0, last || size, last || size);
	scale_canvas(canvas, g, size);
	g.imageSmoothingEnabled = false;
	g.drawImage(buffer, 0, 0, last || size, last || size);
	scale_canvas(overlay, o, size);
	o.imageSmoothingEnabled = false;
	scale_canvas(memory, m, size);
	m.imageSmoothingEnabled = false;
	m.drawImage(canvas, 0, 0, last || size, last || size);
	b.clearRect(0, 0, size, size);
	b.drawImage(temporary, 0, 0, last || size, last || size);
	scale_canvas(temporary, t, size);
	t.imageSmoothingEnabled = false;
	t.drawImage(buffer, 0, 0, last || size, last || size);
}

function scale_canvas(canvas, g, size, height) {
	if(DEVICE_PIXEL_RATIO !== backing_store_ratio) {
		canvas.width = size * ratio;
		canvas.height = (height || size) * ratio;
		canvas.style.width = size + 'px';
		canvas.style.height = (height || size) + 'px';
	}
	else {
		canvas.width = size;
		canvas.height = height || size;
		canvas.style.width = '';
		canvas.style.height = '';
	}
	g.scale(ratio, ratio);
}

function clear(state) {
	g.clearRect(0, 0, size, size);
	m.clearRect(0, 0, size, size);
	t.clearRect(0, 0, size, size);
	state.history = [];
	state.redo_history = [];
}

function on_press(event, state) {
	point_list.push({
		x: event.layerX,
		y: event.layerY
	});
	active = true;
	state.redo_history = [];
	draw_curve(g, state, point_list);
}

function on_move(event, state) {
	if(active) {
		g.clearRect(0, 0, size, size);
		g.drawImage(memory, 0, 0, size, size);
		point_list.push({
			x: event.layerX,
			y: event.layerY
		});
		draw_curve(g, state, point_list);
	}
}

function on_release(event, state, undrag) {
	if(active) {
		if((event && event.type === 'pointerup') || undrag) {
			active = false;
		}
		if(point_list.length > 0) {
			let { color, radius, pencil } = state;
			state.history.push({
				list: point_list,
				state: {
					color,
					radius,
					pencil
				}
			});
			if(state.history.length > MAX_HISTORY_STEP) {
				let line = state.history.shift();
				draw_curve(t, line.state, line.list);
			}
		}
		m.clearRect(0, 0, size, size);
		m.drawImage(canvas, 0, 0, size, size);
		point_list = [];
	}
}

function undo(state) {
	if(state.history.length > 0) {
		state.redo_history.push(state.history.pop());
		g.clearRect(0, 0, size, size);
		m.clearRect(0, 0, size, size);
		g.drawImage(temporary, 0, 0, size, size);
		m.drawImage(temporary, 0, 0, size, size);
		for(let line of  state.history) {
			draw_curve(g, line.state, line.list);
			draw_curve(m, line.state, line.list);
		}
	}
}

function redo(state) {
	if(state.redo_history.length > 0) {
		let line = state.redo_history.pop();
		state.history.push(line);
		draw_curve(g, line.state, line.list);
		draw_curve(m, line.state, line.list);
	}
}

function draw_curve(g, state, point_list) {
	if(state.pencil === 'pen') {
		g.strokeStyle = COLORS[state.color];
		g.fillStyle = COLORS[state.color];
	}
	if(state.pencil === 'marker') {
		g.strokeStyle = COLORS[state.color] + '88';
		g.fillStyle = COLORS[state.color] + '88';
	}
	if(state.pencil === 'eraser') {
		g.strokeStyle = 'white';
		g.fillStyle = 'white';
	}
	g.lineCap = 'round';
	g.lineJoin = 'round';
	g.lineWidth = 2 * state.radius;
	if(point_list.length < 3) {
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

function draw_crop(state) {
	o.clearRect(0, 0, size, size);
	if(state.option.crop_mode) {
		o.fillStyle = 'rgba(0, 0, 0, 0.3)';
		o.beginPath();
		o.rect(0, 0, size, size);
		o.fill();
		if(state.region && state.region.length == 2) {
			let [ begin, end ] = state.region;
			if(begin && end) {
				let delta = {
					x: end.x - begin.x,
					y: end.y - begin.y
				};
				if(delta.x != 0 && delta.y != 0) {
					o.clearRect(begin.x, begin.y, delta.x, delta.y);
					o.strokeStyle = 'white';
					o.beginPath();
					o.rect(begin.x, begin.y, delta.x, delta.y);
					o.stroke();
				}
			}
		}
	}
}

function clear_cursor() {
	o.clearRect(0, 0, size, size);
}

function set_data(data) {
	let image = new Image();
	image.onload = function() {
		g.drawImage(image, 0, 0);
		m.drawImage(image, 0, 0);
		t.drawImage(image, 0, 0);
	}
	image.src = data;
}

function get_data() {
	return canvas.toDataURL();
}

function create_capture(x, y, width, height, offset) {
	if(!offset) {
		offset = 0;
	}
	let cache = document.createElement('canvas');
	let c = cache.getContext('2d');
	scale_canvas(cache, c, width * ratio, (height - offset) * ratio);
	c.translate(-x * ratio, -(y * ratio + offset));
	c.fillStyle = 'white';
	c.fillRect(0, 0, window.innerWidth * ratio, window.innerHeight * ratio);
	c.drawImage(canvas, 0, 0 - offset);
	let data = cache.toDataURL() || null;
	cache.remove();
	return data;
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
	undo,
	redo,
	draw_curve,
	draw_cursor,
	draw_crop,
	clear_cursor,
	set_data,
	get_data,
	create_capture
};
