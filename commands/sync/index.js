const ora = require('ora');
const CommandParser = require('../command-parser');

module.exports =
class Sync extends CommandParser {
	constructor(args) {
		super(args);

		this.requiresConfigFile = true;
	}

	action() {
		const spinner = ora('Retrieving records...').start();
		spinner.stop();
	}
};
