const CommandParser = require('../command-parser');

module.exports =
class Config extends CommandParser {
	action() {
		console.log('config', this.args);
	}
};
