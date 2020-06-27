export default {
	init: function(app) {
		this.app = app;
		let that = this;
		for(let item of this.app.node.modal) {
			let name = item.dataset.modal;
			let modal = { element: item, action: {} };
			let cancel = item.querySelector('button.action-cancel');
			if(cancel) {
				modal.action.cancel = { element: cancel };
				cancel.addEventListener('click', function(event) {
					that.close();
				});
			}
			this.app.state.modal[name] = modal;
			for(let item of modal.element.querySelectorAll('[class*="action-"]')) {
				let name = item.classList[0].substr(7);
				if(name !== 'cancel') {
					modal.action[name] = { element: item };
				}
			}
		}
		this.app.state.current = this.get('join');
		for(let item of this.app.node.action) {
			let name = item.dataset.action;
			if(this.app.state.modal[name]) {
				let modal = this.app.state.modal[name];
				modal.action.open = {};
				item.addEventListener('click', function(event) {
					if(typeof modal.action.open.before === 'function') {
						modal.action.open.before(modal);
					}
					that.open(name);
					if(typeof modal.action.open.after === 'function') {
						modal.action.open.after(modal);
					}
				});
			}
		}
	},
	open: function(name) {
		if(this.app.state.modal[name]) {
			this.app.node.spinner.classList.add('hidden');
			for(let item of Object.values(this.app.state.modal)) {
				item.element.classList.add('hidden');
			}
			this.app.state.modal[name].element.classList.remove('hidden');
			this.app.node.wrapper.classList.remove('hidden');
			this.app.state.opened = true;
			this.app.state.current = this.app.state.modal[name];
		}
	},
	load: function() {
		this.app.node.wrapper.classList.remove('hidden');
		for(let item of Object.values(this.app.state.modal)) {
			item.element.classList.add('hidden');
		}
		this.app.node.spinner.classList.remove('hidden');
		this.app.state.opened = true;
		this.app.state.current = undefined;
	},
	close: function() {
		this.app.node.wrapper.classList.add('hidden');
		this.app.node.spinner.classList.add('hidden');
		for(let item of Object.values(this.app.state.modal)) {
			item.element.classList.add('hidden');
		}
		this.app.state.opened = false;
		this.app.state.current = undefined;
	},
	get: function(name) {
		if(this.app.state.modal[name]) {
			return this.app.state.modal[name];
		}
	}
};
