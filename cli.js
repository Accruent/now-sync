const yargs = require('yargs');
const commands = require('./commands');
const forEach = require('lodash/forEach');

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
          // eslint-disable-next-line no-console
          console.error(`ERROR: ${err.message}`);
        }
      });
    }
  );

  yargsSetup.help().parse();
};
