const CommandParser = require('../command-parser');

module.exports =
class Create extends CommandParser {
	action() {
		console.log('create', this.args);
	}
};
