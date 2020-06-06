export default {
	socket: null,
	connected: false,
	timeout: false,
	interval: null,
	init: function(app) {
		this.app = app;
	},
	connect: function() {
		let that = this;
		this.socket = io('https://server.typable.dev', {
			path: '/pipe',
			reconnection: false
		});
		this.socket.on('connect', function() {
			that.connected = true;
			that.timeout = false;
			that.request();
			that.cursor();
		});
		this.socket.on('disconnect', function() {
			that.connected = false;
			that.timeout = true;
			that.app.modal.open('error');
			that.app.state.client = [];
			that.app.update();
		});
		this.socket.on('connect_error', function() {
			that.connected = false;
			that.timeout = true;
			that.app.modal.open('error');
			that.app.state.client = [];
			that.app.update();
		});
		this.socket.on('load', function(data) {
			let buffer = new Uint8Array(data);
			let image = that.app.paint.g.getImageData(0, 0, that.app.node.canvas.width, that.app.node.canvas.height);
			let array = image.data;
			for(let i = 0; i < buffer.length / 4; i++) {
				let p = i * 4;
				let data = buffer.slice(i * 4, i * 4 + 4);
				if(data[3] === 0) {
					data = [255, 255, 255, 255];
				}
				array[p] = data[0];
				array[p + 1] = data[1];
				array[p + 2] = data[2];
				array[p + 3] = data[3];
			}
			that.app.paint.g.putImageData(image, 0, 0);
			that.app.modal.close();
		});
		this.socket.on('data', function(data) {
			that.app.paint.draw(data);
		});
		this.socket.on('clear', function(data) {
			that.app.paint.g.fillStyle = 'white';
			that.app.paint.g.fillRect(0, 0, window.innerWidth, window.innerHeight);
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
	reconnect: function() {
		this.socket.open();
		this.timeout = false;
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
		if(this.app.socket.connected) {
			this.app.modal.load();
		}
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
