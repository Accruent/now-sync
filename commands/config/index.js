const inquirer = require('inquirer');
const CommandParser = require('../command-parser');
const {
  generateConfig,
  generateAuthConfig,
  saveConfigFile
} = require('../../util/config');

module.exports = class Config extends CommandParser {
  async action() {
    const { host, user, password, filePath } = this.args;

    const {
      promptHost,
      promptUser,
      promptPassword,
      promptFilePath
    } = await this.prompt(this.args);

    const finalHost = host || promptHost;
    const finalUser = user || promptUser;
    const finalPassword = password || promptPassword;
    const finalFilePath = filePath || promptFilePath;

    saveConfigFile(generateConfig(finalFilePath));
    saveConfigFile(
      generateAuthConfig(finalHost, finalUser, finalPassword),
      true
    );
  }

  prompt({ instanceUrl, username, password, filePath }) {
    const questions = [];

    if (!instanceUrl) {
      questions.push({
        name: 'promptHost',
        type: 'input',
        message: 'ServiceNow instance URL (include the `https://`)',
        store: true,
        validate: answer => answer.indexOf('https://') === 0
      });
    }

    if (!username) {
      questions.push({
        name: 'promptUser',
        type: 'input',
        message: 'User name',
        store: true,
        validate: answer => !!answer
      });
    }

    if (!password) {
      questions.push({
        name: 'promptPassword',
        type: 'password',
        message: 'Password',
        validate: answer => !!answer
      });
    }

    if (!filePath) {
      questions.push({
        name: 'promptFilePath',
        type: 'input',
        message: 'In which folder should we sync files?',
        default: './now',
        store: true
      });
    }

    return inquirer.prompt(questions);
  }
};
