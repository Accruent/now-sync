const path = require('path');

exports.DEFAULT_CONFIG = require('./default-config');
exports.FILE_CONFIGS = require('./file-configs');

const CONFIG_FILE_NAME = '.now-sync.yml';
exports.CONFIG_FILE_NAME = CONFIG_FILE_NAME;
exports.CONFIG_FILE_PATH = path.resolve(process.cwd(), CONFIG_FILE_NAME);

const AUTH_FILE_NAME = '.now-sync-auth.yml';
exports.AUTH_FILE_NAME = AUTH_FILE_NAME;
exports.AUTH_FILE_PATH = path.resolve(process.cwd(), AUTH_FILE_NAME);

exports.NUM_CONCURRENT_REQUESTS = 48;
