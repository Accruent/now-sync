const yargs = require('yargs');
const commands = require('./commands');
const forEach = require('lodash/forEach');
const { logError } = require('./util/logging');

module.exports = function cli() {
  let yargsSetup = yargs;

  forEach(
    commands,
    ({ command, CommandClass, describe, options }, commandNameKey) => {
      const usageStr = command || commandNameKey;
      yargsSetup = yargs.command(usageStr, describe, options || {}, argv => {
        const commandClassInstance = new CommandClass(argv);

        try {
          commandClassInstance.runAction();
        } catch (err) {
          logError(`ERROR: ${err.message}`);
        }
      });
    }
  );

  yargsSetup.help().parse();
};
