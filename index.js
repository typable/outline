const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { createCanvas } = require('canvas');
const paint = require('./public/js/mod/paint');

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

paint.init(g);

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
		paint.draw(data);
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
