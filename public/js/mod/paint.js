function use(name, obj) {
	if(typeof module === 'object' && module && typeof module.exports === 'object') {
		module.exports = obj;
	}
	else {
		window[name] = obj;
	}
}

use('paint', {
	init: function(g, o) {
		this.g = g;
		this.o = o;
	},
	draw: function(args) {
		let { pos, last, radius, color } = args || {};
		if(radius < 1) {
			radius = 1;
		}
		if(radius > 15) {
			radius = 15;
		}
		if(last) {
			let delta = {
				x: last.x - pos.x,
				y: last.y - pos.y
			};
			let dist = Math.sqrt(Math.pow(delta.x, 2) + Math.pow(delta.y, 2), 2);
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
	}
});
