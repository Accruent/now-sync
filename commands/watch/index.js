const CommandParser = require('../command-parser');
const { watch } = require('../../util/watch');

module.exports =
class Watch extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  action() {
    watch();
  }
};
