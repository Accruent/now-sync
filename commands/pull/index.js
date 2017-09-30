const ora = require('ora');
const CommandParser = require('../command-parser');
const { pull } = require('../../util/sync');

module.exports = class Pull extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  async action() {
    const spinner = ora('Pulling file content from ServiceNow...').start();
    await pull();
    spinner.stop();
  }
};
