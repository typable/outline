import constant from './mod/constant.js';
import { uuid, download } from './mod/util.js';
import { define, html } from './mod/node.js';
import event from './mod/event.js';
import paint from './mod/paint.js';
import modal from './mod/modal.js';
import socket from './mod/socket.js';

const GOOGLE_API_KEY = 'QUl6YVN5QzZVcFRpNVlYc1h6eFJ2aEo4Z1RWbnJtTkpCQ2JCMjBn';

export default {
	state: {
		last: null,
		cursor: null,
		radius: 3,
		color: '#000000',
		client: [],
		opened: true,
		current: undefined,
		modal: {},
		action: {},
		fps: 1000 / 60,
		then: Date.now()
	},
	template: {},
	modal: {},
	init: function() {
		this.constant = constant;
		this.event = event;
		this.paint = paint;
		this.modal = modal;
		this.socket = socket;

		// build
		this.node = define({
			canvas: '.canvas',
			overlay: '.overlay',
			toolbar: '.toolbar',
			wrapper: '.wrapper',
			modal: { query: '.modal', all: true },
			action: { query: '[data-action]', all: true },
			list: '.bucket-list',
			spinner: '.spinner'
		});

		this.template.bucket = html(function(item) {
			return `<div class="bucket${item.active ? ' active' : ''}"
				data-color="${item.code}"
				style="background: ${item.code}"></div>`;
		});
		this.node.bucket = [];
		for(let item of this.constant.basic) {
			let result = this.template.bucket.build(item);
			this.node.bucket.push(result.element);
			result.render(this.node.toolbar);
		}
		this.node.color = [];
		for(let item of this.constant.color) {
			let result = this.template.bucket.build(item);
			this.node.color.push(result.element);
			result.render(this.node.list);
		}

		// init
		this.event.init(this);
		this.paint.init(this);
		this.modal.init(this);
		this.socket.init(this);
		let that = this;

		// events
		this.event.bind(this.node.canvas, {
			prevent: ['dragstart', 'contextmenu'],
			begin: ['mousedown', 'touchstart'],
			drag: ['mousemove', 'touchmove']
		});
		this.event.bind(document, {
			move: ['mousemove', 'touchmove'],
			end: ['mouseup', 'touchend', 'mouseleave'],
			key: 'keydown',
			out: 'mouseout',
			scroll: { type: 'wheel', passive: false }
		});
		this.event.bind(window, {
			resize: 'resize'
		});
		this.event.bind(this.node.bucket, {
			button: 'mousedown'
		});
		this.event.resize();

		// actions
		this.modal.get('color').action.open.before = function(modal) {
			for(let item of that.node.color) {
				item.classList[that.state.color === item.dataset.color ? 'add' : 'remove']('active');
			}
		}

		this.modal.get('join').element.querySelector('.action-uuid').focus();
		this.event.action(this.modal.get('join').action.uuid, 'keydown', function(event) {
			let input = that.modal.get('join').element.querySelector('.action-uuid');
			input.classList.remove('invalid');
			if(event.keyCode === 13) {
				that.state.name = input.value.replace(/\s+/g, '');
				if(that.state.name.length >= 3 && that.state.name.length <= 20) {
					that.state.uuid = that.state.name + '-' + uuid();
					that.socket.connect();
					that.modal.load();
				}
				else {
					input.classList.add('invalid');
				}
			}
		});
		this.event.action(this.modal.get('join').action.join, 'click', function(event) {
			let input = that.modal.get('join').element.querySelector('.action-uuid');
			that.state.name = input.value.replace(/\s+/g, '');
			if(that.state.name.length >= 3 && that.state.name.length <= 20) {
				that.state.uuid = that.state.name + '-' + uuid();
				that.socket.connect();
				that.modal.load();
			}
			else {
				input.classList.add('invalid');
			}
		});
		this.modal.get('scaling').action.open.before = function(modal) {
			modal.element.querySelector('input.action-range').value = that.state.radius;
			let circle = modal.element.querySelector('.circle');
			circle.style.width = that.state.radius * 4 + 'px';
			circle.style.height = that.state.radius * 4 + 'px';
		}
		this.event.action(this.modal.get('scaling').action.range, 'input', function(event) {
			setTimeout(function() {
				let circle = that.modal.get('scaling').element.querySelector('.modal .circle');
				circle.style.width = event.target.value * 4 + 'px';
				circle.style.height = event.target.value * 4 + 'px';
			}, 10);
		});
		this.event.action(this.modal.get('scaling').action.scaling, 'click', function(event) {
			that.state.radius = parseInt(that.modal.get('scaling').element.querySelector('.modal input.action-range').value);
			that.modal.close();
		});
		this.event.action(this.modal.get('clear').action.clear, 'click', function(event) {
			that.paint.g.fillStyle = 'white';
			that.paint.g.fillRect(0, 0, window.innerWidth, window.innerHeight);
			that.socket.clear();
			that.modal.close();
		});
		this.modal.get('save').action.open.before = function(modal) {
			modal.element.querySelector('input.action-file').value = 'outline-image-' + uuid();
			let input = that.modal.get('save').element.querySelector('.modal input.action-file');
			input.classList.remove('invalid');
		}
		this.event.action(this.modal.get('save').action.save, 'click', function(event) {
			let input = that.modal.get('save').element.querySelector('.modal input.action-file');
			input.classList.remove('invalid');
			let file = input.value.replace(/\s+/g, '');
			if(file.length >= 3 && file.length <= 40) {
				download(file, that.node.canvas.toDataURL('image/jpg'));
				that.modal.close();
			}
			else {
				input.classList.add('invalid');
			}
		});
		for(let item of this.node.color) {
			item.addEventListener('click', function(event) {
				that.state.color = item.dataset.color;
				for(let _item of that.node.bucket) {
					_item.classList.remove('active');
				}
				that.modal.close();
			});
		}
		this.event.action(this.modal.get('error').action.reconnect, 'click', function(event) {
			that.modal.load();
			that.socket.reconnect();
		});
		this.loop();
	},
	update: function() {
		this.socket.cursor();
		this.paint.o.clearRect(0, 0, window.innerWidth, window.innerHeight);
		this.paint.cursor(this.state);
		for(let client of Object.values(this.state.client)) {
			this.paint.cursor(client);
		}
	},
	loop: function() {
		requestAnimationFrame(this.loop.bind(this));
		this.state.now = Date.now();
		this.state.elapsed = this.state.now - this.state.then;

		if(this.state.elapsed > this.state.fps) {
			this.state.then = this.state.now - (this.state.elapsed % this.state.fps);
			this.update();
		}
	}
};
