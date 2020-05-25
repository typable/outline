const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { createCanvas } = require('canvas');

let port = 80;
let client = {};

let width = 1920;
let height = 1080;
let canvas = createCanvas(width, height);
let g = canvas.getContext('2d');
g.fillStyle = 'white';
g.fillRect(0, 0, width, height);

app.use(express.static(__dirname + '/public'));

const proxy = http.listen(port, function() {
	console.log('Server started on port: ' + port);
});

io.path('/pipe');
io.listen(proxy);

io.on('connection', function(socket) {
	client[socket] = {};
	socket.on('request', function(data) {
		let { x, y, width, height } = data;
		let image = g.getImageData(x, y, width, height);
		socket.emit('load', new Uint8Array(image.data).buffer);
	});
	socket.on('data' , function(data) {
		draw(data.pos, data.last, data.radius, data.color);
		socket.broadcast.emit('data', data);
	});
	socket.on('clear' , function(data) {
		g.clearRect(0, 0, width, height);
		socket.broadcast.emit('clear', data);
	});
	socket.on('background' , function(data) {
		g.fillStyle = data;
		g.fillRect(0, 0, width, height);
		g.fillStyle = 'black';
		socket.broadcast.emit('background', data);
	});
	socket.on('cursor' , function(data) {
		if(!client[socket]) {
			client[socket] = {};
		}
		client[socket].uuid = data.uuid;
		socket.broadcast.emit('cursor', data);
	});
	socket.on('disconnect', function() {
		if(client[socket]) {
			socket.broadcast.emit('cursor', {
				quit: true,
				uuid: client[socket].uuid
			});
		}
		delete client[socket];
	});
});
io.on('disconnect', function(socket) {
	if(client[socket]) {
		socket.broadcast.emit('cursor', {
			quit: true,
			uuid: client[socket].uuid
		});
		delete client[socket];
	}
});

function draw(pos, last, radius, color) {
	if(radius < 1) {
		radius = 1;
		env.radius = radius;
	}
	if(radius > 15) {
		radius = 15;
		env.radius = radius;
	}
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
