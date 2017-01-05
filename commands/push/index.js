const CommandParser = require('../command-parser');

module.exports =
class Push extends CommandParser {
	action() {
		console.log('Push', this.args);
	}
};
