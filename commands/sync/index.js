const CommandParser = require('../command-parser');

module.exports =
class Sync extends CommandParser {
	action() {
		console.log('Sync', this.args);
	}
};
