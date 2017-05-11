const _ = require('lodash');
const ora = require('ora');
const Promise = require('bluebird');

const CommandParser = require('../command-parser');
const {
  getRecordsToSync,
  initSyncAllFilesForTable
} = require('../../util/sync');

module.exports =
class Sync extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  action() {
    const spinner = ora('Syncing records...').start();
    const nonemptyRecords = getRecordsToSync();
    const nonemptyTables = _.keys(nonemptyRecords);

    Promise.all(_.map(nonemptyTables, initSyncAllFilesForTable))
      .then(() => {
        spinner.stop();
      });
  }
};
