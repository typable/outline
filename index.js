const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

let port = 80;
let client = {};

app.use(express.static(__dirname + '/public'));

const proxy = http.listen(port, function() {
	console.log('Server started on port: ' + port);
});

io.path('/pipe');
io.listen(proxy);

io.on('connection', function(socket) {
	client[socket] = {};
	socket.on('data' , function(data) {
		socket.broadcast.emit('data', data);
	});
	socket.on('clear' , function(data) {
		socket.broadcast.emit('clear', data);
	});
	socket.on('background' , function(data) {
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
		socket.broadcast.emit('cursor', {
			quit: true,
			uuid: client[socket].uuid
		});
		delete client[socket];
	});
});
io.on('disconnect', function(socket) {
	socket.broadcast.emit('cursor', {
		quit: true,
		uuid: client[socket].uuid
	});
	delete client[socket];
});
