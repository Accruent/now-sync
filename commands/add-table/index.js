const _ = require('lodash');
const inquirer = require('inquirer');
const CommandParser = require('../command-parser');
const { saveConfigFile } = require('../../util/config');
const { compileFileTemplate } = require('../../util/file-naming');
const { logInfo } = require('../../util/logging');

module.exports = class Config extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  async action() {
    const { table, nameField, fileFields, confirm } = this.args;

    const {
      promptTable,
      promptNameField,
      promptConfirm,
      promptFileFields
    } = await this.initialPrompt(this.args);

    const finalTable = (table || promptTable).toLowerCase();
    const finalNameField = nameField || promptNameField;
    const finalFileFields = fileFields || promptFileFields;
    const finalConfirm = confirm || promptConfirm;

    if (finalConfirm === false) {
      return;
    }

    const fileFieldNames = _.map(finalFileFields.split(','), fileField =>
      fileField.trim().toLowerCase()
    );
    const extensionQuestions = [];
    _.forEach(fileFieldNames, fieldName => {
      extensionQuestions.push({
        name: fieldName,
        type: 'input',
        message: `File extension for field \`${
          fieldName
        }\`? (don’t include the period[.])`,
        validate: extensionAnswer => !!extensionAnswer
      });
    });

    const extensions = await inquirer.prompt(extensionQuestions);
    const formattedNameFields = _.map(finalNameField.split(','), name =>
      name.trim().toLowerCase()
    );

    this.config.config[table] = {
      nameField: formattedNameFields,
      formats: []
    };
    this.config.records[table] = [];

    _.forEach(fileFieldNames, field => {
      this.config.config[finalTable].formats.push({
        fileName: compileFileTemplate(
          formattedNameFields,
          field,
          extensions[field]
        ),
        contentField: field
      });
    });

    saveConfigFile(this.config);
    logInfo(`Created config for table ${finalTable}.`);
  }

  initialPrompt({ table, nameField, fileFields, confirm }) {
    const questions = [];

    if (!table) {
      questions.push({
        name: 'promptTable',
        type: 'input',
        message: 'Table (API) name?',
        store: true,
        validate: answer => !!answer
      });
    }

    if (!nameField) {
      questions.push({
        name: 'promptNameField',
        type: 'input',
        message:
          'Which field(s) to use as the table’s name field? (Use commas[,] to separate fields)',
        store: true,
        validate: answer => !!answer
      });
    }

    if (!confirm) {
      questions.push({
        name: 'promptConfirm',
        type: 'confirm',
        message:
          'Table configuration already exists! Are you sure you want to reconfigure?',
        default: false,
        when: answers => !!this.config.config[answers.table]
      });
    }

    if (!fileFields) {
      questions.push({
        name: 'promptFileFields',
        type: 'input',
        message:
          'Field name(s) to save as files? (Use commas[,] to separate field names)',
        validate: answer => !!answer,
        when: answers =>
          _.isUndefined(answers.confirmTable) || answers.confirmTable
      });
    }

    return inquirer.prompt(questions);
  }
};
