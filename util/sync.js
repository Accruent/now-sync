const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const moment = require('moment');
const { promisify } = require('util');
const Promise = require('bluebird');

const { getFieldValuesFromFileName, getFileNameFields, trimCwd } = require('./file-naming');
const { generateFilesToWriteForRecord, getFieldsToRetrieve, writeFilesForTable } = require('./add');
const { parseConfigFile } = require('./config');
const { get } = require('./api');
const { buildTableApiUrl, convertServiceNowDatetimeToMoment, updateRecord } = require('./service-now');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const statAsync = promisify(fs.stat);

/**
 * Returns a promise resolving to all local file stats and file sysIds
 *
 * @param {string} table ServiceNow table API Name
 * @returns {promise} Promise resolving to an object containing local file stats and sysIds
 */
function getSyncedFileStatsForTable(table) {
  const config = parseConfigFile();
  const tableConfig = config.config[table];
  const localRecords = config.records[table];
  const folderPath = path.resolve(process.cwd(), config.filePath, table);

  const fsStatPromises = [];
  const fileStatsBySysIdByPath = {};
  const missingFieldsBySysId = {};

  // each record may have >1 related files, so we need to sort
  // record:file relations as a one-to-many object.
  _.forEach(localRecords, record => {
    // aggregate all sys_ids for table for API call
    const fileNameTemplate = _.find(tableConfig.formats, format =>
      format.contentField === record.contentField
    ).fileName;
    const fileNameFieldValues = getFieldValuesFromFileName(record.fileName, fileNameTemplate);
    const sysId = fileNameFieldValues.sys_id;

    // get stats for matching files
    const filePath = path.resolve(folderPath, record.fileName);

    fsStatPromises.push(
      statAsync(filePath)
        .then(stats => {
          if (!fileStatsBySysIdByPath[sysId]) {
            fileStatsBySysIdByPath[sysId] = {};
          }

          fileStatsBySysIdByPath[sysId][filePath] = {
            field: record.contentField,
            stats
          };
        })
        .catch(() => {
          // record all fields that are missing files
          if (!missingFieldsBySysId[sysId]) {
            missingFieldsBySysId[sysId] = [];
          }

          missingFieldsBySysId[sysId].push(record.contentField);
        })
    );
  });

  return Promise.all(fsStatPromises)
    .then(() => ({
      fileStatsBySysIdByPath,
      missingFieldsBySysId
    }));
}
exports.getSyncedFileStatsForTable = getSyncedFileStatsForTable;

/**
 * Filters out all tables that aren’t synced to local files.
 *
 * @returns {object} The new records configuration object
 */
function getRecordsToSync() {
  const { records } = parseConfigFile();
  const recordsToSync = {};

  _.forEach(records, (tableRecords, table) => {
    if (tableRecords.length) {
      recordsToSync[table] = tableRecords;
    }
  });

  return recordsToSync;
}
exports.getRecordsToSync = getRecordsToSync;

/**
 * Retrieves all of the records for a ServiceNow table that are synced to local files.
 *
 * @param {string} table ServiceNow table’s API Name
 * @param {string[]} sysIds An array of sys_ids
 * @returns {promise.<object[]>} Promise resolving to the array of retrieved record objects
 */
function getSyncedRecordsForTable(table, sysIds) {
  let fieldsToRetrieve = getFieldsToRetrieve(table);

  fieldsToRetrieve = _.map(fieldsToRetrieve, name => {
    if (name === 'sys_scope') {
      return 'sys_scope.scope';
    }

    return name;
  });

  const url = buildTableApiUrl(table, {
    displayValue: false,
    fields: [...fieldsToRetrieve, 'sys_updated_on'],
    query: `sys_idIN${sysIds.join('%2C')}`
  });

  return get(url)
    .then(response => response.result)
    .then(records => {
      _.forEach(records, record => {
        if (record['sys_scope.scope']) {
          record.sys_scope = record['sys_scope.scope'];
          delete record['sys_scope.scope'];
        }
      });
      return records;
    });
}
exports.getSyncedRecordsForTable = getSyncedRecordsForTable;

/**
 * Compares a ServiceNow record’s datetime field with a file’s modified time.
 *
 * @param {(date|moment)} fileModifiedTime The file’s modified time
 * @param {(string|moment)} sysUpdatedOn The ServiceNow record’s datetime value
 * @returns {boolean} True if the file is same or newer than the ServiceNow record
 */
function isFileNewerThanRecord(fileModifiedTime, sysUpdatedOn) {
  let mSysUpdatedOn = sysUpdatedOn;
  if (!sysUpdatedOn._isAMomentObject) { // eslint-disable-line no-underscore-dangle
    mSysUpdatedOn = convertServiceNowDatetimeToMoment(sysUpdatedOn);
  }

  let mFileModifiedTime = fileModifiedTime;
  if (!fileModifiedTime._isAMomentObject) { // eslint-disable-line no-underscore-dangle
    mFileModifiedTime = moment.utc(fileModifiedTime.toISOString());
  }

  return mFileModifiedTime.isSameOrAfter(mSysUpdatedOn);
}
exports.isFileNewerThanRecord = isFileNewerThanRecord;

/**
 * Performs a one-time sync between ServiceNow records and local files for a given table.
 *
 * @param {string} table ServiceNow table’s API Name
 * @returns {promise}
 */
function initSyncAllFilesForTable(table) {
  let savedFileStatsBySysIdByPath;
  return getSyncedFileStatsForTable(table)
    .then(({ fileStatsBySysIdByPath, missingFieldsBySysId }) => {
      savedFileStatsBySysIdByPath = fileStatsBySysIdByPath;
      const sysIds = _.concat(
        _.keys(fileStatsBySysIdByPath),
        _.keys(missingFieldsBySysId)
      );

      if (!sysIds.length) {
        throw new Error(`No local files found for table ${table}.`);
      }

      return getSyncedRecordsForTable(table, _.uniq(sysIds));
    })
    .then(apiRecords => {
      if (!apiRecords) {
        throw new Error(`The records for table \`${table}\` in the ServiceNow instance do not exist.`);
      }

      return syncAllFilesForTable(table, apiRecords, savedFileStatsBySysIdByPath);
    });
}
exports.initSyncAllFilesForTable = initSyncAllFilesForTable;

/**
 * Performs a one-time sync between ServiceNow records and local files for a given table.
 *
 * @param {string} table ServiceNow table’s API Name
 * @param {object[]} apiRecords Array of table records retrieved from the ServiceNow Table API
 * @param {object} fileStatsBySysIdByPath
 * @returns {promise}
 */
function syncAllFilesForTable(table, apiRecords, fileStatsBySysIdByPath) {
  return Promise.map(apiRecords, record =>
    syncRecord(table, record, fileStatsBySysIdByPath[record.sys_id])
  )
    .catch( err => {
      throw err;
    });
}
exports.syncAllFilesForTable = syncAllFilesForTable;

/**
 * Does a dry-run sync for a record.
 *
 * @param {string} table ServiceNow table’s API Name
 * @param {object} recordData key:value hash of the full ServiceNow record
 * @param {object} fileStatsByPaths existing files sync’d to the ServiceNow record
 * @returns {Promise} Promise -> object with data to be uploaded and files to be written.
 */
function calculateSyncRecordData(table, recordData, fileStatsByPaths) {
  const updatedOnMoment = convertServiceNowDatetimeToMoment(recordData.sys_updated_on);
  const sync = {
    updateRecordData: {},
    filesToUpdate: {},
    missingFileFields: {}
  };
  const filePromises = [];

  const nondataFields = _.concat(getFileNameFields(table), ['sys_id', 'sys_updated_on']);
  const fileData = _.omit(recordData, nondataFields);

  _.forEach(fileData, (val, key) => {
    const matchingFilePath = _.findKey(fileStatsByPaths, fsStat => fsStat.field === key);
    if (matchingFilePath) {
      const fileObj = fileStatsByPaths[matchingFilePath];
      const readFile = readFileAsync(matchingFilePath, 'utf8').then(fileContents => {
        if (recordData[fileObj.field] === fileContents) { return; }

        if (isFileNewerThanRecord(fileObj.stats.mtime, updatedOnMoment)) {
          sync.updateRecordData[fileObj.field] = fileContents;
        } else {
          sync.filesToUpdate[matchingFilePath] = recordData[fileObj.field];
        }
      });
      filePromises.push(readFile);
    } else {
      sync.missingFileFields[key] = val;
    }
  });

  return Promise.all(filePromises).then(() => sync);
}
exports.calculateSyncRecordData = calculateSyncRecordData;

/**
 * Compares the last updated time of the ServiceNow record against its matching local files’
 * modified times and does the following:
 *
 * If the local file’s time => ServiceNow record’s time,
 * upload file contents to the record’s matching field

 * If the local file’s time < ServiceNow record’s time,
 * update the file with the record’s field contents
 *
 * @param {string} table The Table’s API name
 * @param {object} recordData A hash of the ServiceNow record’s field:value
 * @param {string} recordData.sys_id The ServiceNow record’s sys_id value
 * @param {string} recordData.sys_updated_on The ServiceNow record’s sys_updated_on value
 * @param {object} fileStatsByPaths A hash of filePath:object
 * @param {string} fileStatsByPaths.field The field value of the ServiceNow record
 * @param {string} fileStatsByPaths.stats The fsStats object for the filePath
 *
 * @example
 * syncFile({
 *   recordData: {
 *     sys_id: '0181f08913ea7a00ca1e70a76144b0a3',
 *     html: '<some_field_content></some_field_content>',
 *     sys_updated_on: '2017-01-01 12:00:00'
 *   },
 *   fileStatsByPaths: {
 *     './now/sys_ui_page/example_ui_page-html-0181f08913ea7a00ca1e70a76144b0a3.html': {
 *       field: 'html',
 *       stats: { mtime: 'Tue May 16 2017 15:36:45 GMT-0500 (CDT)' } // an fs.Stats object
 *     }
 *   },
 *   table: 'sys_ui_page'
 * })
 * @returns {promise}
 */
function syncRecord(table, recordData, fileStatsByPaths) {
  return calculateSyncRecordData(table, recordData, fileStatsByPaths).then(syncData => {
    const promises = _.map(syncData.filesToUpdate, (content, filePath) =>
      writeFileAsync(filePath, content, 'utf8').then(() => {
        console.log(`Updated local file: ${trimCwd(filePath)}`); // eslint-disable-line no-console
      })
    );

    if (!_.isEmpty(syncData.updateRecordData)) {
      promises.push(
        updateRecord(table, recordData.sys_id, syncData.updateRecordData)
      );
    }

    if (!_.isEmpty(syncData.missingFileFields)) {
      let filesToWrite = generateFilesToWriteForRecord(table, recordData);
      filesToWrite = _.filter(filesToWrite, fileObj =>
        typeof syncData.missingFileFields[fileObj.contentField] !== 'undefined'
      );
      promises.push(
        writeFilesForTable(table, filesToWrite)
      );
    }

    return Promise.all(promises);
  });
}
exports.syncRecord = syncRecord;
