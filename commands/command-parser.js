const { promisifyAll } = require('bluebird');
const chalk = require('chalk');
const fs = promisifyAll(require('fs'));
const { configFileName, configFilePath } = require('../constants');

module.exports = class CommandParser {
	constructor(args) {
		this.args = args;

		this.action = this.action.bind(this);
		this.requiresConfigFile = false;
	}

	action() {
		console.error(new Error('Should not instantiate base CommandParser.')); // eslint-disable-line no-console
	}

	runAction() {
		if (this.requiresConfigFile) {
			this.hasConfigFile()
				.then(() => {
					this.action();
				})
				.catch(() => {
					const errorMsg = chalk.bold.red(`${configFileName} not found. Run \`now config\` first.`);
					console.error(errorMsg); // eslint-disable-line no-console
				});
		} else {
			this.action();
		}
	}

	hasConfigFile() {
		return fs.accessAsync(configFilePath, fs.constants.R_OK);
	}
};
