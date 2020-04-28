const fs = require('fs');
const _ = require('lodash');
const prettier = require('prettier');
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
  const config = parseConfigFile();
  return _.merge({}, defaultConfig, config || {}, { filePath });
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
    key: Buffer.from(`${username}:${password}`).toString('base64'),
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
 * @returns {string} config file path
 */
function saveConfigFile(configJson, isAuth) {
  if (!configJson) {
    throw new Error('Argument `configJson` not valid.');
  }

  const configFilePath = isAuth ? AUTH_FILE_PATH : CONFIG_FILE_PATH;
  const configYamlStr = yaml.safeDump(sortConfig(configJson));
  const prettyYamlStr = prettier.format(configYamlStr);

  fs.writeFileSync(configFilePath, prettyYamlStr);
  return configFilePath;
}
exports.saveConfigFile = saveConfigFile;

function sortConfig(configJson) {
  if (_.isPlainObject(configJson)) {
    const keys = _.sortBy(_.keys(configJson));
    let i;

    const newConfig = {};
    for (i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (typeof configJson[key] === 'object') {
        newConfig[key] = sortConfig(configJson[key]);
      } else {
        newConfig[key] = configJson[key];
      }
    }

    return newConfig;
  } else if (_.isArray(configJson) && configJson.length) {
    switch (typeof configJson[0]) {
      case 'string': {
        return _.sortBy(configJson);
      }

      case 'object': {
        const newConfig = _.map(configJson, sortConfig);
        return _.sortBy(newConfig, ['fileName']);
      }

      default:
        break;
    }
  }

  return configJson;
}
exports.sortConfig = sortConfig;
