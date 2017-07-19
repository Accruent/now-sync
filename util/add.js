const _ = require('lodash');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const Promise = require('bluebird');
const { parseConfigFile, saveConfigFile } = require('./config');
const { compileFileName, getFileNameFields, trimCwd } = require('./file-naming');
const { convertServiceNowDatetimeToMoment, getRecord } = require('./service-now');

const writeFileAsync = Promise.promisify(fs.writeFile);
const utimesAsync = Promise.promisify(fs.utimes);

/**
 * Creates an array of file data for a ServiceNow record.
 *
 * @param {string} table ServiceNow table’s API name
 * @param {object} fieldValues A field:value hash representing a ServiceNow record
 *
 * @typedef {object} fileContentObj
 * @property {string} contentField
 * @property {string} fileName
 * @property {string} fileContent
 *
 * @returns {fileContentObj[]} An array of file content objects
 */
function generateFilesToWriteForRecord(table, fieldValues) {
  const config = parseConfigFile();

  return _.map(config.config[table].formats, ({ fileName: fileTemplate, contentField }) => ({
    contentField,
    fileName: compileFileName(fileTemplate, fieldValues),
    fileContent: fieldValues[contentField],
    fileMtime: convertServiceNowDatetimeToMoment(fieldValues.sys_updated_on).unix()
  }));
}
exports.generateFilesToWriteForRecord = generateFilesToWriteForRecord;

/**
 * Generates an array of field names to be used for syncing a table record to local files.
 *
 * @param {string} table ServiceNow table’s API Name
 * @returns {string[]} An array of the table’s field names
 */
function getFieldsToRetrieve(table) {
  const config = parseConfigFile();
  const recordFields = getFileNameFields(table);
  const contentFields = _.map(
    config.config[table].formats,
    ({ contentField }) => contentField
  );

  recordFields.push('sys_updated_on');

  return _.uniq( recordFields.concat(contentFields) );
}
exports.getFieldsToRetrieve = getFieldsToRetrieve;

/**
 * Retrieves the field values for a specific record from the ServiceNow instance.
 *
 * @param {string} table ServiceNow table’s API Name
 * @param {string} sysId The record sys_id
 * @returns {promise} Promise resolving to an object with the ServiceNow record’s field values
 */
function getFieldValues(table, sysId) {
  let fieldsToRetrieve = getFieldsToRetrieve(table);
  fieldsToRetrieve = _.map(fieldsToRetrieve, name => {
    if (name === 'sys_scope') {
      return 'sys_scope.scope';
    }

    if (name === 'web_service_definition') {
      return 'web_service_definition.service_id';
    }

    return name;
  });

  return getRecord(table, sysId, fieldsToRetrieve).then(record => {
    if (record['sys_scope.scope']) {
      record.sys_scope = record['sys_scope.scope'];
      delete record['sys_scope.scope'];
    }

    if (record['web_service_definition.service_id']) {
      record.web_service_definition = record['web_service_definition.service_id'];
      delete record['web_service_definition.service_id'];
    }

    return record;
  });
}
exports.getFieldValues = getFieldValues;

/**
 * Writes local files given a table name and file content.
 *
 * @typedef {object} fileContentObj
 * @property {string} contentField
 * @property {string} fileName
 * @property {string} fileContent
 *
 * @param {string} table ServiceNow table’s API Name
 * @param {fileContentObj[]} filesToWrite Generated by generateFilesToWriteForRecord()
 */
function writeFilesForTable(table, filesToWrite) {
  const config = parseConfigFile();

  const writePath = path.resolve(process.cwd(), config.filePath, table);
  const writeFilePromises = [];

  if (!fs.existsSync(writePath)) {
    mkdirp.sync(writePath);
  }
  if (!config.records[table]) {
    config.records[table] = [];
  }

  _.forEach(filesToWrite, ({ contentField, fileName, fileContent, fileMtime }) => {
    const filePath = path.resolve(writePath, fileName);
    const formattedFileContent = fileContent.replace(
      new RegExp('\r\n', 'g'), // eslint-disable-line no-control-regex
      '\n'
    );

    writeFilePromises.push(
      writeFileAsync(filePath, formattedFileContent)
        .then(() => utimesAsync(filePath, fileMtime, fileMtime))
        .then(() => {
          console.log(`${trimCwd(filePath)} created.`); // eslint-disable-line no-console
        })
    );

    const recordConfigAlreadyExists = _.find(
      config.records[table],
      ({ fileName: configRecordFileName }) => fileName === configRecordFileName
    );

    if (!recordConfigAlreadyExists) {
      config.records[table].push({
        contentField,
        fileName
      });
    }
  });

  saveConfigFile(config);
  return Promise.all(writeFilePromises);
}
exports.writeFilesForTable = writeFilesForTable;
