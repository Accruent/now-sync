const ora = require('ora');
const CommandParser = require('../command-parser');
const { formatVersion, getInstanceVersion, printInfo } = require('../../util/info');

module.exports =
class Info extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  action() {
    const spinner = ora('Retrieving instance info...').start();
    getInstanceVersion().then(({ version, latency }) => {
      spinner.stop();
      printInfo({
        Version: formatVersion(version),
        Latency: latency
      });
    });
  }
};
