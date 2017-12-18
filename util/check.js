const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { getFieldValuesFromFileName } = require('./file-naming');
const { saveConfigFile } = require('./config');

const resultCodes = {
  FILE_CONFIG_NOT_FOUND: (table, contentField, fileName) => ({
    table,
    contentField,
    fileName
  }),
  DUPLICATE_FILES: (table, contentField, sysId, fileNames) => ({
    table,
    contentField,
    fileNames,
    sysId
  })
};
exports.resultCodes = resultCodes;

/**
 * Runs the entire suite of checks
 *
 * @param {object} config
 * @returns {{duplicates: object[], removedDuplicates: Object.<string, string>}} check results
 */
function check(config) {
  const duplicates = detectDuplicates(config);
  const removedDuplicates = removeDuplicates(config, duplicates);
  const {
    missingFiles,
    missingTableRecordEntries,
    missingTableConfigs,
    missingTableRecordObjects
  } = detectMissingFiles(config);

  saveConfigFile(config);

  return {
    duplicates,
    removedDuplicates,
    missingFiles,
    missingTableRecordEntries,
    missingTableConfigs,
    missingTableRecordObjects
  };
}
exports.check = check;

/**
 * Detects the now-sync configuration’s `records` object for duplicate files based on the record’s sys_id.
 *
 * @param {object} config The now-sync config object
 * @returns {Array.<{code: string, data: object}>}
 */
function detectDuplicates(config) {
  const { config: configObj, records } = config;
  const tableNames = _.keys(records);

  const problems = [];

  let i;
  for (i = 0; i < tableNames.length; i++) {
    const table = tableNames[i];
    const tableConfig = configObj[table];
    const tableRecords = records[table];

    if (tableRecords.length > 1) {
      const tableRecordData = [];
      let j;

      for (j = 0; j < tableRecords.length; j++) {
        const tableRecord = tableRecords[j];
        const { contentField, fileName } = tableRecord;

        const configFormat = _.find(
          tableConfig.formats,
          format => format.contentField === contentField
        );
        if (configFormat) {
          const { fileName: fileTemplate } = configFormat;
          const sysId = extractIdFromFileName(fileTemplate, fileName);
          tableRecordData.push({
            contentField,
            fileName,
            sysId
          });
        } else {
          problems.push({
            code: 'FILE_CONFIG_NOT_FOUND',
            data: resultCodes.FILE_CONFIG_NOT_FOUND(
              table,
              contentField,
              fileName
            )
          });
        }
      }

      // unique objects should only have a length of 1
      const uniqueTableRecords = _.groupBy(
        tableRecordData,
        ({ contentField, sysId }) => `${contentField}-${sysId}`
      );
      const uniqueTableRecordKeys = _.keys(uniqueTableRecords);
      for (j = 0; j < uniqueTableRecordKeys.length; j++) {
        const uniqueTableRecordsArr =
          uniqueTableRecords[uniqueTableRecordKeys[j]];
        if (uniqueTableRecordsArr.length > 1) {
          problems.push({
            code: 'DUPLICATE_FILES',
            data: resultCodes.DUPLICATE_FILES(
              table,
              uniqueTableRecordsArr[0].contentField,
              uniqueTableRecordsArr[0].sysId,
              _.map(uniqueTableRecordsArr, 'fileName')
            )
          });
        }
      }
    }
  }

  return problems;
}
exports.detectDuplicates = detectDuplicates;

/**
 * Removes duplicate config record entries from the config object
 *
 * @param {object} config The config JSON object
 * @param {{Array.<{code: string, data: object}>}} duplicates Array of duplicate objects
 */
function removeDuplicates(config, duplicates) {
  const results = {};
  const duplicatesArr = _.filter(
    duplicates,
    obj => obj.code === 'DUPLICATE_FILES'
  );

  let i;
  for (i = 0; i < duplicatesArr.length; i++) {
    const { fileNames, table } = duplicatesArr[i].data;
    const fileNameCount = _.countBy(fileNames);
    const uniqueFileNames = _.keys(fileNameCount);

    let j;
    for (j = 0; j < uniqueFileNames.length; j++) {
      const fileName = uniqueFileNames[j];

      if (fileNameCount[fileName] > 1) {
        if (!results[table]) {
          results[table] = [];
        }

        let k;
        for (k = 0; k < fileNameCount[fileName] - 1; k++) {
          const configLastRecordIndex = _.findLastIndex(
            config.records[table],
            record => record.fileName === fileName
          );

          results[table].push(fileName);
          config.records[table] = [
            ...config.records[table].slice(0, configLastRecordIndex),
            ...config.records[table].slice(configLastRecordIndex + 1)
          ];
        }

        results[table] = _.uniq(results[table]);
      }
    }
  }

  return results;
}
exports.removeDuplicates = removeDuplicates;

/**
 * Checks the now-sync config’s records to ensure all files exist, and checks the file folders for any files that don’t exist in the now-sync config.
 *
 * @param {object} config The config object
 * @returns {{missingFiles: string[], missingTableRecordEntries: string[], missingTableConfigs: string[], missingTableRecordObjects: string[]}} All discrepancies found between the configured records and the folder/file structure
 */
function detectMissingFiles(config) {
  const { config: nowConfig, records, filePath: configFilePath } = config;
  const nowFilePath = path.resolve(process.cwd(), configFilePath);

  // exists as a records entry but file not found
  const missingFiles = [];

  // files found that don’t exist as a records entry
  const missingTableRecordEntries = [];

  // folders found that don’t exist as a config key
  const missingTableConfigs = [];

  // folders found that don’t exist as a records key
  const missingTableRecordObjects = [];

  const tableFolders = fs.readdirSync(nowFilePath);

  let i;
  for (i = 0; i < tableFolders.length; i++) {
    const tableFolder = tableFolders[i];
    const tableFolderPath = path.resolve(nowFilePath, tableFolder);
    const tableFolderPathRelative = path.join(configFilePath, tableFolder);
    const stats = fs.statSync(tableFolderPath);

    if (stats.isDirectory()) {
      const isTableConfigFound = !!nowConfig[tableFolder];
      const tableRecords = records[tableFolder];

      // check for extra folders not found in now-sync config
      if (!isTableConfigFound) {
        missingTableConfigs.push(tableFolderPathRelative);
      }

      if (!tableRecords) {
        missingTableRecordObjects.push(tableFolderPathRelative);
      } else {
        // for each folder, check for files not found in now-sync config records
        const recordFiles = fs.readdirSync(tableFolderPath);
        for (let j = 0; j < recordFiles.length; j++) {
          const recordFileName = recordFiles[j];
          const foundRecordEntry = _.find(
            tableRecords,
            ({ fileName }) => fileName === recordFileName
          );
          if (!foundRecordEntry) {
            const filePathRelative = path.join(
              tableFolderPathRelative,
              recordFileName
            );
            missingTableRecordEntries.push(filePathRelative);
          }
        }

        // check each config records entry to make sure that the file exists
        _.forEach(tableRecords, ({ fileName }) => {
          const filePath = path.resolve(tableFolderPath, fileName);
          const filePathRelative = path.join(tableFolderPathRelative, fileName);
          try {
            const fileStats = fs.statSync(filePath);
            if (!fileStats.isFile()) {
              missingFiles.push(filePathRelative);
            }
          } catch (e) {
            if (e.code === 'ENOENT') {
              missingFiles.push(filePathRelative);
            }
          }
        });
      }
    }
  }

  return {
    missingFiles,
    missingTableRecordEntries,
    missingTableConfigs,
    missingTableRecordObjects
  };
}
exports.detectMissingFiles = detectMissingFiles;

/**
 * Extracts the sys_id string from a given file name and file template and returns it.
 *
 * @param {string} fileTemplate A PathToRegexp file template
 * @param {string} fileName The file name
 * @returns {string} The extracted sys_id
 */
function extractIdFromFileName(fileTemplate, fileName) {
  const fieldValues = getFieldValuesFromFileName(fileName, fileTemplate);
  return fieldValues.sys_id;
}
