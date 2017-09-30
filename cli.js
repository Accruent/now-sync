const chalk = require('chalk');
const commander = require('commander');
const pkg = require('./package.json');
const aliases = require('./commands/aliases');
const commands = require('./commands');

const clone = require('lodash/clone');
const forEach = require('lodash/forEach');

const startArgs = process.argv.slice(0, 2);
const args = process.argv.slice(2);

module.exports = function cli() {
  commander.version(pkg.version);
  commander.usage('[command]');

  const commandName = args.shift();

  if (
    !commandName ||
    commandName === 'help' ||
    commandName === '--help' ||
    commandName === '-h'
  ) {
    help();
  }

  const alias = aliases[commandName];
  if (alias) {
    console.error(chalk.red.bold(`Did you mean \`now ${alias}\`?`)); // eslint-disable-line no-console
    help();
  }

  if (!commands[commandName]) {
    console.error(chalk.red.bold(`Command "${commandName}" not found.`)); // eslint-disable-line no-console
    help();
  }

  const CommandClass = commands[commandName].command;
  const commandInstance = new CommandClass(clone(args));
  commander
    .command(commandName)
    .description(commands[commandName].description)
    .action(commandInstance.runAction.bind(commandInstance));

  // parse flags
  args.unshift(commandName);
  commander.parse(startArgs.concat(args));
};

////// Helpers

function help() {
  forEach(commands, (commandObj, commandNameKey) => {
    commander.command(commandNameKey).description(commandObj.description);
  });

  commander.parse(startArgs.concat(args));
  commander.help();
  process.exit(1);
}
