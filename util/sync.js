const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const moment = require('moment');
const { promisify } = require('util');
const Promise = require('bluebird');

const {
  getFieldValuesFromFileName,
  getFileNameFields,
  trimCwd
} = require('./file-naming');
const {
  generateFilesToWriteForRecord,
  getFieldsToRetrieve,
  writeFilesForTable
} = require('./add');
const { parseConfigFile } = require('./config');
const { get } = require('./api');
const {
  buildTableApiUrl,
  convertServiceNowDatetimeToMoment,
  getRecord,
  updateRecord
} = require('./service-now');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const statAsync = promisify(fs.stat);

/**
 * Initializes the Sync functionality.
 *
 * @returns {Promise.<Object.<string, [{ createdFiles: string[], updatedFiles: string[], updatedRecordFields: string[] }]>>}
 */
async function sync() {
  const nonemptyRecords = getRecordsToSync();
  const nonemptyTables = _.keys(nonemptyRecords);

  const syncResponses = await Promise.all(
    _.map(nonemptyTables, table => initSyncAllFilesForTable(table))
  );

  const tableResponsePairs = _.map(nonemptyTables, (table, i) => [
    table,
    syncResponses[i]
  ]);
  return _.fromPairs(tableResponsePairs);
}
exports.sync = sync;

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
    const fileNameTemplate = _.find(
      tableConfig.formats,
      format => format.contentField === record.contentField
    ).fileName;
    const fileNameFieldValues = getFieldValuesFromFileName(
      record.fileName,
      fileNameTemplate
    );
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

  return Promise.all(fsStatPromises).then(() => ({
    fileStatsBySysIdByPath,
    missingFieldsBySysId
  }));
}
exports.getSyncedFileStatsForTable = getSyncedFileStatsForTable;

/**
 * Filters out all tables that aren’t synced to local files.
 *
 * @returns {object.<string, {contentField: string, fileName: string}[]>}
 * The new records configuration object in a table: record config array hash
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
  // eslint-disable-next-line no-underscore-dangle
  if (!sysUpdatedOn._isAMomentObject) {
    mSysUpdatedOn = convertServiceNowDatetimeToMoment(sysUpdatedOn);
  }

  let mFileModifiedTime = fileModifiedTime;
  // eslint-disable-next-line no-underscore-dangle
  if (!fileModifiedTime._isAMomentObject) {
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
async function initSyncAllFilesForTable(table) {
  const {
    fileStatsBySysIdByPath,
    missingFieldsBySysId
  } = await getSyncedFileStatsForTable(table);

  const savedFileStatsBySysIdByPath = fileStatsBySysIdByPath;
  const sysIds = _.concat(
    _.keys(fileStatsBySysIdByPath),
    _.keys(missingFieldsBySysId)
  );

  if (!sysIds.length) {
    throw new Error(`No local files found for table ${table}.`);
  }

  const apiRecords = await getSyncedRecordsForTable(table, _.uniq(sysIds));
  if (!apiRecords) {
    throw new Error(
      `The records for table \`${
        table
      }\` in the ServiceNow instance do not exist.`
    );
  }

  return syncAllFilesForTable(table, apiRecords, savedFileStatsBySysIdByPath);
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
  ).catch(err => {
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
async function calculateSyncRecordData(table, recordData, fileStatsByPaths) {
  const updatedOnMoment = convertServiceNowDatetimeToMoment(
    recordData.sys_updated_on
  );
  const syncObj = {
    updateRecordData: {},
    filesToUpdate: {},
    missingFileFields: {}
  };
  const filePromises = [];

  const nondataFields = _.concat(getFileNameFields(table), [
    'sys_id',
    'sys_updated_on'
  ]);
  const fileData = _.omit(recordData, nondataFields);

  _.forEach(fileData, (val, key) => {
    const matchingFilePath = _.findKey(
      fileStatsByPaths,
      fsStat => fsStat.field === key
    );
    if (matchingFilePath) {
      const fileObj = fileStatsByPaths[matchingFilePath];
      const readFile = readFileAsync(matchingFilePath, 'utf8').then(
        fileContents => {
          if (recordData[fileObj.field] === fileContents) {
            return;
          }

          if (isFileNewerThanRecord(fileObj.stats.mtime, updatedOnMoment)) {
            syncObj.updateRecordData[fileObj.field] = fileContents;
          } else {
            syncObj.filesToUpdate[matchingFilePath] = recordData[fileObj.field];
          }
        }
      );
      filePromises.push(readFile);
    } else {
      syncObj.missingFileFields[key] = val;
    }
  });

  await Promise.all(filePromises);
  return syncObj;
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
 * syncRecord(
 *   'sys_ui_page',
 *   {
 *     sys_id: '0181f08913ea7a00ca1e70a76144b0a3',
 *     html: '<some_field_content></some_field_content>',
 *     sys_updated_on: '2017-01-01 12:00:00'
 *   },
 *   {
 *     './now/sys_ui_page/example_ui_page-html-0181f08913ea7a00ca1e70a76144b0a3.html': {
 *       field: 'html',
 *       stats: { mtime: 'Tue May 16 2017 15:36:45 GMT-0500 (CDT)' } // an fs.Stats object
 *     }
 *   }
 * })
 * @returns {promise}
 */
async function syncRecord(table, recordData, fileStatsByPaths) {
  const syncData = await calculateSyncRecordData(
    table,
    recordData,
    fileStatsByPaths
  );

  let createdFiles = [];
  const updatedFiles = [];
  const updatedRecordFields = [];

  const promises = _.map(syncData.filesToUpdate, (content, filePath) =>
    writeFileAsync(filePath, content, 'utf8').then(() => {
      updatedFiles.push(trimCwd(filePath));
      // logInfo(`Updated local file: ${trimCwd(filePath)}`);
    })
  );

  if (!_.isEmpty(syncData.updateRecordData)) {
    promises.push(
      updateRecord(table, recordData.sys_id, syncData.updateRecordData).then(
        ({ body, response }) => {
          updatedRecordFields.push({ body, response });
        }
      )
    );
  }

  if (!_.isEmpty(syncData.missingFileFields)) {
    let filesToWrite = generateFilesToWriteForRecord(table, recordData);
    filesToWrite = _.filter(
      filesToWrite,
      fileObj =>
        typeof syncData.missingFileFields[fileObj.contentField] !== 'undefined'
    );
    promises.push(
      writeFilesForTable(table, filesToWrite).then(filesWritten => {
        createdFiles = createdFiles.concat(filesWritten);
      })
    );
  }

  await Promise.all(promises);
  return {
    createdFiles,
    updatedFiles,
    updatedRecordFields
  };
}
exports.syncRecord = syncRecord;

function pull() {
  const { config } = parseConfigFile();
  const recordsByTable = getRecordsToSync();

  const tableNames = _.keys(recordsByTable);
  const getRecordPromises = [];
  const recordsToPullByTable = {};
  let i;

  // prepping data to gather
  for (i = 0; i < tableNames.length; i++) {
    const table = tableNames[i];
    const tableRecords = recordsByTable[table];
    const tableFileFormats = config[table].formats;

    if (!recordsToPullByTable[table]) {
      recordsToPullByTable[table] = [];
    }

    const tableRecordsToPull = recordsToPullByTable[table];

    let j;
    for (j = 0; j < tableRecords.length; j++) {
      const { contentField, fileName } = tableRecords[j];
      const { fileName: fileTemplate } = _.find(
        tableFileFormats,
        format => format.contentField === contentField
      );
      const fieldValues = getFieldValuesFromFileName(fileName, fileTemplate);

      tableRecordsToPull.push(fieldValues.sys_id);
    }
  }

  // getting record data
  for (i = 0; i < tableNames.length; i++) {
    const table = tableNames[i];
    const tableRecordsToPull = recordsToPullByTable[table];

    let j;
    for (j = 0; j < tableRecordsToPull.length; j++) {
      const sysId = tableRecordsToPull[j];

      getRecordPromises.push(
        getRecord(table, sysId, getFieldsToRetrieve(table)).then(recordData => {
          // write files
          const filesToWrite = generateFilesToWriteForRecord(table, recordData);
          return writeFilesForTable(table, filesToWrite);
        })
      );
    }
  }

  return Promise.all(getRecordPromises);
}
exports.pull = pull;

/**
 * Copies content of all local synced files to their respective ServiceNow records.
 *
 * @returns {promise<object[]>} The JSON responses of the update calls
 */
async function push() {
  const tableNames = _.keys(getRecordsToSync());
  const syncedFileStats = await Promise.map(tableNames, table =>
    getSyncedFileStatsForTable(table)
  );
  const tableUpdates = {};

  try {
    await Promise.map(tableNames, async (table, i) => {
      const { fileStatsBySysIdByPath } = syncedFileStats[i];
      const sysIds = _.keys(fileStatsBySysIdByPath);

      const updateRecordResponses = await Promise.map(sysIds, async sysId => {
        const fileStatsByPath = fileStatsBySysIdByPath[sysId];
        const updateRecordData = {};

        await Promise.map(_.keys(fileStatsByPath), filePath =>
          readFileAsync(filePath, 'utf8').then(fileContent => {
            updateRecordData[fileStatsByPath[filePath].field] = fileContent;
          })
        );
        return updateRecord(table, sysId, updateRecordData);
      });

      tableUpdates[table] = updateRecordResponses;
    });
  } catch (e) {
    throw e;
  }
  return tableUpdates;
}
exports.push = push;
