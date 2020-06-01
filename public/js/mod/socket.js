export default {
	socket: null,
	connected: false,
	init: function(app) {
		this.app = app;
	},
	connect: function() {
		let that = this;
		this.socket = io(window.location.origin, {
			path: '/pipe'
		});
		this.socket.on('connect', function() {
			that.connected = true;
			that.request();
		});
		this.socket.on('disconnect', function() {
			that.connected = false;
		});
		this.socket.on('load', function(data) {
			let buffer = new Uint8Array(data);
			let image = that.app.paint.g.getImageData(0, 0, that.app.node.canvas.width, that.app.node.canvas.height);
			let array = image.data;
			for(let i = 0; i < buffer.length; i++) {
				array[i] = buffer[i];
			}
			that.app.paint.g.putImageData(image, 0, 0);
		});
		this.socket.on('data', function(data) {
			that.app.paint.draw(data);
		});
		this.socket.on('clear', function(data) {
			that.app.paint.g.clearRect(0, 0, window.innerWidth, window.innerHeight);
		});
		this.socket.on('background', function(data) {
			that.app.paint.g.fillStyle = data;
			that.app.paint.g.fillRect(0, 0, window.innerWidth, window.innerHeight);
			that.app.paint.g.fillStyle = 'black';
		});
		this.socket.on('cursor', function(data) {
			if(data.quit) {
				delete that.app.state.client[data.uuid];
			}
			else {
				that.app.state.client[data.uuid] = data;
			}
			that.app.update();
		});
	},
	_send: function(key, data) {
		if(this.socket) {
			this.socket.emit(key, data);
		}
	},
	data: function({ pos, last }) {
		this._send('data', {
			pos: pos,
			last: last,
			radius: this.app.state.radius,
			color: this.app.state.color
		});
	},
	cursor: function() {
		this._send('cursor', {
			cursor: this.app.state.cursor,
			color: this.app.state.color,
			radius: this.app.state.radius,
			name: this.app.state.name,
			uuid: this.app.state.uuid
		});
	},
	request: function() {
		this._send('request', {
			x: 0,
			y: 0,
			width: window.innerWidth,
			height: window.innerHeight
		});
	},
	clear: function() {
		this._send('clear');
	}
}
