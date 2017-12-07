const ora = require('ora');
const CommandParser = require('../command-parser');
const {
  formatVersion,
  getInstanceVersion,
  printInfo
} = require('../../util/info');
const { logInfo, logError } = require('../../util/logging');

module.exports = class Info extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  async action() {
    const spinner = ora('Retrieving instance info...').start();

    try {
      const response = await getInstanceVersion();

      if (response) {
        const { version, latency } = response;
        const infoStr = printInfo({
          Version: formatVersion(version),
          Latency: latency
        });

        logInfo(infoStr);
      }
    } catch (e) {
      logError(`\n${e.toString()}`);
    }

    spinner.stop();
  }
};
