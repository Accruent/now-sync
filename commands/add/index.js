const inquirer = require('inquirer');
const CommandParser = require('../command-parser');
const { parseConfigFile } = require('../../util/config');
const {
  generateFilesToWriteForRecord,
  getFieldValues,
  writeFilesForTable
} = require('../../util/add');

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

    const config = parseConfigFile();
    const tableConfig = config.config[table];

    if (!tableConfig) {
      throw new Error(
        `Configuration for table \`${
          table
        }\` not found. Run \`now add:table\` to configure files for this table.`
      );
    }

    const data = await getFieldValues(table, id);
    const filesToWrite = generateFilesToWriteForRecord(table, data);
    return writeFilesForTable(table, filesToWrite);
  }
};
