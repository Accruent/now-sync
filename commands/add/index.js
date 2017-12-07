const _ = require('lodash');
const inquirer = require('inquirer');
const CommandParser = require('../command-parser');
const { add } = require('../../util/add');
const { logInfo, logError } = require('../../util/logging');

module.exports = class Create extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  async action() {
    let { id, table } = this.args;
    const questions = [];

    if (!table) {
      questions.push({
        name: 'table',
        type: 'input',
        message: 'Table (API) name?',
        store: true,
        validate: answer => !!answer
      });
    }

    if (!id) {
      questions.push({
        name: 'sysId',
        type: 'input',
        message: 'Record sys_id?',
        validate: answer => !!answer
      });
    }

    if (questions.length) {
      const { table: promptTable, sysId } = await inquirer.prompt(questions);

      if (promptTable) {
        table = promptTable;
      }

      if (sysId) {
        id = sysId;
      }
    }

    try {
      const filesWritten = await add(table, id);
      logInfo('Files written:');
      _.forEach(filesWritten, filePath => {
        logInfo(`  ${filePath}`);
      });
    } catch (e) {
      logError(e);
    }
  }
};
