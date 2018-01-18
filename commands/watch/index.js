const _ = require('lodash');
const CommandParser = require('../command-parser');
const { watch } = require('../../util/watch');
const { logError, logInfo } = require('../../util/logging');

module.exports = class Watch extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  action() {
    watch((err, event, stats, data) => {
      if (err) {
        logError(err);
        return;
      }

      switch (event) {
        case 'ready': {
          logInfo(`Watching ${this.config.filePath} for changes...`);
          break;
        }

        case 'change': {
          const { table, sysId, response } = data;

          const { body, response: apiResponse } = response;
          const { status, error } = apiResponse;

          if (status === 'failure' || error) {
            logError(`${error.message}: ${error.detail}`);
          } else {
            logInfo(
              `Updated ServiceNow record: ${table}/${
                sysId
              } with fields: ${_.keys(body).join(', ')}`
            );
          }

          break;
        }

        case 'unlink': {
          const { table, file } = data;
          logInfo(`Removed "${table}/${file}" from now-sync config.`);
          break;
        }

        case 'add':
        default:
          break;
      }
    });
  }
};
