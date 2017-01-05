const CommandParser = require('../command-parser');

module.exports =
class Info extends CommandParser {
	action() {
		console.log('info', this.args);
	}
};
