function uuid() {
	return 'xxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function luma(color) {
	color = color.substr(1);
	let r = parseInt(color.substr(0, 2), 16);
	let g = parseInt(color.substr(2, 4), 16);
	let b = parseInt(color.substr(4, 6), 16);
	return ((r * 0.299) + (g * 0.587) + (b * 0.114)) > 50;
}

function download(file, data) {
	let link = document.createElement('a');
	link.classList.add('hidden');
	link.download = file;
	link.href = data;
	document.body.appendChild(link);
	link.click();
}

function isMobile() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent.toLowerCase());
}

export { uuid, luma, download, isMobile };
