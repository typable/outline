const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

let port = 80;

app.use(express.static(__dirname + '/public'));

const proxy = http.listen(port, function() {
	console.log('Server started on port: ' + port);
});

io.path('/pipe');
io.listen(proxy);

io.on('connection', function(socket) {

	socket.on('data' , function(data) {
		socket.broadcast.emit('data', data);
	});
	socket.on('clear' , function(data) {
		socket.broadcast.emit('clear', data);
	});
	socket.on('background' , function(data) {
		socket.broadcast.emit('background', data);
	});
});
