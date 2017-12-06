const _ = require('lodash');
const moment = require('moment');

const { get, put } = require('./api');
const { logInfo } = require('./logging');
const { parseConfigFile } = require('./config');

/**
 * Creates a Table API url based on given table name and options. See http://wiki.servicenow.com/index.php?title=Table_API#GET_.2Fapi.2Fnow.2Fv1.2Ftable.2F.28tableName.29 for details.
 *
 * @param {string} tableName The ServiceNow Table’s API name
 * @param {object} opts Table API options
 * @param {string[]} opts.fields The field names to retrieve values for.
 * @param {string} opts.view The ServiceNow view for that Table.
 * @param {number} [opts.limit=10000] The maximum number of records to retrieve.
 * @param {number} opts.offset The starting row of the result set.
 * @param {(string|boolean)} [opts.displayValue='all']
 * @param {boolean} opts.excludeReferenceLink
 * @param {string} opts.query The contents of the sysparm_query url parameter in list views.
 * @returns {string} the Table API url
 */
function buildTableApiUrl(tableName, opts) {
  return opts
    ? `${buildTableApiBaseUrl(tableName)}?${buildTableApiOptions(opts)}`
    : buildTableApiBaseUrl(tableName);
}
exports.buildTableApiUrl = buildTableApiUrl;

/**
 * Creates a Table API url based on a given table name.
 *
 * @param {string} tableName The ServiceNow Table’s API Name
 * @returns {string} Table API url
 */
function buildTableApiBaseUrl(tableName) {
  const url = getInstanceUrl();
  return `${url}/api/now/v1/table/${tableName}`;
}
exports.buildTableApiBaseUrl = buildTableApiBaseUrl;

/**
 * Creates a query parameter string based on options. See http://wiki.servicenow.com/index.php?title=Table_API#GET_.2Fapi.2Fnow.2Fv1.2Ftable.2F.28tableName.29 for details.
 *
 * @param {object} opts Table API options
 * @param {string[]} opts.fields The field names to retrieve values for.
 * @param {string} opts.view The ServiceNow view for that Table.
 * @param {number} [opts.limit=10000] The maximum number of records to retrieve.
 * @param {number} opts.offset The starting row of the result set.
 * @param {(string|boolean)} [opts.displayValue='all']
 * @param {boolean} opts.excludeReferenceLink
 * @param {string} opts.query The contents of the sysparm_query url parameter in list views.
 * @returns {string} the url parameter string
 */
function buildTableApiOptions(opts) {
  const defaultOpts = {
    fields: [],
    view: '',
    limit: 10000,
    offset: 0,
    displayValue: 'all',
    excludeReferenceLink: true,
    query: '' // needs to be URI-encoded (copy-pasting from the URL bar in ServiceNow is fine)
  };

  const optsQueryMap = {
    displayValue: 'sysparm_display_value',
    excludeReferenceLink: 'sysparm_exclude_reference_link',
    fields: 'sysparm_fields',
    limit: 'sysparm_limit',
    offset: 'sysparm_offset',
    query: 'sysparm_query',
    view: 'sysparm_view'
  };

  const finalOpts = _.assign({}, defaultOpts, opts);

  if (finalOpts.fields.indexOf('sys_id') === -1) {
    finalOpts.fields.push('sys_id');
  }
  finalOpts.fields = finalOpts.fields.join(',');

  // Input:  { limit: 10, query: 'stateIN0%2C2%5EORDERBYpriority' }
  // Output: 'sysparm_limit=10&sysparm_query=stateIN0%2C2%5EORDERBYpriority'
  const optStr = _.map(
    _.keys(finalOpts),
    optKey => `${optsQueryMap[optKey]}=${finalOpts[optKey]}`
  ).join('&');

  return optStr;
}
exports.buildTableApiOptions = buildTableApiOptions;

/**
 * Converts a datetime string from a ServiceNow record to a moment object in the UTC timezone.
 *
 * @param {string} datetimeStr A ServiceNow datetime string
 * @returns {moment} The moment format of the original date
 */
function convertServiceNowDatetimeToMoment(datetimeStr) {
  const recordDatetimeSplit = datetimeStr.split(' ');
  const isoStr = `${recordDatetimeSplit[0]}T${recordDatetimeSplit[1]}.000Z`;
  return moment.utc(isoStr);
}
exports.convertServiceNowDatetimeToMoment = convertServiceNowDatetimeToMoment;

/**
 * Converts a Javascript Date instance to a ServiceNow datetime string.
 *
 * @param {date} dateObj A Date instance
 * @returns {string} The ServiceNow datetime
 */
function convertDateToServiceNowDatetime(dateObj) {
  return moment.utc(dateObj.toISOString()).format('YYYY-MM-DD HH:mm:ss');
}
exports.convertDateToServiceNowDatetime = convertDateToServiceNowDatetime;

/**
 * Returns the configured ServiceNow instance URL.
 *
 * @returns {string} The instance url
 */
function getInstanceUrl() {
  const { url } = parseConfigFile(true);
  return url;
}
exports.getInstanceUrl = getInstanceUrl;

/**
 * Retrieves field values for a ServiceNow record.
 *
 * @param {string} table ServiceNow table’s API Name
 * @param {string} sysId ServiceNow record’s sys_id
 * @param {string[]} fields Array of field names
 * @returns {promise} A promise resolving to the record object
 */
function getRecord(table, sysId, fields) {
  const url = `${buildTableApiBaseUrl(table)}/${sysId}?${buildTableApiOptions({
    fields,
    displayValue: false
  })}`;

  return get(url)
    .then(response => response.result)
    .then(record => {
      if (record['sys_scope.scope']) {
        record.sys_scope = record['sys_scope.scope'];
        delete record['sys_scope.scope'];
      }

      if (record['web_service_definition.service_id']) {
        record.web_service_definition =
          record['web_service_definition.service_id'];
        delete record['web_service_definition.service_id'];
      }

      return record;
    })
    .catch(e => {
      throw new Error(
        `An error occurred when retrieving record information: ${table}.${
          sysId
        }.\n${e}`
      );
    });
}
exports.getRecord = getRecord;

/**
 * Updates a ServiceNow record with given field values
 *
 * @param {string} table Table API Name
 * @param {string} sysId Record sys_id
 * @param {object} body An object containing field:value hashes
 * @returns {promise} The promise of the API call
 */
async function updateRecord(table, sysId, body) {
  const url = `${buildTableApiBaseUrl(table)}/${sysId}`;
  const filteredBody = _.omit(body, ['sys_id']);

  const opts = {
    body: JSON.stringify(filteredBody)
  };

  const call = await put(url, opts);

  logInfo(
    `Updated ServiceNow record: ${table}/${sysId} with fields: ${_.keys(
      filteredBody
    ).join(', ')}`
  );

  return call;
}
exports.updateRecord = updateRecord;
