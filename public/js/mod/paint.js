import { luma } from './util.js';

export default {
	init: function(app) {
		this.app = app;
		this.g = this.app.node.canvas.getContext('2d');
		this.o = this.app.node.overlay.getContext('2d');
	},
	draw: function(args) {
		let { pos, last, radius, color } = args || {};
		if(pos) {
			if(last) {
				let delta = {
					x: last.x - pos.x,
					y: last.y - pos.y
				};
				let dist = Math.sqrt(Math.pow(delta.x, 2) + Math.pow(delta.y, 2));
				let length = dist / (radius / 2);
				for(let i = 0; i < length; i++) {
					let x = pos.x + (delta.x / length * i);
					let y = pos.y + (delta.y / length * i);
					this.g.fillStyle = color;
					this.g.beginPath();
					this.g.arc(x, y, 2 * radius, 0, 2 * Math.PI);
					this.g.fill();
					this.g.fillStyle = 'black';
				}
			}
			else {
				this.g.fillStyle = color;
				this.g.beginPath();
				this.g.arc(pos.x, pos.y, 2 * radius, 0, 2 * Math.PI);
				this.g.fill();
				this.g.fillStyle = 'black';
			}
		}
	},
	roundRect: function(x, y, w, h, r) {
		if(w < 2 * r) r = w / 2;
		if(h < 2 * r) r = h / 2;
		this.o.beginPath();
		this.o.moveTo(x + r, y);
		this.o.arcTo(x + w, y, x + w, y + h, r);
		this.o.arcTo(x + w, y + h, x, y + h, r);
		this.o.arcTo(x, y + h, x, y, r);
		this.o.arcTo(x, y, x + w, y, r);
	},
	cursor: function(state) {
		if(state.cursor) {
			this.o.fillStyle = state.color;
			this.o.lineWidth = 4;
			this.o.beginPath();
			this.o.arc(state.cursor.x, state.cursor.y, 2 * state.radius, 0, 2 * Math.PI);
			this.o.strokeStyle = luma(state.color) ? 'black' : 'white';
			this.o.stroke();
			this.o.beginPath();
			this.o.arc(state.cursor.x, state.cursor.y, 2 * state.radius, 0, 2 * Math.PI);
			this.o.fill();
			if(this.app.state !== state) {
				this.o.fillStyle = '#212121';
				this.o.font = '14px Roboto';
				this.o.textBaseline = 'top';
				this.o.textAlign = 'left';
				let text = this.o.measureText(state.name);
				this.roundRect(state.cursor.x, state.cursor.y, text.width + 12, 22, 4);
				this.o.fill();
				this.o.fillStyle = 'white';
				this.o.fillText(state.name, state.cursor.x + 6, state.cursor.y + 5);
			}
		}
	}
};
