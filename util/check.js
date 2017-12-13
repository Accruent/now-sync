const _ = require('lodash');
const { getFieldValuesFromFileName } = require('./file-naming');

const errorCodes = {
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
exports.errorCodes = errorCodes;

/**
 * Runs the entire suite of checks
 *
 * @param {any} config
 * @returns
 */
function check(config) {
  const duplicates = detectDuplicates(config);

  return {
    duplicates
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
            data: errorCodes.FILE_CONFIG_NOT_FOUND(
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
            data: errorCodes.DUPLICATE_FILES(
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
