import util from './mod/util.js';
import node from './mod/node.js';
import event from './mod/event.js';
import paint from './mod/paint.js';
import modal from './mod/modal.js';
import socket from './mod/socket.js';

const GOOGLE_API_KEY = 'QUl6YVN5QzZVcFRpNVlYc1h6eFJ2aEo4Z1RWbnJtTkpCQ2JCMjBn';

export default {
	constant: {
		color: [
			{ name: 'Salmon', code: '#FA8072' },
			{ name: 'Crimson', code: '#DC143C' },
			{ name: 'Firebrick', code: '#B22222' },
			{ name: 'Pink', code: '#FFC0CB' },
			{ name: 'Hotpink', code: '#FF69B4' },
			{ name: 'Coral', code: '#FF7F50' },
			{ name: 'Tomato', code: '#FF6347' },
			{ name: 'Orange', code: '#FFA500' },
			{ name: 'Gold', code: '#FFD700' },
			{ name: 'Khaki', code: '#F0E68C' },
			{ name: 'Lavender', code: '#E6E6FA' },
			{ name: 'Plum', code: '#DDA0DD' },
			{ name: 'Violet', code: '#EE82EE' },
			{ name: 'Magenta', code: '#FF00FF' },
			{ name: 'Purple', code: '#800080' },
			{ name: 'Indigo', code: '#4B0082' },
			{ name: 'Lime', code: '#00FF00' },
			{ name: 'Olive', code: '#808000' },
			{ name: 'Teal', code: '#008080' },
			{ name: 'Cyan', code: '#00FFFF' },
			{ name: 'Aquamarine', code: '#7FFFD4' },
			{ name: 'Turquoise', code: '#40E0D0' },
			{ name: 'Navy', code: '#000080' },
			{ name: 'Bisque', code: '#FFE4C4' },
			{ name: 'Tan', code: '#D2B48C' },
			{ name: 'Peru', code: '#CD853F' },
			{ name: 'Chocolate', code: '#D2691E' },
			{ name: 'Sienna', code: '#A0522D' },
			{ name: 'Brown', code: '#A52A2A' },
			{ name: 'Silver', code: '#C0C0C0' }
		],
		basic: [
			{ name: 'Black', code: '#000000', active: true },
			{ name: 'White', code: '#FFFFFF' },
			{ name: 'Grey', code: '#808080' },
			{ name: 'Red', code: '#FF0000' },
			{ name: 'Blue', code: '#0000FF' },
			{ name: 'Green', code: '#00FF00' },
			{ name: 'Yellow', code: '#FFFF00' }
		]
	},
	state: {
		last: null,
		cursor: null,
		radius: 3,
		color: '#000000',
		client: [],
		opened: true,
		current: undefined,
		modal: {},
		action: {}
	},
	template: {},
	modal: {},
	init: function() {
		this.util = util;
		this.node = node;
		this.event = event;
		this.paint = paint;
		this.modal = modal;
		this.socket = socket;

		// build
		this.node = node.define({
			canvas: '.canvas',
			overlay: '.overlay',
			toolbar: '.toolbar',
			wrapper: '.wrapper',
			modal: { query: '.modal', all: true },
			action: { query: '[data-action]', all: true },
			list: '.bucket-list',
			spinner: '.spinner'
		});
		this.template.bucket = node.template(function(item) {
			return `<li class="bucket tooltip${item.up ? ' up' : ''}${item.active ? ' active' : ''}" data-title="${item.name}" data-color="${item.code}" style="background: ${item.code}"></li>`;
		});
		this.node.bucket = [];
		for(let item of this.constant.basic) {
			let render = this.template.bucket({ up: true, ...item});
			this.node.bucket.push(render.element);
			render(this.node.toolbar);
		}
		this.node.color = [];
		for(let item of this.constant.color) {
			let render = this.template.bucket({ up: false, ...item});
			this.node.color.push(render.element);
			render(this.node.list);
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

		this.modal.get('color').action.open.before = function(modal) {
			for(let item of that.node.color) {
				if(that.state.color === item.dataset.color) {
					item.classList.add('active');
				}
				else {
					item.classList.remove('active');
				}
			}
		}

		this.modal.get('join').element.querySelector('.action-uuid').focus();
		this.event.action(this.modal.get('join').action.uuid, 'keydown', function(event) {
			if(event.keyCode === 13) {
				that.state.name = that.modal.get('join').element.querySelector('.action-uuid').value.replace(/\s+/g, '');
				if(that.state.name.length >= 3 && that.state.name.length <= 20) {
					that.state.uuid = that.state.name + '-' + that.util.uuid();
					that.socket.connect();
					that.modal.load();
				}
			}
		});
		this.event.action(this.modal.get('join').action.join, 'click', function(event) {
			that.state.name = that.modal.get('join').element.querySelector('.action-uuid').value.replace(/\s+/g, '');
			if(that.state.name.length >= 3 && that.state.name.length <= 20) {
				that.state.uuid = that.state.name + '-' + that.util.uuid();
				that.socket.connect();
				that.modal.load();
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
			that.socket.cursor();
			that.update();
			that.modal.close();
		});
		this.event.action(this.modal.get('clear').action.clear, 'click', function(event) {
			that.paint.g.fillStyle = 'white';
			that.paint.g.fillRect(0, 0, window.innerWidth, window.innerHeight);
			that.socket.clear();
			that.modal.close();
		});
		this.modal.get('save').action.open.before = function(modal) {
			modal.element.querySelector('input.action-file').value = 'outline-image-' + that.util.uuid();
		}
		this.event.action(this.modal.get('save').action.save, 'click', function(event) {
			let file = that.modal.get('save').element.querySelector('.modal input.action-file').value.replace(/\s+/g, '');
			if(file.length >= 3 && file.length <= 40) {
				that.util.download(file, that.node.canvas.toDataURL('image/jpg'));
				that.modal.close();
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
	},
	update: function() {
		this.paint.o.clearRect(0, 0, window.innerWidth, window.innerHeight);
		this.paint.cursor(this.state);
		for(let client of Object.values(this.state.client)) {
			this.paint.cursor(client);
		}
	},
	verify: function() {
		return atob(GOOGLE_API_KEY);
	}
};
