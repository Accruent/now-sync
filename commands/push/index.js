const _ = require('lodash');
const ora = require('ora');
const CommandParser = require('../command-parser');
const { push } = require('../../util/sync');
const { logInfo, logError } = require('../../util/logging');

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

      _.forEach(tableUpdates, (updates, table) => {
        const sysIds = _.map(updates, ({ response }) => response.result.sys_id);

        logInfo(`${table} records updated: ${sysIds.join(', ')}`);
      });
    } catch (e) {
      spinner.stop();
      logError(e);
    }
  }
};
