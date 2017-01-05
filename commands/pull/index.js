const CommandParser = require('../command-parser');

module.exports =
class Pull extends CommandParser {
	action() {
		console.log('pull', this.args);
	}
};
