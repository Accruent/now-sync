const Generator = require('yeoman-generator');

const { generateFilesToWriteForRecord, getFieldValues, writeFilesForTable } = require('../../util/add');
const { parseConfigFile } = require('../../util/config');

let filesToWrite;
const config = parseConfigFile();

class ConfigGenerator extends Generator {
  prompting() {
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

    return this.prompt(questions)
      .then(answers => {
        this.answers = answers;
      });
  }

  configuring() {
    const { sysId, table } = this.answers;
    const tableConfig = config.config[table];

    if (!tableConfig) {
      throw new Error(`Configuration for table \`${table}\` not found. Run \`now add:table\` to configure files for this table.`);
    }

    return getFieldValues(table, sysId)
      .then(data => {
        filesToWrite = generateFilesToWriteForRecord(table, data);
      })
      .catch(err => {
        throw err;
      });
  }

  writing() {
    const { table } = this.answers;

    return writeFilesForTable(table, filesToWrite);
  }
}

module.exports = ConfigGenerator;
