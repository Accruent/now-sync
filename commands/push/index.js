const _ = require('lodash');
const ora = require('ora');
const CommandParser = require('../command-parser');
const { push } = require('../../util/sync');
const { logInfo, logError, logWarn } = require('../../util/logging');

module.exports = class Push extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  async action() {
    const spinner = ora('Pushing file content to ServiceNow...').start();

    try {
      const tableUpdates = await push();
      spinner.stop();

      const notUpdatedRecords = [];
      _.forEach(tableUpdates, (updates, table) => {
        const updatedTableRecords = [];
        _.forEach(updates, ({ response, table: recordTable, sysId }) => {
          if (response.result && response.result.sys_id) {
            updatedTableRecords.push(response.result.sys_id);
          } else {
            notUpdatedRecords.push({
              table: recordTable,
              sysId
            });
          }
        });

        logInfo(`${table} records updated: ${updatedTableRecords.join(', ')}`);
      });

      if (notUpdatedRecords.length) {
        logWarn('Could not update the following records:');
        _.forEach(notUpdatedRecords, ({ table, sysId }) => {
          logInfo(`  ${table}.${sysId}`);
        });
      }
    } catch (e) {
      spinner.stop();
      logError(e);
    }
  }
};
