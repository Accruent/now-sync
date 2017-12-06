const mapValues = require('lodash/mapValues');
const trim = require('lodash/trim');
const { AUTH_FILE_NAME, CONFIG_FILE_NAME } = require('../constants');
const { parseConfigFile } = require('../util/config');
const { logInfo, logError } = require('../util/logging');

module.exports = class CommandParser {
  constructor(args) {
    this.args = mapValues(
      args,
      value => (typeof value === 'string' ? trim(value) : value)
    );

    this.action = this.action.bind(this);
    this.log = this.log.bind(this);
    this.requiresConfigFile = false;
    this.config = null;
  }

  action() {
    logError('Should not instantiate base CommandParser.');
  }

  log(...args) {
    logInfo(...args);
  }

  runAction() {
    if (this.requiresConfigFile) {
      const authFileContents = parseConfigFile(true);
      const configFileContents = parseConfigFile();

      if (!configFileContents) {
        logError(
          `${
            CONFIG_FILE_NAME
          } does not exist or is not readable. Run \`now config\` first.`
        );
        return;
      }

      if (!authFileContents) {
        logError(
          `${
            AUTH_FILE_NAME
          } does not exist or is not readable. Run \`now config\` first.`
        );
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
