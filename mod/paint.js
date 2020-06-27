module.exports = {
	init: function(g, o) {
		this.g = g;
		this.o = o;
	},
	draw: function(args) {
		let { pos, last, radius, color } = args || {};
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
};
