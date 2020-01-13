// import
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// define
let port = 80;

// functions
const serve = mappings => {
	mappings.forEach(mapping => {
		app.get(mapping.path, (req, res) => {
			res.sendFile(__dirname + mapping.src);
		});
	});
};

// define mapping
let mappings = [
	{ path: '/', src: '/app/index.html' },
	{ path: '/css/style.css', src: '/app/css/style.css' },
	{ path: '/js/socket.io.js', src: '/app/js/socket.io.js' },
	{ path: '/js/index.js', src: '/app/js/index.js' }
];

serve(mappings);

// start server
const proxy = http.listen(port, () => {
	console.log('Server started on port: ' + port);
});

// start socket.io
io.path('/pipe');
io.listen(proxy);

// listener
io.on('connection', socket => {
	socket.on('data' , snap => {
		socket.broadcast.emit('data', snap);
	});
	socket.on('clear' , snap => {
		socket.broadcast.emit('clear', snap);
	});
	socket.on('background' , snap => {
		socket.broadcast.emit('background', snap);
	});
});
