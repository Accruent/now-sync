const chalk = require('chalk');
const { AUTH_FILE_NAME, CONFIG_FILE_NAME } = require('../constants');
const { parseConfigFile } = require('../util/config');

module.exports = class CommandParser {
  constructor(args) {
    this.args = args;

    this.action = this.action.bind(this);
    this.log = this.log.bind(this);
    this.requiresConfigFile = false;
    this.config = null;
  }

  action() {
    console.error(new Error('Should not instantiate base CommandParser.')); // eslint-disable-line no-console
  }

  log(...args) {
    console.log(...args); // eslint-disable-line no-console
  }

  runAction() {
    if (this.requiresConfigFile) {
      const authFileContents = parseConfigFile(true);
      const configFileContents = parseConfigFile();

      if (!configFileContents) {
        const errorMsg = chalk.bold.red(`${CONFIG_FILE_NAME} does not exist or is not readable. Run \`now config\` first.`);
        console.error(errorMsg); // eslint-disable-line no-console
        return;
      }

      if (!authFileContents) {
        const errorMsg = chalk.bold.red(`${AUTH_FILE_NAME} does not exist or is not readable. Run \`now config\` first.`);
        console.error(errorMsg); // eslint-disable-line no-console
        return;
      }

      this.auth = authFileContents;
      this.config = configFileContents;

      this.action();
    } else {
      this.action();
    }
  }
};
