const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const CommandParser = require('../command-parser');
const { get } = require('../../util/api');

module.exports =
class Info extends CommandParser {
	constructor(args) {
		super(args);

		this.requiresConfigFile = true;
	}

	action() {
		const spinner = ora('Retrieving instance info...').start();

		get('/table/sys_properties?sysparm_query=name%3Dglide.war')
			.then((response) => {
				const { result } = response;

				this.printInfo({
					version: this.formatVersion(result[0].value)
				});

				spinner.stop();
			})
			.catch((err) => {
				const errorMsg = chalk.bold.red(`An error occurred: ${err.toString()}`);
				console.error(errorMsg); // eslint-disable-line no-console

				spinner.stop();
			});
	}

	formatVersion(rawVersionStr) {
		const pathObj = path.parse(rawVersionStr);
		const versionName = pathObj.name;

		const glideStr = 'glide-';
		const indexOfGlideStr = versionName.indexOf(glideStr);

		return (indexOfGlideStr === 0) ?
			versionName.substr(glideStr.length)
			:
			versionName;
	}

	printInfo({ version }) {
		const { url } = this.config;
		const infoStr = `

Instance info
=============
URL:         ${url}
Version:     ${version}
`;

		console.log(infoStr); // eslint-disable-line no-console
	}
};
