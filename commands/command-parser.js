const chalk = require('chalk');
const yaml = require('js-yaml');
const { configFileName } = require('../constants');
const parseConfigFile = require('../util/parse-config-file');

module.exports = class CommandParser {
	constructor(args) {
		this.args = args;

		this.action = this.action.bind(this);
		this.requiresConfigFile = false;
		this.config = null;
	}

	action() {
		console.error(new Error('Should not instantiate base CommandParser.')); // eslint-disable-line no-console
	}

	runAction() {
		if (this.requiresConfigFile) {
			const configFileContents = parseConfigFile();

			if (!configFileContents) {
				const errorMsg = chalk.bold.red(`${configFileName} does not exist or is not readable. Run \`now config\` first.`);
				console.error(errorMsg); // eslint-disable-line no-console
				return;
			}

			this.config = yaml.safeLoad(configFileContents);

			this.action();
		} else {
			this.action();
		}
	}
};
