const inquirer = require('inquirer');
const CommandParser = require('../command-parser');
const { parseConfigFile } = require('../../util/config');
const { generateFilesToWriteForRecord, getFieldValues, writeFilesForTable } = require('../../util/add');

module.exports =
class Create extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  async action() {
    const questions = [
      {
        name: 'table',
        type: 'input',
        message: 'Table (API) name?',
        store: true,
        validate: answer => !!answer
      },
      {
        name: 'sysId',
        type: 'input',
        message: 'Record sys_id?',
        validate: answer => !!answer
      }
    ];

    const { sysId, table } = await inquirer.prompt(questions);

    const config = parseConfigFile();
    const tableConfig = config.config[table];

    if (!tableConfig) {
      throw new Error(`Configuration for table \`${table}\` not found. Run \`now add:table\` to configure files for this table.`);
    }

    const data = await getFieldValues(table, sysId);
    const filesToWrite = generateFilesToWriteForRecord(table, data);
    return writeFilesForTable(table, filesToWrite);
  }
};
