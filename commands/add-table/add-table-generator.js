// const Promise = require('bluebird');
const Generator = require('yeoman-generator');
const inquirer = require('inquirer');
const _ = require('lodash');
const Rx = require('rx');
const { parseConfigFile, saveConfigFile } = require('../../util/config');

const config = parseConfigFile();

class ConfigGenerator extends Generator {
  initializing() {
    this.savedAnswers = {
      extensions: {}
    };
    this.fileFieldNames = null;
  }

  prompting() {
    const done = this.async();
    const questions = new Rx.Subject();
    const prompt = inquirer.prompt(questions);

    prompt.ui.process.subscribe(
      ({ name, answer }) => {
        this.savedAnswers[name] = answer;

        // for fileFields specifically: process each
        // answer and add additional questions to
        // gather the file extension for each file type.
        if (name === 'fileFields') {
          this.fileFieldNames = _.map(answer.split(','), fileField =>
            fileField.trim()
          );
          _.forEach(this.fileFieldNames, fieldName => {
            questions.onNext({
              name: `extensions.${fieldName}`,
              type: 'input',
              message: `File extension for field \`${
                fieldName
              }\`? (don’t include the period[.])`,
              validate: extensionAnswer => !!extensionAnswer
            });
          });
          questions.onCompleted();
        } else if (name.indexOf('extensions.') === 0) {
          const fileFieldName = name.substr('extensions.'.length);
          this.savedAnswers.extensions[fileFieldName] = answer;
        }
      },
      err => {
        throw new Error(err.message);
      },
      () => {
        done();
      }
    );

    questions.onNext({
      name: 'table',
      type: 'input',
      message: 'Table (API) name?',
      store: true,
      validate: answer => !!answer
    });
    questions.onNext({
      name: 'nameField',
      type: 'input',
      message:
        'Which field(s) to use as the table’s name field? (Use commas[,] to separate fields)',
      store: true,
      validate: answer => !!answer
    });
    questions.onNext({
      name: 'confirmTable',
      type: 'confirm',
      message:
        'Table configuration already exists! Are you sure you want to reconfigure?',
      default: false,
      when: answers => !!config.config[answers.table]
    });
    questions.onNext({
      name: 'fileFields',
      type: 'input',
      message:
        'Field name(s) to save as files? (Use commas[,] to separate field names)',
      validate: answer => !!answer,
      when: answers =>
        _.isUndefined(answers.confirmTable) || answers.confirmTable
    });
  }

  configuring() {
    const { extensions, nameField, table } = this.savedAnswers;
    const { fileFieldNames } = this;

    const formattedNameFields = _.map(nameField.split(','), name =>
      name.trim()
    );

    config.config[table] = {
      nameField: formattedNameFields,
      formats: []
    };
    config.records[table] = [];

    const filenamePrefix = _.map(formattedNameFields, name => `:${name}`).join(
      '-'
    );

    _.forEach(fileFieldNames, field => {
      config.config[table].formats.push({
        fileName: `${filenamePrefix}-${field}-:sys_id.${extensions[field]}`,
        contentField: field
      });
    });
  }

  writing() {
    saveConfigFile(config);
  }
}

module.exports = ConfigGenerator;
