const path = require('path');
const chalk = require('chalk');
const fetch = require('node-fetch');
const ora = require('ora');
const CommandParser = require('../command-parser');

module.exports =
class Info extends CommandParser {
	constructor(args) {
		super(args);

		this.requiresConfigFile = true;
	}

	action() {
		const url = `${this.config.url}/api/now/table/sys_properties?sysparm_query=name%3Dglide.war`;
		const options = {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${this.config.auth.key}`
			}
		};

		const spinner = ora('Retrieving instance info...').start();

		fetch(url, options)
			.then(stream => stream.json())
			.then((response) => {
				const { result } = response;

				this.printInfo({
					version: this.cleanVersion(result[0].value)
				});

				spinner.stop();
			})
			.catch((err) => {
				const errorMsg = chalk.bold.red(`An error occurred: ${err.toString()}`);
				console.error(errorMsg); // eslint-disable-line no-console

				spinner.stop();
			});
	}

	cleanVersion(rawVersionStr) {
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

Instance Info
=============
URL:         ${url}
Version:     ${version}
`;

		console.log(infoStr); // eslint-disable-line no-console
	}
};
