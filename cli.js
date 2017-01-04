const commander = require('commander');
const package = require('./package.json');

const startArgs = process.argv.slice(0, 2);
let args = process.argv.slice(2);

module.exports = function cli() {
	commander.version(package.version);
	commander.usage('[command]');

	const commandName = args.shift();

	if (!commandName || commandName === 'help' || commandName === '--help' || commandName === '-h') {
		commander.parse( startArgs.concat(args) );
		commander.help();
  		process.exit(1);
	}

	// parse flags
	args.unshift(commandName);
	commander.parse(startArgs.concat(args));
}
