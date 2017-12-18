const _ = require('lodash');
const CommandParser = require('../command-parser');
const { logError, logInfo, logWarn } = require('../../util/logging');
const { check } = require('../../util/check');

module.exports = class Config extends CommandParser {
  constructor(args) {
    super(args);

    this.requiresConfigFile = true;
  }

  async action() {
    let i;

    logInfo('Checking for duplicates…');
    const {
      duplicates,
      removedDuplicates,
      missingFiles,
      missingTableRecordEntries,
      missingTableConfigs,
      missingTableRecordObjects
    } = check(this.config);

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
            logInfo(`  ${fileNames[j]}`);
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

    const removedDuplicateTables = _.keys(removedDuplicates);
    for (i = 0; i < removedDuplicateTables.length; i++) {
      const table = removedDuplicateTables[i];
      const duplicateTableFiles = removedDuplicates[table];

      let j;
      for (j = 0; j < duplicateTableFiles.length; j++) {
        logInfo(
          `Removed duplicate file entry for table ${table}: ${
            duplicateTableFiles[j]
          }`
        );
      }
    }

    logInfo('');
    logInfo('Checking for missing files…');

    if (missingTableConfigs.length) {
      logWarn(
        'Folders found that don’t have a matching config (check the `config` section of your .now-sync config):'
      );
      for (i = 0; i < missingTableConfigs.length; i++) {
        logInfo(`  ${missingTableConfigs[i]}`);
      }
    }

    if (missingTableRecordObjects.length) {
      logWarn(
        'Folders found that don’t have a matching record object (check the `records` section of your .now-sync config):'
      );
      for (i = 0; i < missingTableRecordObjects.length; i++) {
        logInfo(`  ${missingTableRecordObjects[i]}`);
      }
    }

    if (missingFiles.length) {
      logWarn('Records entries that match non-existent files:');
      for (i = 0; i < missingFiles.length; i++) {
        logInfo(`  ${missingFiles[i]}`);
      }
    }

    if (!_.isEmpty(missingTableRecordEntries)) {
      logWarn(
        'Files found that don’t have a matching now-sync record entry (use `now add` to add these record entries):'
      );
      for (i = 0; i < missingTableRecordEntries.length; i++) {
        logInfo(`  ${missingTableRecordEntries[i]}`);
      }
    }
  }
};
