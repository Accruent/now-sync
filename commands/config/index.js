const path = require('path');
const yeoman = require('yeoman-environment');

const CommandParser = require('../command-parser');
const { configFileName } = require('../../constants');

module.exports =
class Config extends CommandParser {
	action() {
		const yeomanEnv = yeoman.createEnv();
		const gen = yeomanEnv.getByPath( path.resolve(__dirname, 'config-generator.js') );

		yeomanEnv.run([gen.namespace], {}, () => {
			console.log(`Created \`${configFileName}\``); // eslint-disable-line no-console
		});
	}
};
