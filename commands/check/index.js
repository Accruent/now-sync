const CommandParser = require('../command-parser');
const { logError, logInfo } = require('../../util/logging');
const { check } = require('../../util/check');

module.exports = class Config extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  async action() {
    let i;

    logInfo('Checking for duplicates…');
    const { duplicates } = check(this.config);
    for (i = 0; i < duplicates.length; i++) {
      const { code, data } = duplicates[i];

      switch (code) {
        case 'FILE_CONFIG_NOT_FOUND': {
          const { table, contentField, fileName } = data;
          logError(
            `Could not find config format for file \`${fileName}\`. (table: ${
              table
            }, field: ${contentField})`
          );
          break;
        }

        case 'DUPLICATE_FILES': {
          const { table, contentField, fileNames, sysId } = data;
          logError(
            `Duplicate files and/or config entries found for ${table}.${
              sysId
            }.${contentField}:`
          );

          let j;
          for (j = 0; j < fileNames.length; j++) {
            logError(`  ${fileNames[j]}`);
          }
          break;
        }

        default: {
          logError(
            `An unknown error occurred. Raw data: ${JSON.stringify(data)}`
          );
          break;
        }
      }
    }
    if (!duplicates.length) {
      logInfo('No duplicate files or config entries found.');
    }
  }
};
