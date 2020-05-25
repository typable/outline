const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http');
const https = require('https');
const io = require('socket.io');

let env = {
	port: 443,
	path: '/etc/letsencrypt/live/',
	domain: 'prototype-studio.de',
	ssl: true
};

if(fs.existsSync(env.path)) {
	env.credentials = {
		key: fs.readFileSync(env.path + env.domain + '/privkey.pem', 'utf8'),
		cert: fs.readFileSync(env.path + env.domain + '/cert.pem', 'utf8'),
		ca: fs.readFileSync(env.path + env.domain + '/chain.pem', 'utf8')
	};
}
else {
	env.ssl = false;
	env.port = 80;
}

const proxy = env.ssl ? https.createServer(env.credentials, app) : http.createServer(app);
const server = io(https);

app.use(express.static(__dirname + '/public'));

proxy.listen(env.port, function() {
	console.log('Server started on port:', env.port);
});

server.path('/pipe');
server.listen(proxy);

const { createCanvas } = require('canvas');
const paint = require('./public/js/mod/paint');

let client = {};
let width = 1920;
let height = 1080;
let canvas = createCanvas(width, height);
let g = canvas.getContext('2d');
g.fillStyle = 'white';
g.fillRect(0, 0, width, height);

paint.init(g);

server.on('connection', function(socket) {
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
server.on('disconnect', function(socket) {
	if(client[socket]) {
		socket.broadcast.emit('cursor', {
			quit: true,
			uuid: client[socket].uuid
		});
		delete client[socket];
	}
});
