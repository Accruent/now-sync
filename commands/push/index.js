const ora = require('ora');
const CommandParser = require('../command-parser');
const { push } = require('../../util/sync');

module.exports = class Push extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  async action() {
    const spinner = ora('Pushing file content to ServiceNow...').start();
    await push();
    spinner.stop();
  }
};
