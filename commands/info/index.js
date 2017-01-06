const CommandParser = require('../command-parser');

module.exports =
class Info extends CommandParser {
	constructor(args) {
		super(args);

		this.requiresConfigFile = true;
	}

	action() {
		console.log('info', this.args);
	}
};
