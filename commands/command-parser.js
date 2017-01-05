module.exports = class CommandParser {
	constructor(args) {
		this.args = args;

		this.action = this.action.bind(this);
	}

	action() {
		console.log('command', this.args);
	}
};
