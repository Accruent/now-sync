const ora = require('ora');
const CommandParser = require('../command-parser');
const {
  formatVersion,
  getInstanceVersion,
  printInfo
} = require('../../util/info');

module.exports = class Info extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  action() {
    const spinner = ora('Retrieving instance info...').start();
    getInstanceVersion().then(response => {
      if (response) {
        const { version, latency } = response;
        printInfo({
          Version: formatVersion(version),
          Latency: latency
        });
      }
      spinner.stop();
    });
  }
};
