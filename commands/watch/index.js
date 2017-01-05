const CommandParser = require('../command-parser');

module.exports =
class Watch extends CommandParser {
	action() {
		console.log('Watch', this.args);
	}
};
