export default {
	init: function(app) {
		this.app = app;
	},
	bind: function(element, args) {
		if(typeof args === 'object') {
			for(let entry of Object.entries(args)) {
				let [ key, value ] = entry;
				if(typeof this[key] === 'function' || typeof this.app.state.action[key] === 'object') {
					this._bindType(element, key, value);
				}
			}
		}
	},
	action: function(action, type, func, args) {
		action.element.addEventListener(type, function(event) {
			if(action.before) {
				action.before();
			}
			func(event);
			if(action.after) {
				action.after();
			}
		}, args);
	},
	_bindType: function(element, key, value) {
		let that = this;
		if(typeof value === 'string') {
			if(Array.isArray(element)) {
				for(let item of element) {
					item.addEventListener(value, function(event) {
						if(that[key]) {
							that[key](event);
						}
						if(that.app.state.action[key]) {
							that.app.state.action[key].trigger();
						}
					});
				}
			}
			else {
				element.addEventListener(value, function(event) {
					if(that[key]) {
						that[key](event);
					}
					if(that.app.state.action[key]) {
						that.app.state.action[key].trigger();
					}
				});
			}
		}
		if(typeof value === 'object') {
			if(Array.isArray(value)) {
				for(let item of value) {
					this._bindType(element, key, item);
				}
			}
			else {
				let { type } = value;
				if(typeof type === 'string') {
					delete value.type;
					if(Array.isArray(element)) {
						for(let item of element) {
							item.addEventListener(type, function(event) {
								if(that[key]) {
									that[key](event);
								}
								if(that.app.state.action[key]) {
									that.app.state.action[key].trigger();
								}
							}, value);
						}
					}
					else {
						element.addEventListener(type, function(event) {
							if(that[key]) {
								that[key](event);
							}
							if(that.app.state.action[key]) {
								that.app.state.action[key].trigger();
							}
						}, value);
					}
				}
			}
		}
	},
	prevent: function(event) {
		event.preventDefault();
	},
	begin: function(event) {
		this.app.state.dragging = true;
		let state = this._state(event);
		this.app.socket.data(state);
		this.app.paint.draw(state);
		this.app.state.last = state.pos;
		this.app.node.toolbar.style.pointerEvents = 'none';
		this.app.socket.cursor();
		this.app.update();
	},
	drag: function(event) {
		let state = this._state(event);
		if(this.app.state.dragging && document.hasFocus()) {
			this.app.socket.data(state);
			this.app.paint.draw(state);
			this.app.state.last = state.pos;
			if(event.type === 'touchmove') {
				this.prevent(event);
			}
		}
		this.app.socket.cursor();
		this.app.update();
	},
	end: function(event) {
		this._state(event);
		this.app.state.dragging = false;
		this.app.state.last = null;
		this.app.node.toolbar.style.pointerEvents = '';
		this.app.socket.cursor();
		this.app.update();
	},
	move: function(event) {
			this.app.state.cursor = event.target === this.app.node.canvas ? this.app.state.pos : null;
			this.app.socket.cursor();
			this.app.update();
	},
	out: function(event) {
		this.app.state.cursor = null;
		this.app.socket.cursor();
		this.app.update();
	},
	scroll: function(event) {
		if(event.ctrlKey) {
			event.preventDefault();
			return;
		}
		if(!this.app.modal.opened) {
			if(event.deltaY < 0) {
				this.app.state.radius += this.app.state.radius < 15 ? 1 : 0;
			}
			else {
				this.app.state.radius -= this.app.state.radius > 1 ? 1 : 0;
			}
		}
		this.app.socket.cursor();
		this.app.update();
	},
	key: function(event) {
		if(!this.app.state.opened) {
			if(!event.getModifierState("CapsLock")) {
				let index;
				if(event.code.startsWith('Digit')) {
					index = parseInt(event.code.substr(5));
				}
				if(event.code.startsWith('Numpad')) {
					index = parseInt(event.code.substr(6));
				}
				index--;
				if(Number.isInteger(index) && index < 7) {
					for(let i in this.app.node.bucket) {
						let item = this.app.node.bucket[i];
						if(index === parseInt(i)) {
							item.classList.add('active');
							this.app.state.color = item.dataset.color;
						}
						else {
							item.classList.remove('active');
						}
					}
				}
			}
		}
		else if(this.app.state.current && this.app.state.current.action.cancel) {
			if(event.keyCode === 27) {
				this.app.modal.close();
			}
		}
		this.app.socket.cursor();
		this.app.update();
	},
	button: function(event) {
		for(let item of this.app.node.bucket) {
			if(item === event.target) {
				item.classList.add('active');
				this.app.state.color = item.dataset.color;
			}
			else {
				item.classList.remove('active');
			}
		}
	},
	resize: function(event) {
		if(typeof event !== 'undefined') {
			let that = this;
			clearTimeout(this.app.state.delay);
			this.app.state.delay = setTimeout(function() {
				that._delayResize();
			}, 100);
		}
		else {
			this._delayResize();
		}
	},
	_delayResize: function(event) {
		this.app.node.canvas.width = window.innerWidth;
		this.app.node.canvas.height = window.innerHeight;
		let cache = this.app.paint.o.getImageData(0, 0, this.app.node.overlay.width, this.app.node.overlay.height);
		this.app.node.overlay.width = window.innerWidth;
		this.app.node.overlay.height = window.innerHeight;
		this.app.paint.o.putImageData(cache, 0, 0);
		this.app.socket.request();
	},
	_state: function(event) {
		let pos = null;
		if(event.type === 'mousemove' || event.type === 'mousedown') {
			pos = {
				x: event.layerX,
				y: event.layerY
			};
		}
		if(event.type === 'touchmove' || event.type === 'touchstart') {
			pos = {
				x: event.touches[0].pageX,
				y: event.touches[0].pageY
			};
		}
		return Object.assign(this.app.state, { pos: pos });
	}
}
