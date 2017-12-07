const _ = require('lodash');
const ora = require('ora');

const CommandParser = require('../command-parser');
const { sync } = require('../../util/sync');
const { logInfo, logError } = require('../../util/logging');

module.exports = class Sync extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  async action() {
    const spinner = ora('Syncing records...').start();

    try {
      const synced = await sync();
      spinner.stop();

      _.forEach(synced, (statsArr, table) => {
        let tableCreatedFiles = [];
        let tableUpdatedFiles = [];
        let tableUpdatedRecordFields = [];

        _.forEach(
          statsArr,
          ({ createdFiles, updatedFiles, updatedRecordFields }) => {
            tableCreatedFiles = tableCreatedFiles.concat(createdFiles);
            tableUpdatedFiles = tableUpdatedFiles.concat(updatedFiles);
            tableUpdatedRecordFields = tableUpdatedRecordFields.concat(
              updatedRecordFields
            );
          }
        );

        if (
          tableCreatedFiles.length ||
          tableUpdatedFiles.length ||
          tableUpdatedRecordFields.length
        ) {
          logInfo(`Changes for table ${table}:`);

          if (tableCreatedFiles.length) {
            logInfo('  Created files:');
            _.forEach(tableCreatedFiles, file => {
              logInfo(`    ${file}`);
            });
          }

          if (tableUpdatedFiles.length) {
            logInfo('  Updated files:');
            _.forEach(tableUpdatedFiles, file => {
              logInfo(`    ${file}`);
            });
          }

          if (tableUpdatedRecordFields.length) {
            logInfo('  Updated records:');
            _.forEach(tableUpdatedRecordFields, ({ body, response }) => {
              logInfo(
                `    ${response.result.sys_id}: ${_.keys(body).join(', ')}`
              );
            });
          }
        }
      });
    } catch (e) {
      spinner.stop();
      logError(e);
    }
  }
};
