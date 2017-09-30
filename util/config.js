const fs = require('fs');
const _ = require('lodash');
const yaml = require('js-yaml');
const { AUTH_FILE_PATH, CONFIG_FILE_PATH } = require('./../constants');
const defaultConfig = require('../constants/default-config');

/**
 * Generates a JSON object for the file configs.
 *
 * @param {string} filePath a relative file path
 * @returns {object} The file config object
 */
function generateConfig(filePath) {
  const finalConfig = _.assign({}, defaultConfig, { filePath });

  const config = parseConfigFile();
  if (config) {
    finalConfig.records = config.records;
  }

  return finalConfig;
}
exports.generateConfig = generateConfig;

/**
 * Generates a JSON object for the authentication configs.
 *
 * @param {string} instanceUrl ServiceNow instance url
 * @param {string} username ServiceNow user name
 * @param {string} password ServiceNow user password
 * @returns {object} The auth object
 */
function generateAuthConfig(instanceUrl, username, password) {
  return {
    url: instanceUrl,
    // TODO: OAuth support
    type: 'Basic',
    key: Buffer.from(`${username}:${password}`).toString('base64')
  };
}
exports.generateAuthConfig = generateAuthConfig;

/**
 * Parses and returns the configuration object.
 *
 * @param {boolean} isAuth Whether to parse the .now-sync.yml or .now-sync-auth.yml file
 * @returns {object} The config JSON object
 */
function parseConfigFile(isAuth) {
  const filePath = isAuth ? AUTH_FILE_PATH : CONFIG_FILE_PATH;
  let config;

  try {
    config = yaml.safeLoad(fs.readFileSync(filePath, { encoding: 'utf8' }));
  } catch (err) {
    config = false;
  }

  return config;
}
exports.parseConfigFile = parseConfigFile;

/**
 * Saves a given JSON object as the .now-sync.yml or .now-sync-auth.yml configuration file.
 *
 * @param {object} configJson The config JSON object
 * @param {boolean} isAuth Whether to save to the auth config file or not
 * @returns {undefined}
 */
function saveConfigFile(configJson, isAuth) {
  if (!configJson) {
    throw new Error('Argument `configJson` not valid.');
  }

  const configFilePath = isAuth ? AUTH_FILE_PATH : CONFIG_FILE_PATH;

  fs.writeFileSync(configFilePath, yaml.safeDump(configJson));
  console.log(`Created/updated \`${configFilePath}\``); // eslint-disable-line no-console
}
exports.saveConfigFile = saveConfigFile;
