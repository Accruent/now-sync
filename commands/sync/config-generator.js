const Promise = require('bluebird');
const Generator = require('yeoman-generator');
const fs = Promise.promisifyAll( require('fs') );
const yaml = require('js-yaml');

const { configFilePath } = require('../../constants');

let savedAnswers;

class ConfigGenerator extends Generator {
	prompting() {
		const questions = [
			{
				type: 'input',
				name: 'instanceUrl',
				message: 'ServiceNow instance URL (include the `https://`)',
				validate: answer => answer.indexOf('https://') === 0
			},
			{
				type: 'input',
				name: 'username',
				message: 'User name',
				validate: answer => !!answer
			},
			{
				type: 'password',
				name: 'password',
				message: 'Password',
				validate: answer => !!answer
			}
		];

		return this.prompt(questions)
			.then((answers) => {
				savedAnswers = answers;
			});
	}

	configuring() {
		const { instanceUrl, username, password } = savedAnswers;
		const config = {
			auth: {
				// TODO: OAuth support
				type: 'Basic',
				key: Buffer.from(`${username}:${password}`).toString('base64')
			},
			url: instanceUrl
		};
		
		return fs.writeFileAsync( configFilePath, yaml.safeDump(config) )
			.catch((err) => {
				throw err;
			});
	}
}

module.exports = ConfigGenerator;
