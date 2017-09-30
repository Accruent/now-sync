const Generator = require('yeoman-generator');
const {
  generateConfig,
  generateAuthConfig,
  saveConfigFile
} = require('../../util/config');

class ConfigGenerator extends Generator {
  prompting() {
    const questions = [
      {
        name: 'instanceUrl',
        type: 'input',
        message: 'ServiceNow instance URL (include the `https://`)',
        store: true,
        validate: answer => answer.indexOf('https://') === 0
      },
      {
        name: 'username',
        type: 'input',
        message: 'User name',
        store: true,
        validate: answer => !!answer
      },
      {
        name: 'password',
        type: 'password',
        message: 'Password',
        validate: answer => !!answer
      },
      {
        name: 'filePath',
        type: 'input',
        message: 'In which folder should we sync files?',
        default: './now',
        store: true
      }
    ];

    return this.prompt(questions).then(answers => {
      this.answers = answers;
    });
  }

  configuring() {
    const { filePath, instanceUrl, username, password } = this.answers;

    saveConfigFile(generateConfig(filePath));
    saveConfigFile(generateAuthConfig(instanceUrl, username, password), true);
  }
}

module.exports = ConfigGenerator;
