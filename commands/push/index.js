const CommandParser = require('../command-parser');
const { push } = require('../../util/sync');

module.exports = class Push extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  async action() {
    await push();
  }
};
