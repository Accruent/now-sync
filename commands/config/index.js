const inquirer = require('inquirer');
const CommandParser = require('../command-parser');
const {
  generateConfig,
  generateAuthConfig,
  saveConfigFile
} = require('../../util/config');
const { logInfo } = require('../../util/logging');

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

    let configFilePath;

    configFilePath = saveConfigFile(generateConfig(finalFilePath));
    logInfo(`Created/updated \`${configFilePath}\``);

    configFilePath = saveConfigFile(
      generateAuthConfig(finalHost, finalUser, finalPassword),
      true
    );
    logInfo(`Created/updated \`${configFilePath}\``);
  }

  prompt({ host, user, password, filePath }) {
    const questions = [];

    if (!host) {
      questions.push({
        name: 'promptHost',
        type: 'input',
        message: 'ServiceNow instance URL (include the `https://`)',
        store: true,
        validate: answer => answer.indexOf('https://') === 0
      });
    }

    if (!user) {
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
