export default {
	opened: false,
	current: undefined,
	init: function() {
		let that = this;
		this.wrapper = document.querySelector('.wrapper');
		this.modal = {};
		Array.from(document.querySelectorAll('.modal')).forEach(function(item) {
			let modal = { element: item, action: {} };
			let name = item.dataset.modal;
			let cancel = item.querySelector('button.action-cancel');
			if(cancel) {
				modal.action.cancel = { element: cancel };
				cancel.addEventListener('click', function(event) {
					that.close();
					// that.trigger(modal.action.cancel);
				});
				document.addEventListener('keydown', function(event) {
					if(that.opened && typeof that.current.action.cancel !== 'undefined') {
						if(event.keyCode == 27) {
							that.close();
						}
					}
				});
			}
			Array.from(item.querySelectorAll('[class*="action-"]')).forEach(function(item) {
				let name = item.classList[0].substr(7);
				if(name !== 'cancel') {
					modal.action[name] = { element: item };
				}
			});
			that.modal[name] = modal;
		});
	},
	open: function(name) {
		if(this.modal[name]) {
			this.modal[name].element.style.display = '';
			this.wrapper.style.display = '';
			this.opened = true;
			this.current = this.modal[name];
		}
	},
	close: function() {
		this.wrapper.style.display = 'none';
		Object.entries(this.modal).forEach(function([ key, value ]) {
			value.element.style.display = 'none';
		});
		this.opened = false;
		this.current = undefined;
	},
	get: function(name) {
		if(this.modal[name]) {
			return this.modal[name];
		}
	}
	/*
	bind: function(action, callback) {
		action.callback = callback;
	},
	trigger: function(action) {
		if(typeof action.callback === 'function') {
			action.callback(this);
		}
	}
	*/
};
