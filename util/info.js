const _ = require('lodash');
const path = require('path');

const { get } = require('./api');
const { logError, logInfo } = require('./logging');
const { parseConfigFile } = require('./config');

/**
 * Retrieves the configured ServiceNow Instance’s version.
 *
 * @returns {promise} Promise resolving to the raw version string
 */
function getInstanceVersion() {
  const { url } = parseConfigFile(true);
  const start = Date.now();

  return get(
    `${url}/api/now/table/sys_properties?sysparm_query=name%3Dglide.war`
  )
    .then(response => {
      if (response.status === 'failure' && response.error) {
        throw new Error(response.error.message);
      }

      const latency = `${Date.now() - start}ms`;

      return {
        version: response.result[0].value,
        latency
      };
    })
    .catch(err => {
      logError(`\n${err.toString()}`);
    });
}
exports.getInstanceVersion = getInstanceVersion;

/**
 * Takes a raw glide version string and returns the cleaned version.
 *
 * @param {string} rawVersionStr Raw version string
 * @returns {string} Cleaned version string
 */
function formatVersion(rawVersionStr) {
  const pathObj = path.parse(rawVersionStr);
  const versionName = pathObj.name;

  const glideStr = 'glide-';
  const indexOfGlideStr = versionName.indexOf(glideStr);

  return indexOfGlideStr === 0
    ? versionName.substr(glideStr.length)
    : versionName;
}
exports.formatVersion = formatVersion;

/**
 * Prints out information regarding the ServiceNow instance to the console.
 *
 * @param {object} info An object with information about the instance
 */
function printInfo(info) {
  const { url } = parseConfigFile(true);
  const infoStrStart = `

Instance info
=============
${getInfoLine(url, 'URL')}
`;

  const infoStrArr = _.map(info, getInfoLine);
  const infoStrJoined = `${infoStrArr.join('\n')}
`;

  logInfo(`${infoStrStart}${infoStrJoined}`);
}
exports.printInfo = printInfo;

/**
 * Returns a single line of information used for printing
 *
 * @param {string} value Value to print
 * @param {string} key Type of value
 * @returns {string} Formatted line of information
 */
function getInfoLine(value, key) {
  return `${_.padEnd(`${key}:`, 12)} ${value}`;
}
exports.getInfoLine = getInfoLine;
