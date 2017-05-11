const path = require('path');
const FILE_CONFIGS = require('./file-configs');
const DEFAULT_CONFIG = require('./default-config');

const CONFIG_FILE_NAME = '.now-sync.yml';
const CONFIG_FILE_PATH = path.resolve(process.cwd(), CONFIG_FILE_NAME);
const AUTH_FILE_NAME = '.now-sync-auth.yml';
const AUTH_FILE_PATH = path.resolve(process.cwd(), AUTH_FILE_NAME);

module.exports = {
  AUTH_FILE_NAME,
  AUTH_FILE_PATH,
  CONFIG_FILE_NAME,
  CONFIG_FILE_PATH,
  DEFAULT_CONFIG,
  FILE_CONFIGS
};
