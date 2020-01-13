const Socket = {
	socket: null,
	connect: (ip, path) => {
		this.socket = io('http://' + ip, {
			path: path ? path : '/pipe'
		});
	}
};
